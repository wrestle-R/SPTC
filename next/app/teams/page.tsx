import type { Metadata } from "next";
import { PublicShell } from "@/components/public-shell";
import { TeamStandings } from "@/components/team-standings";

export const metadata: Metadata = { title: "Teams" };

export default function TeamsPage() {
  return (
    <PublicShell>
      <div className="flex flex-col gap-8">
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 sm:p-8 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Sports Fiesta</p>
            <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight">All Teams</h1>
            <p className="mt-2 text-sm text-zinc-400 max-w-lg">Combined placement points across football, handball, and cricket.</p>
          </div>
        </header>
        <TeamStandings />
      </div>
    </PublicShell>
  );
}
