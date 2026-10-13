import { supabase } from "@/lib/supabase";

type CreateListingInput = {
  eventId: string;
  ticketTypeId: string;
  type: "buy" | "sell";
  name: string;
  email: string;
  whatsapp: string;
  quantity: number;
  price: number;
};

export async function createListing(input: CreateListingInput) {
  const { data, error } = await supabase
    .from("listings")
    .insert({
      event_id: input.eventId,
      ticket_type_id: input.ticketTypeId,
      type: input.type,
      name: input.name,
      email: input.email,
      whatsapp: input.whatsapp,
      quantity: input.quantity,
      price: input.price,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Só fecha listings ativos, para não sobrescrever o closed_at original.
export async function closeListing(listingId: string) {
  const { error } = await supabase
    .from("listings")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("status", "active");

  if (error) throw error;
}
