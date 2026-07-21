import { getTeam, type Fixture } from "@/lib/tournament-data";
import { Card, Pill } from "@/components/ui";

export function FixtureCard({ fixture, compact = false }: { fixture: Fixture; compact?: boolean }) {
  const teamA = getTeam(fixture.teamAId);
  const teamB = getTeam(fixture.teamBId);

  return (
    <Card className={compact ? "p-4" : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-muted">
            {fixture.sport} · {fixture.stage}
          </p>
          <p className="mt-1 text-sm text-muted-strong">{fixture.venue} · {fixture.time}</p>
        </div>
        <Pill tone={fixture.status === "Live" ? "live" : fixture.status === "Finished" ? "good" : "ready"}>{fixture.status}</Pill>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <ScoreSide name={teamA.name} color={teamA.accent} score={fixture.scoreA} />
        <span className="rounded-md bg-white/8 px-2 py-1 text-xs font-black text-muted">VS</span>
        <ScoreSide name={teamB.name} color={teamB.accent} score={fixture.scoreB} align="right" />
      </div>

      <p className="mt-4 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-muted-strong">
        {fixture.highlight}
      </p>
    </Card>
  );
}

function ScoreSide({
  name,
  score,
  color,
  align = "left",
}: {
  name: string;
  score: string;
  color: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <div className="mb-2 h-2 w-16 rounded-full" style={{ backgroundColor: color, marginLeft: align === "right" ? "auto" : undefined }} />
      <p className="safe-text text-sm font-black text-white">{name}</p>
      <p className="mt-2 font-mono text-4xl font-black text-white">{score}</p>
    </div>
  );
}
