import { TeamStandings } from "@/components/team-standings";
import { Card, SectionHeader } from "@/components/ui";
import { getTeam, sortedStandings, teamTotal } from "@/lib/tournament-data";

export default function StandingsPage() {
  return (
    <div>
      <SectionHeader eyebrow="Standings" title="Combined team leaderboard" />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <TeamStandings detailed />
        <Card>
          <h2 className="text-xl font-black text-white">Detailed table</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Wins</th>
                  <th className="px-3 py-2">Football</th>
                  <th className="px-3 py-2">Cricket</th>
                  <th className="px-3 py-2">Handball</th>
                  <th className="px-3 py-2">Discipline</th>
                  <th className="px-3 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedStandings.map((row) => {
                  const team = getTeam(row.teamId);

                  return (
                    <tr key={team.id} className="bg-white/[0.035] text-muted-strong">
                      <td className="rounded-l-lg px-3 py-3 font-black text-white">{team.name}</td>
                      <td className="px-3 py-3">{row.wins}</td>
                      <td className="px-3 py-3">{row.football}</td>
                      <td className="px-3 py-3">{row.cricket}</td>
                      <td className="px-3 py-3">{row.handball}</td>
                      <td className="px-3 py-3">{row.discipline}</td>
                      <td className="rounded-r-lg px-3 py-3 font-mono font-black text-white">{teamTotal(team.id)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
