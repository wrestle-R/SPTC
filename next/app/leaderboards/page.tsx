import { LeaderboardsView } from "@/components/leaderboards-view";
import { PublicShell } from "@/components/public-shell";

export default function LeaderboardsPage() {
  return (
    <PublicShell>
      <div className="flex flex-col gap-8">
        <header className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">Sports Fiesta</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Leaderboards</h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">Top scorers and cricket caps derived from live match events.</p>
        </header>
        <LeaderboardsView />
      </div>
    </PublicShell>
  );
}
