import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { TeamStandings } from "@/components/team-standings";

export const metadata: Metadata = { title: "Teams" };

export default function TeamsPage() {
  return (
    <PublicShell>
      <div className="flex flex-col gap-8">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Sports Fiesta</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Teams</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">Combined placement points across football, handball, and cricket.</p>
        </header>
        <TeamStandings />
      </div>
    </PublicShell>
  );
}
