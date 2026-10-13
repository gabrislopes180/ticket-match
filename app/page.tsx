import Link from "next/link";
import { buttonVariants } from "@heroui/styles";

export default function Home() {
  return (
    <main className="bg-glow flex flex-1 flex-col px-4 pt-6 pb-12">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <p className="text-sm font-medium text-foreground">Ticket Match</p>

        <div className="flex flex-1 flex-col justify-center gap-8 py-16">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl leading-tight font-normal text-balance md:text-6xl">
              Encontre quem está comprando ou vendendo ingresso para o{" "}
              <span className="text-headline-accent">Retronejo</span>.
            </h1>
            <p className="text-base text-muted">
              Sem ficar procurando em vários grupos.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/comprar"
              className={buttonVariants({
                variant: "primary",
                size: "lg",
                fullWidth: true,
              })}
            >
              Quero comprar
            </Link>
            <Link
              href="/vender"
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                fullWidth: true,
              })}
            >
              Quero vender
            </Link>
          </div>

          <p className="text-[13px] text-muted">
            Cadastre sua busca ou anúncio. Avisamos quando aparecer alguém
            compatível.
          </p>
        </div>
      </div>
    </main>
  );
}
