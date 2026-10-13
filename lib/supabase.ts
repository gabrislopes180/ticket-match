import { createClient } from "@supabase/supabase-js";

// Cliente só de servidor: a chave secreta ignora o RLS e nunca pode chegar ao
// navegador. Não importe este arquivo em componentes com "use client".
if (typeof window !== "undefined") {
  throw new Error("lib/supabase.ts só pode ser usado no servidor.");
}

const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!secretKey) {
  throw new Error(
    "SUPABASE_SECRET_KEY não definida. Adicione a chave secreta do Supabase no .env.local.",
  );
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  secretKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

console.log("Supabase conectado!");
