import type { Metadata } from "next";
import { PublicArrivals } from "@/components/public-arrivals";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Timely Arrival",
};

export default function ArrivalsPage() {
  return (
    <PublicShell>
      <PublicArrivals />
    </PublicShell>
  );
}
