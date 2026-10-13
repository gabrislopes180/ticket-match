"use server";

import { after } from "next/server";

import type {
  ListingFormState,
  ListingType,
  MatchSummary,
} from "@/lib/listing";
import { getCurrentEvent } from "@/services/events";
import { createListing } from "@/services/listings";
import { createMatches, findMatches } from "@/services/matches";
import { notifyMatch } from "@/services/notifications";

const GENERIC_ERROR = "Não foi possível salvar agora. Tente de novo.";

// Os erros do Supabase aparecem como "{}" no log se forem passados direto.
function describeError(error: unknown) {
  if (error && typeof error === "object") {
    const { code, message, details, hint } = error as Record<string, unknown>;
    return JSON.stringify({ code, message, details, hint });
  }

  return String(error);
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitListing(
  type: ListingType,
  formData: FormData,
): Promise<ListingFormState> {
  if (type !== "buy" && type !== "sell") {
    return { status: "error", message: GENERIC_ERROR };
  }

  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const whatsapp = text(formData, "whatsapp").replace(/\D/g, "");
  const ticketTypeId = text(formData, "ticketTypeId");
  const quantity = Number(text(formData, "quantity"));
  const price = Number(
    text(formData, "price").replace(/[^\d.,]/g, "").replace(",", "."),
  );

  const errors: Record<string, string> = {};

  if (name.length < 2) errors.name = "Informe seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Informe um email válido.";
  }
  if (whatsapp.length < 10 || whatsapp.length > 13) {
    errors.whatsapp = "Informe o WhatsApp com DDD.";
  }
  if (!ticketTypeId) errors.ticketTypeId = "Escolha o tipo de ingresso.";
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    errors.quantity = "Informe uma quantidade entre 1 e 20.";
  }
  if (!Number.isFinite(price) || price <= 0) {
    errors.price = "Informe um preço maior que zero.";
  }

  if (Object.keys(errors).length) {
    return { status: "error", errors };
  }

  let listing;
  let eventName: string;
  let ticketTypeName: string;

  try {
    const event = await getCurrentEvent();
    const ticketType = event?.ticketTypes.find((t) => t.id === ticketTypeId);

    if (!event || !ticketType) {
      return {
        status: "error",
        errors: { ticketTypeId: "Escolha o tipo de ingresso." },
      };
    }

    eventName = event.name;
    ticketTypeName = ticketType.name;

    listing = await createListing({
      eventId: event.id,
      ticketTypeId,
      type,
      name,
      email,
      whatsapp,
      quantity,
      price,
    });
  } catch (error) {
    console.error("Erro ao criar listing", describeError(error));
    return { status: "error", message: GENERIC_ERROR };
  }

  // O listing já está ativo: uma falha no match não deve virar erro de cadastro.
  let matches: MatchSummary[] = [];

  try {
    const compatible = await findMatches(listing);
    const created = await createMatches(listing, compatible);

    // O listing acabou de ser criado, então todo par compatível vira um match
    // novo: `created` cobre a lista inteira.
    const pairs = created.flatMap((match) => {
      const other = compatible.find(
        (candidate) =>
          candidate.id ===
          (type === "buy" ? match.seller_listing_id : match.buyer_listing_id),
      );

      return other ? [{ match, other }] : [];
    });

    // Os emails saem depois da resposta: o envio não atrasa o cadastro.
    if (pairs.length) {
      after(async () => {
        for (const { match, other } of pairs) {
          const buyer = type === "buy" ? listing : other;
          const seller = type === "buy" ? other : listing;

          await notifyMatch({
            matchId: match.id,
            buyerEmail: buyer.email,
            sellerEmail: seller.email,
            buyerName: buyer.name,
            sellerName: seller.name,
            eventName,
          });
        }
      });
    }

    // Sem WhatsApp: o contato acontece na página do match, onde é registrado.
    matches = pairs.map(({ match, other }) => ({
      matchId: match.id,
      name: other.name,
      quantity: other.quantity,
      price: other.price,
    }));
  } catch (error) {
    console.error("Erro ao buscar matches", describeError(error));
  }

  return {
    status: "done",
    result: { eventName, ticketTypeName, quantity, price, matches },
  };
}
