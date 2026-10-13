import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MatchUnavailable, MatchView } from "@/components/match-view";
import {
  firstName,
  formatPrice,
  formatQuantity,
  formatTicketType,
  whatsappUrl,
} from "@/lib/listing";
import type { MatchSide } from "@/lib/listing";
import { getMatchById } from "@/services/matches";
import type { MatchDetails } from "@/services/matches";

export const metadata: Metadata = {
  title: "Seu match",
};

type MatchPageProps = PageProps<"/matches/[id]">;

export default function MatchPage({ params, searchParams }: MatchPageProps) {
  return (
    <main className="flex flex-1 flex-col px-4 pt-6 pb-12">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-8">
        <Link href="/" className="w-fit text-sm font-medium text-foreground">
          Ticket Match
        </Link>

        {/* O match é lido a cada request, então fica atrás de um <Suspense>. */}
        <Suspense
          fallback={<p className="text-base text-muted">Carregando match…</p>}
        >
          <MatchContent params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

function whatsappMessage(side: MatchSide, match: MatchDetails) {
  const ticket = formatTicketType(match.ticketTypeName, match.audience);

  if (side === "buyer") {
    return (
      `Oi! Vi pela plataforma que você está vendendo ` +
      `${formatQuantity(match.seller.quantity)} ${ticket} para o ${match.eventName} ` +
      `por ${formatPrice(match.seller.price)}. Ainda está disponível?`
    );
  }

  return (
    `Oi! Vi pela plataforma que você está procurando ` +
    `${formatQuantity(match.buyer.quantity)} ${ticket} para o ${match.eventName}. ` +
    `Meu ingresso ainda está disponível.`
  );
}

async function MatchContent({ params, searchParams }: MatchPageProps) {
  const [{ id }, { type }] = await Promise.all([params, searchParams]);

  if (type !== "buyer" && type !== "seller") {
    return <MatchUnavailable />;
  }

  const match = await getMatchById(id).catch((error) => {
    console.error("Erro ao carregar match", error);
    return null;
  });

  if (!match) {
    return <MatchUnavailable />;
  }

  // Só os dados da outra parte que a tela usa chegam ao navegador.
  const isBuyer = type === "buyer";
  const own = isBuyer ? match.buyer : match.seller;
  const other = isBuyer ? match.seller : match.buyer;
  const ownClosed = own.listingStatus !== "active";
  const otherClosed = other.listingStatus !== "active";
  // O WhatsApp da outra parte só vai para a página enquanto o contato é possível.
  const canContact =
    !ownClosed &&
    !otherClosed &&
    (match.status === "pending" || match.status === "contacted");

  return (
    <MatchView
      matchId={match.id}
      side={type}
      status={match.status}
      person={firstName(other.name)}
      eventName={match.eventName}
      ticketLabel={formatTicketType(match.ticketTypeName, match.audience)}
      quantityLabel={formatQuantity(other.quantity)}
      priceLabel={
        isBuyer ? formatPrice(other.price) : `Até ${formatPrice(other.price)}`
      }
      ownPriceLabel={
        isBuyer
          ? `Seu limite era ${formatPrice(own.price)}`
          : `Seu anúncio: ${formatPrice(own.price)}`
      }
      ownListingClosed={ownClosed}
      otherListingClosed={otherClosed}
      whatsappHref={
        canContact
          ? whatsappUrl(other.whatsapp, whatsappMessage(type, match))
          : undefined
      }
    />
  );
}
