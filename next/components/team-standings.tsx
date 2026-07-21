import Link from "next/link";
import { getTeam, sortedStandings, teamTotal } from "@/lib/tournament-data";
import { Card } from "@/components/ui";

const sourceColors = {
  football: "var(--football)",
  cricket: "var(--cricket)",
  handball: "var(--handball)",
  discipline: "var(--discipline)",
};

export function TeamStandings({ detailed = false }: { detailed?: boolean }) {
  const maxTotal = Math.max(...sortedStandings.map((row) => teamTotal(row.teamId)));

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Combined standings</p>
          <h2 className="mt-1 text-xl font-black text-white">Team chart</h2>
        </div>
        <Link href="/dashboard/standings" className="text-sm font-bold text-primary hover:brightness-110">
          Full table
        </Link>
      </div>

      <div className="space-y-4">
        {sortedStandings.map((row, index) => {
          const team = getTeam(row.teamId);
          const total = teamTotal(row.teamId);
          const width = Math.max((total / maxTotal) * 100, 8);
          const positiveDiscipline = Math.max(row.discipline, 0);

          return (
            <div key={team.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-black text-black" style={{ backgroundColor: team.accent }}>
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="safe-text font-black text-white">{team.name}</p>
                    <p className="text-sm text-muted">{row.wins} wins</p>
                  </div>
                </div>
                <p className="font-mono text-2xl font-black text-white">{total}</p>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/35">
                <div className="flex h-full rounded-full" style={{ width: `${width}%` }}>
                  <span style={{ width: `${(row.football / total) * 100}%`, backgroundColor: sourceColors.football }} />
                  <span style={{ width: `${(row.cricket / total) * 100}%`, backgroundColor: sourceColors.cricket }} />
                  <span style={{ width: `${(row.handball / total) * 100}%`, backgroundColor: sourceColors.handball }} />
                  {positiveDiscipline > 0 ? (
                    <span style={{ width: `${(positiveDiscipline / total) * 100}%`, backgroundColor: sourceColors.discipline }} />
                  ) : null}
                </div>
              </div>

              {detailed ? (
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <Breakdown label="Football" value={row.football} />
                  <Breakdown label="Cricket" value={row.cricket} />
                  <Breakdown label="Handball" value={row.handball} />
                  <Breakdown label="Discipline" value={row.discipline} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted">
        <Legend color="var(--football)" label="Football" />
        <Legend color="var(--cricket)" label="Cricket" />
        <Legend color="var(--handball)" label="Handball" />
        <Legend color="var(--discipline)" label="Discipline" />
      </div>
    </Card>
  );
}

function Breakdown({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-black/20 p-2">
      <p className="text-muted">{label}</p>
      <p className="font-mono text-lg font-black text-white">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
