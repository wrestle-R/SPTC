import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { TeamStandings } from "@/components/team-standings";

export const metadata: Metadata = { title: "Teams" };

export default function TeamsPage() {
  return (
    <PublicShell>
      <div className="flex flex-col gap-8">
        <TeamStandings />
      </div>
    </PublicShell>
  );
}
