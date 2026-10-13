"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, Card, Chip, Spinner } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";

import { confirmDeal, rejectMatch, startContact } from "@/app/matches/actions";
import type { MatchActionResult } from "@/app/matches/actions";
import type { MatchSide, MatchStatus } from "@/lib/listing";

const COPY = {
  buyer: {
    matchVerb: "está vendendo",
    stillActive: "Sua busca continua ativa para novos matches.",
    closed: "Essa busca foi encerrada.",
    closeCta: "Encerrar minha busca",
    otherClosed: "já encerrou esse anúncio",
    ownClosed: "Você já encerrou essa busca.",
  },
  seller: {
    matchVerb: "está procurando",
    stillActive: "Seu anúncio continua ativo para novos matches.",
    closed: "Esse anúncio foi encerrado.",
    closeCta: "Encerrar meu anúncio",
    otherClosed: "já encerrou essa busca",
    ownClosed: "Você já encerrou esse anúncio.",
  },
} as const;

const GENERIC_ERROR = "Não foi possível salvar agora. Tente de novo.";

export type MatchViewProps = {
  matchId: string;
  side: MatchSide;
  status: MatchStatus;
  // Primeiro nome da outra parte.
  person: string;
  eventName: string;
  ticketLabel: string;
  quantityLabel: string;
  // Preço da outra parte e o do próprio usuário, já formatados.
  priceLabel: string;
  ownPriceLabel: string;
  ownListingClosed: boolean;
  otherListingClosed: boolean;
  // Só vem preenchido enquanto o contato ainda é possível.
  whatsappHref?: string;
};

export function MatchView(props: MatchViewProps) {
  const { matchId, side, status, person, whatsappHref } = props;
  const copy = COPY[side];
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const [stillNegotiating, setStillNegotiating] = useState(false);

  function run(action: () => Promise<MatchActionResult>) {
    setFailed(false);

    startTransition(async () => {
      const result = await action();
      if (!result.ok) setFailed(true);
    });
  }

  // O link abre o WhatsApp direto no clique (sem window.open depois de um
  // await, que o navegador bloquearia); o registro do contato segue em paralelo.
  const whatsappLink = (variant: "primary" | "tertiary") => (
    <a
      href={whatsappHref}
      rel="noopener noreferrer"
      target="_blank"
      className={buttonVariants({ variant, size: "lg", fullWidth: true })}
      onClick={() => run(() => startContact(matchId))}
    >
      Falar com {person} no WhatsApp
    </a>
  );

  const error = failed ? (
    <p className="text-sm text-danger" role="alert">
      {GENERIC_ERROR}
    </p>
  ) : null;

  const homeLink = (
    <Link
      href="/"
      className={buttonVariants({
        variant: "secondary",
        size: "lg",
        fullWidth: true,
      })}
    >
      Voltar para o início
    </Link>
  );

  if (status === "declined") {
    return (
      <Card className="shadow-card gap-6">
        <Card.Header className="gap-2">
          <Card.Title className="text-xl">Este match foi recusado.</Card.Title>
          <Card.Description className="text-base">
            {copy.stillActive}
          </Card.Description>
        </Card.Header>
        <Card.Footer>{homeLink}</Card.Footer>
      </Card>
    );
  }

  if (status === "completed") {
    return (
      <Card className="shadow-card gap-6">
        <Card.Header className="gap-2">
          <Card.Title className="text-xl">Negócio concluído 🎉</Card.Title>
          <Card.Description className="text-base">
            {props.ownListingClosed
              ? copy.closed
              : `${person} confirmou que vocês fecharam negócio. ${copy.stillActive}`}
          </Card.Description>
        </Card.Header>
        <Card.Footer className="flex-col gap-3">
          {props.ownListingClosed ? null : (
            <Button
              fullWidth
              isPending={pending}
              size="lg"
              variant="primary"
              onPress={() => run(() => confirmDeal(matchId, side))}
            >
              {pending ? <Spinner color="current" size="sm" /> : null}
              {copy.closeCta}
            </Button>
          )}
          {error}
          {homeLink}
        </Card.Footer>
      </Card>
    );
  }

  // Match ainda em aberto, mas um dos listings já foi encerrado por outro
  // negócio: não faz sentido convidar ninguém a entrar em contato.
  if (props.otherListingClosed || props.ownListingClosed) {
    return (
      <Card className="shadow-card gap-6">
        <Card.Header className="gap-2">
          <Card.Title className="text-xl">
            {props.otherListingClosed
              ? `${person} ${copy.otherClosed}.`
              : copy.ownClosed}
          </Card.Title>
          <Card.Description className="text-base">
            {props.otherListingClosed && !props.ownListingClosed
              ? copy.stillActive
              : "Este match não está mais disponível."}
          </Card.Description>
        </Card.Header>
        <Card.Footer>{homeLink}</Card.Footer>
      </Card>
    );
  }

  if (status === "contacted") {
    return (
      <Card className="shadow-card gap-6">
        <Card.Header className="gap-2">
          <Card.Title className="text-xl">E aí, deu certo?</Card.Title>
          <Card.Description className="text-base">
            Você conseguiu fechar negócio com {person}?
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <MatchSummary {...props} />
        </Card.Content>

        <Card.Footer className="flex-col gap-3">
          <Button
            fullWidth
            isPending={pending}
            size="lg"
            variant="primary"
            onPress={() => run(() => confirmDeal(matchId, side))}
          >
            {pending ? <Spinner color="current" size="sm" /> : null}
            Sim, consegui
          </Button>
          <Button
            fullWidth
            isDisabled={pending}
            size="lg"
            variant="secondary"
            onPress={() => setStillNegotiating(true)}
          >
            Ainda estou negociando
          </Button>
          {stillNegotiating ? (
            <p className="text-sm text-muted" role="status">
              Sem problemas. Quando fechar, volte aqui para avisar.
            </p>
          ) : null}
          {whatsappLink("tertiary")}
          {error}
        </Card.Footer>
      </Card>
    );
  }

  return (
    <Card className="shadow-card gap-6">
      <Card.Header className="items-start gap-4">
        <Chip color="success" variant="soft">
          <svg
            aria-hidden="true"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
          <Chip.Label>Match encontrado</Chip.Label>
        </Chip>
        <Card.Title className="text-xl">
          {person} {copy.matchVerb}
        </Card.Title>
      </Card.Header>

      <Card.Content>
        <MatchSummary {...props} />
      </Card.Content>

      <Card.Footer className="flex-col gap-3">
        {whatsappLink("primary")}
        <Button
          fullWidth
          isDisabled={pending}
          size="lg"
          variant="secondary"
          onPress={() => run(() => rejectMatch(matchId))}
        >
          Não tenho interesse
        </Button>
        {error}
      </Card.Footer>
    </Card>
  );
}

function MatchSummary({
  eventName,
  ticketLabel,
  quantityLabel,
  priceLabel,
  ownPriceLabel,
}: MatchViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Chip size="lg">{eventName}</Chip>
        <Chip size="lg">{ticketLabel}</Chip>
        <Chip size="lg">{quantityLabel}</Chip>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[2rem] leading-tight font-medium">{priceLabel}</p>
        <p className="text-sm text-muted">{ownPriceLabel}</p>
      </div>
    </div>
  );
}

export function MatchUnavailable() {
  return (
    <Card className="shadow-card gap-6">
      <Card.Header className="gap-2">
        <Card.Title className="text-xl">Match não encontrado</Card.Title>
        <Card.Description className="text-base">
          Confira se o link é o mesmo que você recebeu por email.
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <Link
          href="/"
          className={buttonVariants({
            variant: "secondary",
            size: "lg",
            fullWidth: true,
          })}
        >
          Voltar para o início
        </Link>
      </Card.Footer>
    </Card>
  );
}
