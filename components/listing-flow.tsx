"use client";

import { Suspense, use, useState, useTransition } from "react";
import type { FormEvent } from "react";
import {
  Button,
  Card,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";

import { submitListing } from "@/app/actions";
import type {
  ListingFormState,
  ListingResult as Result,
  ListingType,
} from "@/lib/listing";
import type { EventWithTicketTypes } from "@/services/events";

import { ListingResult } from "./listing-result";

const COPY = {
  buy: {
    title: "Encontre seu ingresso",
    text: "Deixe sua busca ativa e avisamos quando aparecer alguém compatível.",
    priceLabel: "Preço máximo (R$)",
    cta: "Criar busca",
  },
  sell: {
    title: "Encontre quem está procurando",
    text: "Cadastre seu ingresso e encontre pessoas que já estão procurando.",
    priceLabel: "Preço de venda (R$)",
    cta: "Anunciar ingresso",
  },
} as const;

type ListingFlowProps = {
  type: ListingType;
  eventPromise: Promise<EventWithTicketTypes | null>;
};

export function ListingFlow({ type, eventPromise }: ListingFlowProps) {
  const [result, setResult] = useState<Result | null>(null);
  const copy = COPY[type];

  if (result) {
    return <ListingResult type={type} result={result} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-[2rem] leading-tight font-normal text-balance md:text-[2.5rem]">
          {copy.title}
        </h1>
        <p className="text-base text-muted">{copy.text}</p>
      </header>

      <Card>
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Spinner aria-label="Carregando formulário" />
            </div>
          }
        >
          <ListingForm
            type={type}
            eventPromise={eventPromise}
            onDone={setResult}
          />
        </Suspense>
      </Card>
    </div>
  );
}

type ListingFormProps = ListingFlowProps & {
  onDone: (result: Result) => void;
};

function ListingForm({ type, eventPromise, onDone }: ListingFormProps) {
  const event = use(eventPromise);
  const [state, setState] = useState<ListingFormState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const copy = COPY[type];

  if (!event || !event.ticketTypes.length) {
    return (
      <p className="text-base text-muted">
        Os ingressos do Retronejo ainda não estão disponíveis por aqui. Tente de
        novo em instantes.
      </p>
    );
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const next = await submitListing(type, formData);

      if (next.status === "done") {
        onDone(next.result);
        return;
      }

      setState(next);
    });
  }

  const errors = state.status === "error" ? state.errors : undefined;
  const message = state.status === "error" ? state.message : undefined;

  return (
    <Form
      className="flex flex-col gap-4"
      validationErrors={errors}
      onSubmit={handleSubmit}
    >
      <TextField fullWidth isRequired autoComplete="name" name="name">
        <Label>Nome</Label>
        <Input placeholder="Como você se chama" />
        <FieldError />
      </TextField>

      <TextField
        fullWidth
        isRequired
        autoComplete="email"
        name="email"
        type="email"
      >
        <Label>Email</Label>
        <Input placeholder="voce@email.com" />
        <FieldError />
      </TextField>

      <TextField
        fullWidth
        isRequired
        autoComplete="tel"
        name="whatsapp"
        type="tel"
      >
        <Label>WhatsApp</Label>
        <Input placeholder="(11) 99999-9999" />
        <FieldError />
      </TextField>

      <Select
        fullWidth
        isRequired
        name="ticketTypeId"
        placeholder="Escolha o tipo"
      >
        <Label>Tipo de ingresso</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {event.ticketTypes.map((ticketType) => (
              <ListBox.Item
                key={ticketType.id}
                id={ticketType.id}
                textValue={ticketType.name}
              >
                {ticketType.name}
                {ticketType.audience === "male"
                  ? " (Masculino)"
                  : ticketType.audience === "female"
                    ? " (Feminino)"
                    : ""}{" "}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
        <FieldError />
      </Select>

      <TextField
        fullWidth
        isRequired
        defaultValue="1"
        inputMode="numeric"
        name="quantity"
        type="number"
      >
        <Label>Quantidade</Label>
        <Input max={20} min={1} step={1} />
        <FieldError />
      </TextField>

      <TextField fullWidth isRequired inputMode="decimal" name="price">
        <Label>{copy.priceLabel}</Label>
        <Input placeholder="100" />
        <FieldError />
      </TextField>

      {message ? (
        <p className="text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}

      <Button
        fullWidth
        className="mt-2"
        isPending={pending}
        size="lg"
        type="submit"
        variant="primary"
      >
        {pending ? <Spinner color="current" size="sm" /> : null}
        {copy.cta}
      </Button>
    </Form>
  );
}
