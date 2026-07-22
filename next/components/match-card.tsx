import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { MatchStatusBadge } from "@/components/match-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicMatch, PublicTeam } from "@/lib/web-types";

export function MatchCard({ match, teams, featured = false }: { match: PublicMatch; teams: PublicTeam[]; featured?: boolean }) {
  const home = teams.find((team) => team.id === match.homeTeamId);
  const away = teams.find((team) => team.id === match.awayTeamId);
  const isCricket = match.sport === "cricket";
  const homeScore = isCricket
    ? match.scoreSummary?.innings?.find((innings) => innings.battingTeamId === match.homeTeamId)
    : null;
  const awayScore = isCricket
    ? match.scoreSummary?.innings?.find((innings) => innings.battingTeamId === match.awayTeamId)
    : null;
  const href = `/${match.sport}/${match.id}`;
  const resultText = match.resultText || (match.status === "completed" ? "Result pending - organizer must confirm." : null);

  return (
    <Link href={href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className={featured ? "gap-0 overflow-hidden py-0 shadow-none ring-1 ring-primary/30 transition-colors hover:border-primary/50" : "gap-0 overflow-hidden py-0 shadow-none transition-colors hover:border-primary/50"}>
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              {match.matchNumber ?? "Match"} · {match.stage}
            </div>
            <MatchStatusBadge status={match.status} />
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <TeamScore team={home} score={isCricket ? cricketScore(homeScore) : match.scoreSummary?.[match.homeTeamId]} />
            <span className="text-xs font-semibold text-muted-foreground">VS</span>
            <TeamScore team={away} score={isCricket ? cricketScore(awayScore) : match.scoreSummary?.[match.awayTeamId]} align="right" />
          </div>
          {resultText ? (
            <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm font-medium text-card-foreground">{resultText}</p>
          ) : null}
          <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 text-sm text-muted-foreground">
            <span className="truncate capitalize">{match.sport} · {match.stage}</span>
            <ChevronRight className="size-4 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function cricketScore(innings?: { score: number; wickets: number; overs: string } | null) {
  return innings ? `${innings.score}/${innings.wickets} (${innings.overs})` : undefined;
}

function displayAccentColor(color?: string | null) {
  if (!color) return "transparent";
  return ["#22c55e", "#10b981", "#16a34a", "#15803d", "#4ade80"].includes(color.toLowerCase()) ? "#3b82f6" : color;
}

function TeamScore({
  team,
  score,
  align = "left",
}: {
  team?: PublicTeam;
  score?: number | string;
  align?: "left" | "right";
}) {
  const accentColor = displayAccentColor(team?.accentColor);
  return (
    <div className={align === "right" ? "min-w-0 text-right" : "min-w-0"}>
      <div className={align === "right" ? "mb-2 flex justify-end" : "mb-2 flex"}>
        <span className="h-2.5 w-8 rounded-full border shadow-sm" style={{ backgroundColor: accentColor }} />
      </div>
      <p className="truncate text-sm font-medium sm:text-base">{team?.name ?? "Team"}</p>
      <p className="mt-1 min-h-8 text-xl font-semibold tabular-nums sm:text-2xl">{score ?? "-"}</p>
    </div>
  );
}
