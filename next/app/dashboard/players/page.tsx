import { Card, SectionHeader } from "@/components/ui";
import { getTeam, players, teams } from "@/lib/tournament-data";

export default function PlayersPage() {
  return (
    <div>
      <SectionHeader eyebrow="Players" title="Rosters and highlighted players" />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-xl font-black text-white">Highlighted players</h2>
          <div className="mt-4 space-y-3">
            {players.map((player) => {
              const team = getTeam(player.teamId);

              return (
                <div key={`${player.name}-${player.role}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="min-w-0">
                    <p className="safe-text font-black text-white">{player.name}</p>
                    <p className="text-sm text-muted">{player.role} · {team.name}</p>
                  </div>
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: team.accent }} />
                </div>
              );
            })}
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id}>
              <div className="mb-3 h-2 rounded-full" style={{ backgroundColor: team.accent }} />
              <h2 className="safe-text text-xl font-black text-white">{team.name}</h2>
              <p className="mt-1 text-sm text-muted">{team.roster.length} players</p>
              <div className="mt-4 max-h-56 space-y-2 overflow-auto pr-1">
                {team.roster.map((name) => (
                  <p key={name} className="rounded-md bg-white/[0.035] px-3 py-2 text-sm font-semibold text-muted-strong">{name}</p>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
