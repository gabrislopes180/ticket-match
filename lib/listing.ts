export type ListingType = "buy" | "sell";

// Lado do match que está vendo a página (/matches/[id]?type=buyer|seller).
export type MatchSide = "buyer" | "seller";

export type MatchStatus = "pending" | "contacted" | "completed" | "declined";

export type TicketAudience = "male" | "female" | "unisex";

export type MatchSummary = {
  matchId: string;
  name: string;
  quantity: number;
  price: number;
};

export type ListingResult = {
  eventName: string;
  ticketTypeName: string;
  quantity: number;
  price: number;
  matches: MatchSummary[];
};

export type ListingFormState =
  | { status: "idle" }
  | { status: "error"; message?: string; errors?: Record<string, string> }
  | { status: "done"; result: ListingResult };

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number) {
  return priceFormatter.format(value);
}

export function formatQuantity(quantity: number) {
  return `${quantity} ${quantity === 1 ? "ingresso" : "ingressos"}`;
}

export function formatTicketType(name: string, audience: TicketAudience) {
  if (audience === "male") return `${name} masculino`;
  if (audience === "female") return `${name} feminino`;

  return name;
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0];
}

// Números sem DDI são tratados como brasileiros (DDD + número).
export function whatsappUrl(whatsapp: string, message: string) {
  const digits = whatsapp.replace(/\D/g, "");
  const phone = digits.length <= 11 ? `55${digits}` : digits;

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
