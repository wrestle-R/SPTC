import { Card, SectionHeader } from "@/components/ui";
import { getTeam, orangeCap, purpleCap, topScorers, type LeaderboardEntry } from "@/lib/tournament-data";

export default function LeaderboardsPage() {
  return (
    <div>
      <SectionHeader eyebrow="Leaderboards" title="Player awards and scoring leaders" />
      <div className="grid gap-5 lg:grid-cols-3">
        <Leaderboard title="Orange Cap" entries={orangeCap} />
        <Leaderboard title="Purple Cap" entries={purpleCap} />
        <Leaderboard title="Top Scorers" entries={topScorers} />
      </div>
    </div>
  );
}

function Leaderboard({ title, entries }: { title: string; entries: LeaderboardEntry[] }) {
  return (
    <Card>
      <h2 className="text-xl font-black text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {entries.map((entry, index) => {
          const team = getTeam(entry.teamId);

          return (
            <div key={`${title}-${entry.player}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg font-black text-black" style={{ backgroundColor: team.accent }}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="safe-text font-black text-white">{entry.player}</p>
                    <p className="text-sm text-muted">{team.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-2xl font-black text-white">{entry.value}</p>
                  <p className="text-xs font-bold text-muted">{entry.metric}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
