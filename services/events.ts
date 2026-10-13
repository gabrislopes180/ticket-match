import { supabase } from "@/lib/supabase";

export type TicketType = {
  id: string;
  name: string;
  audience: "male" | "female" | "unisex";
};

export type EventWithTicketTypes = {
  id: string;
  name: string;
  ticketTypes: TicketType[];
};

const EVENT_NAME = "Retronejo";

export async function getCurrentEvent(): Promise<EventWithTicketTypes | null> {
  const { data: event, error } = await supabase
    .from("events")
    .select("id, name")
    .ilike("name", `%${EVENT_NAME}%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!event) return null;

  const { data: ticketTypes, error: ticketTypesError } = await supabase
    .from("ticket_types")
    .select("id, name, audience")
    .eq("event_id", event.id)
    .order("name");

  if (ticketTypesError) throw ticketTypesError;

  return {
    id: event.id,
    name: event.name,
    ticketTypes: ticketTypes ?? [],
  };
}
