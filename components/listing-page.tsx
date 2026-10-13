import Link from "next/link";

import type { ListingType } from "@/lib/listing";
import { getCurrentEvent } from "@/services/events";

import { ListingFlow } from "./listing-flow";

export function ListingPage({ type }: { type: ListingType }) {
  // Sem await: o formulário resolve a promise dentro de um <Suspense>.
  const eventPromise = getCurrentEvent().catch((error) => {
    console.error("Erro ao carregar evento", error);
    return null;
  });

  return (
    <main className="flex flex-1 flex-col px-4 pt-6 pb-12">
      <div className="mx-auto flex w-full max-w-[520px] flex-col gap-8">
        <Link
          href="/"
          className="w-fit text-sm font-medium text-foreground"
        >
          Ticket Match
        </Link>

        <ListingFlow type={type} eventPromise={eventPromise} />
      </div>
    </main>
  );
}
