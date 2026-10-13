import type { MatchSide, MatchStatus, TicketAudience } from "@/lib/listing";
import { supabase } from "@/lib/supabase";
import { closeListing } from "@/services/listings";

type Listing = {
  id: string;
  event_id: string;
  ticket_type_id: string;
  type: "buy" | "sell";
  price: number;
  status: "active" | "closed" | "cancelled";
};

export async function findMatches(listing: Listing) {
  if (listing.type === "buy") {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("type", "sell")
      .eq("status", "active")
      .eq("event_id", listing.event_id)
      .eq("ticket_type_id", listing.ticket_type_id)
      .lte("price", listing.price);

    if (error) throw error;

    return data;
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("type", "buy")
    .eq("status", "active")
    .eq("event_id", listing.event_id)
    .eq("ticket_type_id", listing.ticket_type_id)
    .gte("price", listing.price);

  if (error) throw error;

  return data;
}

export async function createMatches(
  listing: Listing,
  compatibleListings: Listing[],
) {
  if (!compatibleListings.length) {
    return [];
  }

  const payload = compatibleListings.map((compatible) => {
    if (listing.type === "buy") {
      return {
        buyer_listing_id: listing.id,
        seller_listing_id: compatible.id,
      };
    }

    return {
      buyer_listing_id: compatible.id,
      seller_listing_id: listing.id,
    };
  });

  const { data, error } = await supabase
    .from("matches")
    .upsert(payload, {
      onConflict: "buyer_listing_id,seller_listing_id",
      ignoreDuplicates: true,
    })
    .select();

  if (error) throw error;

  return data;
}

export type MatchParty = {
  listingId: string;
  name: string;
  whatsapp: string;
  quantity: number;
  price: number;
  listingStatus: "active" | "closed" | "cancelled";
};

export type MatchDetails = {
  id: string;
  status: MatchStatus;
  contactStartedAt: string | null;
  eventName: string;
  ticketTypeName: string;
  audience: TicketAudience;
  buyer: MatchParty;
  seller: MatchParty;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isMatchId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

// Sem email: a página do match só precisa do nome e do WhatsApp de cada parte.
const PARTY_COLUMNS =
  "id, event_id, ticket_type_id, name, whatsapp, quantity, price, status";

export async function getMatchById(
  matchId: string,
): Promise<MatchDetails | null> {
  if (!isMatchId(matchId)) return null;

  const { data: match, error } = await supabase
    .from("matches")
    .select(
      "id, status, contact_started_at, buyer_listing_id, seller_listing_id",
    )
    .eq("id", matchId)
    .maybeSingle();

  if (error) throw error;
  if (!match) return null;

  const [buyerResult, sellerResult] = await Promise.all([
    supabase
      .from("listings")
      .select(PARTY_COLUMNS)
      .eq("id", match.buyer_listing_id)
      .maybeSingle(),
    supabase
      .from("listings")
      .select(PARTY_COLUMNS)
      .eq("id", match.seller_listing_id)
      .maybeSingle(),
  ]);

  if (buyerResult.error) throw buyerResult.error;
  if (sellerResult.error) throw sellerResult.error;

  const buyer = buyerResult.data;
  const seller = sellerResult.data;

  if (!buyer || !seller) return null;

  const [eventResult, ticketTypeResult] = await Promise.all([
    supabase
      .from("events")
      .select("name")
      .eq("id", seller.event_id)
      .maybeSingle(),
    supabase
      .from("ticket_types")
      .select("name, audience")
      .eq("id", seller.ticket_type_id)
      .maybeSingle(),
  ]);

  if (eventResult.error) throw eventResult.error;
  if (ticketTypeResult.error) throw ticketTypeResult.error;
  if (!eventResult.data || !ticketTypeResult.data) return null;

  const toParty = (listing: typeof buyer): MatchParty => ({
    listingId: listing.id,
    name: listing.name,
    whatsapp: listing.whatsapp,
    quantity: listing.quantity,
    price: Number(listing.price),
    listingStatus: listing.status,
  });

  return {
    id: match.id,
    status: match.status,
    contactStartedAt: match.contact_started_at,
    eventName: eventResult.data.name,
    ticketTypeName: ticketTypeResult.data.name,
    audience: ticketTypeResult.data.audience,
    buyer: toParty(buyer),
    seller: toParty(seller),
  };
}

// Só o primeiro clique grava: os filtros mantêm o horário original nos seguintes.
export async function markMatchAsContacted(matchId: string) {
  const { error } = await supabase
    .from("matches")
    .update({
      status: "contacted",
      contact_started_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .eq("status", "pending")
    .is("contact_started_at", null);

  if (error) throw error;
}

// Recusar o match não mexe no listing: ele continua ativo para novos matches.
export async function declineMatch(matchId: string) {
  const { error } = await supabase
    .from("matches")
    .update({ status: "declined" })
    .eq("id", matchId)
    .in("status", ["pending", "contacted"]);

  if (error) throw error;
}

// Fecha apenas o listing de quem confirmou. Se a outra parte confirmar depois,
// o match já está completed e só o listing dela é fechado.
export async function completeMatch(matchId: string, side: MatchSide) {
  const { data: match, error } = await supabase
    .from("matches")
    .update({ status: "completed" })
    .eq("id", matchId)
    .neq("status", "declined")
    .select("buyer_listing_id, seller_listing_id")
    .maybeSingle();

  if (error) throw error;
  if (!match) return false;

  await closeListing(
    side === "buyer" ? match.buyer_listing_id : match.seller_listing_id,
  );

  return true;
}
