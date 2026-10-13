import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Ticket Match — ingressos para o Retronejo",
    template: "%s — Ticket Match",
  },
  description:
    "Encontre quem está comprando ou vendendo ingresso para o Retronejo.",
};

export const viewport: Viewport = {
  themeColor: "#09001a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      className={`${poppins.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
