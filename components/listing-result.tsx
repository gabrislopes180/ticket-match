"use client";

import Link from "next/link";
import { Card, Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";

import { firstName, formatPrice, formatQuantity } from "@/lib/listing";
import type { ListingResult as Result, ListingType } from "@/lib/listing";

const COPY = {
  buy: {
    createdTitle: "Busca criada",
    createdText:
      "Sua busca continua ativa e você será avisado quando aparecer uma opção.",
    matchVerb: "está vendendo",
    ownPriceLabel: "Seu limite",
  },
  sell: {
    createdTitle: "Anúncio criado",
    createdText:
      "Seu anúncio continua ativo e você será avisado quando aparecer alguém procurando.",
    matchVerb: "está procurando",
    ownPriceLabel: "Seu preço",
  },
} as const;

type ListingResultProps = {
  type: ListingType;
  result: Result;
};

export function ListingResult({ type, result }: ListingResultProps) {
  const copy = COPY[type];
  const side = type === "buy" ? "buyer" : "seller";
  const { matches } = result;

  if (!matches.length) {
    return (
      <Card className="shadow-card gap-6">
        <Card.Header className="gap-2">
          <Card.Title className="text-xl">{copy.createdTitle}</Card.Title>
          <Card.Description className="text-base">
            Ainda não encontramos alguém compatível.
          </Card.Description>
          <Card.Description className="text-base">
            {copy.createdText}
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

  return (
    <div className="flex flex-col gap-4">
      {matches.map((match) => {
        const person = firstName(match.name);

        return (
          <Card key={match.matchId} className="shadow-card gap-6">
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

            <Card.Content className="gap-4">
              <div className="flex flex-wrap gap-2">
                <Chip size="lg">{result.ticketTypeName}</Chip>
                <Chip size="lg">{formatQuantity(match.quantity)}</Chip>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-[2rem] leading-tight font-medium">
                  {formatPrice(match.price)}
                </p>
                <p className="text-sm text-muted">
                  {copy.ownPriceLabel}: {formatPrice(result.price)}
                </p>
              </div>
            </Card.Content>

            {/* O contato e a recusa acontecem na página do match, onde ficam
                registrados. Abre em outra aba para não perder esta lista. */}
            <Card.Footer>
              <a
                href={`/matches/${match.matchId}?type=${side}`}
                rel="noopener"
                target="_blank"
                className={buttonVariants({
                  variant: "primary",
                  size: "lg",
                  fullWidth: true,
                })}
              >
                Ver match e falar com {person}
              </a>
            </Card.Footer>
          </Card>
        );
      })}
    </div>
  );
}
