import type { Metadata } from "next";
import { PublicEarlyBird } from "@/components/public-early-bird";
import { PublicShell } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Early Bird",
};

export default function EarlyBirdPage() {
  return (
    <PublicShell>
      <PublicEarlyBird />
    </PublicShell>
  );
}
