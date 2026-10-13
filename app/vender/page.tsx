import type { Metadata } from "next";

import { ListingPage } from "@/components/listing-page";

export const metadata: Metadata = {
  title: "Vender ingresso",
};

export default function VenderPage() {
  return <ListingPage type="sell" />;
}
