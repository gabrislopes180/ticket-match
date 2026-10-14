import type { MatchSide } from "@/lib/listing";
import { resend } from "@/lib/resend";
import { supabase } from "@/lib/supabase";

export type MatchEmailParams = {
  type: MatchSide;
  destination: string;
  matchId: string;
  buyerName: string;
  sellerName: string;
  eventName: string;
};

// Os nomes vêm do formulário e entram no HTML do email.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendMatchEmail({
  type,
  destination,
  matchId,
  buyerName,
  sellerName,
  eventName,
}: MatchEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const matchUrl = `${appUrl}/matches/${matchId}?type=${type}`;

  const isBuyer = type === "buyer";

  const recipientName = escapeHtml(isBuyer ? buyerName : sellerName);
  const otherPersonName = escapeHtml(isBuyer ? sellerName : buyerName);
  const safeEventName = escapeHtml(eventName);

  const subject = isBuyer
    ? `Encontramos alguém vendendo ingresso para ${eventName}`
    : `Encontramos alguém procurando ingresso para ${eventName}`;

  const matchDescription = isBuyer
    ? `
        Encontramos <strong>${otherPersonName}</strong> vendendo
        um ingresso compatível com a sua busca para
        <strong>${safeEventName}</strong>.
      `
    : `
        Encontramos <strong>${otherPersonName}</strong> procurando
        um ingresso compatível com o seu anúncio para
        <strong>${safeEventName}</strong>.
      `;

  const html = `
      <div
        style="
          font-family: Arial, sans-serif;
          background-color: #09001a;
          color: #ffffff;
          padding: 32px;
        "
      >
        <div
          style="
            max-width: 560px;
            margin: 0 auto;
            background-color: #160d27;
            border-radius: 24px;
            padding: 32px;
          "
        >
          <p
            style="
              margin: 0 0 12px;
              color: #9d76f8;
              font-size: 14px;
            "
          >
            Match encontrado
          </p>

          <h1
            style="
              margin: 0 0 24px;
              font-size: 28px;
              font-weight: 500;
              line-height: 1.3;
            "
          >
            Temos uma oportunidade para você
          </h1>

          <p
            style="
              margin: 0 0 16px;
              color: #ffffff;
              font-size: 16px;
              line-height: 1.6;
            "
          >
            Olá, ${recipientName}.
          </p>

          <p
            style="
              margin: 0 0 24px;
              color: #9a93a8;
              font-size: 16px;
              line-height: 1.6;
            "
          >
            ${matchDescription}
          </p>

          <a
            href="${matchUrl}"
            style="
              display: inline-block;
              padding: 14px 22px;
              background: linear-gradient(
                135deg,
                #60109d 0%,
                #8b17e9 100%
              );
              color: #ffffff;
              text-decoration: none;
              border-radius: 999px;
              font-size: 14px;
              font-weight: 500;
            "
          >
            Ver meu match
          </a>

          <p
            style="
              margin: 24px 0 0;
              color: #9a93a8;
              font-size: 13px;
              line-height: 1.5;
            "
          >
            Acesse a plataforma para ver os detalhes
            e entrar em contato pelo WhatsApp.
          </p>
        </div>
      </div>
    `;

  return resend.emails.send({
    from: `Ticket Match <${process.env.RESEND_FROM_EMAIL}>`,
    to: [destination],
    subject,
    html,
  });
}

type NotifyMatchParams = {
  matchId: string;
  buyerEmail: string;
  sellerEmail: string;
  buyerName: string;
  sellerName: string;
  eventName: string;
};

// Um lado falhar não impede o outro: cada *_notified_at só é gravado se o
// email daquele lado foi aceito pelo Resend.
export async function notifyMatch({
  matchId,
  buyerEmail,
  sellerEmail,
  buyerName,
  sellerName,
  eventName,
}: NotifyMatchParams) {
  const sides = [
    { type: "buyer", destination: buyerEmail, column: "buyer_notified_at" },
    { type: "seller", destination: sellerEmail, column: "seller_notified_at" },
  ] as const;

  await Promise.all(
    sides.map(async ({ type, destination, column }) => {
      try {
        const { error: sendError } = await sendMatchEmail({
          type,
          destination,
          matchId,
          buyerName,
          sellerName,
          eventName,
        });

        if (sendError) {
          console.error(`Erro ao enviar email de match (${type})`, sendError);
          return;
        }

        const { error } = await supabase
          .from("matches")
          .update({ [column]: new Date().toISOString() })
          .eq("id", matchId);

        if (error) throw error;
      } catch (error) {
        console.error(`Erro ao notificar match (${type})`, error);
      }
    }),
  );
}
