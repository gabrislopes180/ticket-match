import type { Metadata } from "next";

import { ListingPage } from "@/components/listing-page";

export const metadata: Metadata = {
  title: "Comprar ingresso",
};

export default function ComprarPage() {
  return <ListingPage type="buy" />;
}
