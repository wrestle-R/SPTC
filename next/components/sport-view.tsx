"use client";

import { S9_SEEDED_MATCHES, S9_TEAMS } from "@sports-fiesta/domain";
import { CircleDashed } from "lucide-react";
import { DataError, ContentSkeleton } from "@/components/data-state";
import { MatchCard } from "@/components/match-card";
import { Card, CardContent } from "@/components/ui/card";
import { usePublicCollection, usePublicDocument } from "@/lib/public-data";
import type { CricketStandingRow, FieldSportStandingRow, PublicMatch, PublicTeam, SportStandingDocument } from "@/lib/web-types";

const headings = {
  football: { title: "Football", description: "Fixtures, live goals, lineups, standings, and the road to the final." },
  handball: { title: "Handball", description: "Live scoring, lineups, results, and tournament progress." },
  cricket: { title: "Cricket", description: "Five-over fixtures, ball-by-ball scorecards, leaders, and match analytics." },
} as const;

export function SportView({ sport }: { sport: keyof typeof headings }) {
  const matchesState = usePublicCollection<PublicMatch>("matches");
  const teamsState = usePublicCollection<PublicTeam>("teams");
  const standingsState = usePublicDocument<SportStandingDocument>("standings", sport);
  const teams = teamsState.data.length ? teamsState.data : S9_TEAMS;
  const sourceMatches = matchesState.data.length ? matchesState.data : S9_SEEDED_MATCHES as unknown as PublicMatch[];
  const matches = sourceMatches
    .filter((match) => match.sport === sport)
    .sort((a, b) => (a.matchNumber ?? a.id).localeCompare(b.matchNumber ?? b.id));
  const standings = standingsState.data?.rows?.length ? standingsState.data.rows : fallbackStandings(sport, matches);
  const groups = [
    { title: "Live now", matches: matches.filter((match) => ["live", "innings-break", "super-over"].includes(match.status)) },
    { title: "Upcoming", matches: matches.filter((match) => ["scheduled", "lineup"].includes(match.status)) },
    { title: "Results", matches: matches.filter((match) => match.status === "completed") },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold text-primary">Sports Fiesta</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{headings[sport].title}</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">{headings[sport].description}</p>
      </header>
      {matchesState.loading || teamsState.loading || standingsState.loading ? <ContentSkeleton /> : null}
      {matchesState.error ? <DataError message={matchesState.error} retry={matchesState.retry} /> : null}
      {standingsState.error ? <DataError message={standingsState.error} retry={standingsState.retry} /> : null}
      {!standingsState.loading && !standingsState.error ? (
        <SportStandings sport={sport} standings={standings} teams={teams} />
      ) : null}
      {!matchesState.loading && !matchesState.error && matches.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <span className="grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground"><CircleDashed /></span>
            <div>
              <h2 className="font-semibold">No fixtures yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">Organizer-created matches will appear here immediately.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {groups.map((group) => group.matches.length ? (
        <section key={group.title} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{group.title}</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {group.matches.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}
          </div>
        </section>
      ) : null)}
    </div>
  );
}

function fallbackStandings(sport: keyof typeof headings, matches: PublicMatch[]): SportStandingDocument["rows"] {
  if (sport === "cricket") return fallbackCricketStandings(matches);
  return fallbackFieldStandings(matches);
}

function fallbackFieldStandings(matches: PublicMatch[]): FieldSportStandingRow[] {
  const rows = S9_TEAMS.map((team) => ({
    rank: 0,
    teamId: team.id,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));
  const byTeam = new Map(rows.map((row) => [row.teamId, row]));
  for (const match of matches.filter((row) => row.status === "completed" && row.resultText && row.stage === "league")) {
    const home = byTeam.get(match.homeTeamId);
    const away = byTeam.get(match.awayTeamId);
    if (!home || !away) continue;
    const homeScore = match.fieldState?.score?.[match.homeTeamId] ?? 0;
    const awayScore = match.fieldState?.score?.[match.awayTeamId] ?? 0;
    home.played += 1; away.played += 1;
    home.goalsFor += homeScore; home.goalsAgainst += awayScore;
    away.goalsFor += awayScore; away.goalsAgainst += homeScore;
    if (match.winnerTeamId === match.homeTeamId || homeScore > awayScore) { home.wins += 1; home.points += 3; away.losses += 1; }
    else if (match.winnerTeamId === match.awayTeamId || awayScore > homeScore) { away.wins += 1; away.points += 3; home.losses += 1; }
    else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
  }
  return rows
    .map((row) => ({ ...row, goalDifference: row.goalsFor - row.goalsAgainst }))
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.teamId.localeCompare(b.teamId))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function fallbackCricketStandings(matches: PublicMatch[]): CricketStandingRow[] {
  const rows = S9_TEAMS.map((team) => ({ rank: 0, teamId: team.id, played: 0, wins: 0, ties: 0, losses: 0, points: 0, runsFor: 0, runsAgainst: 0, ballsFaced: 0, ballsBowled: 0, netRunRate: 0 }));
  const byTeam = new Map(rows.map((row) => [row.teamId, row]));
  for (const match of matches.filter((row) => row.status === "completed" && row.resultText && row.stage === "league")) {
    const innings = (match.cricket?.innings ?? []).filter((entry) => !entry.superOver).slice(0, 2).map((entry) => entry.state);
    if (innings.length < 2) continue;
    for (const state of innings) {
      const batting = byTeam.get(state.battingTeamId);
      const bowling = byTeam.get(state.bowlingTeamId);
      if (!batting || !bowling) continue;
      const balls = state.wickets >= state.battingLineup.length - 1 ? state.maxOvers * 6 : state.legalBalls;
      batting.runsFor += state.score; batting.ballsFaced += balls;
      bowling.runsAgainst += state.score; bowling.ballsBowled += balls;
    }
    const home = byTeam.get(match.homeTeamId); const away = byTeam.get(match.awayTeamId);
    if (!home || !away) continue;
    home.played += 1; away.played += 1;
    if (match.winnerTeamId === home.teamId) { home.wins += 1; home.points += 2; away.losses += 1; }
    else if (match.winnerTeamId === away.teamId) { away.wins += 1; away.points += 2; home.losses += 1; }
    else { home.ties += 1; away.ties += 1; home.points += 1; away.points += 1; }
  }
  for (const row of rows) {
    const forRate = row.ballsFaced ? row.runsFor / (row.ballsFaced / 6) : 0;
    const againstRate = row.ballsBowled ? row.runsAgainst / (row.ballsBowled / 6) : 0;
    row.netRunRate = Number((forRate - againstRate).toFixed(3));
  }
  return rows
    .sort((a, b) => b.points - a.points || b.netRunRate - a.netRunRate || b.wins - a.wins || a.teamId.localeCompare(b.teamId))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function SportStandings({
  sport,
  standings,
  teams,
}: {
  sport: keyof typeof headings;
  standings: SportStandingDocument["rows"];
  teams: PublicTeam[];
}) {
  const teamName = (teamId: string) => teams.find((team) => team.id === teamId)?.name ?? teamId;
  const gridClass = sport === "cricket"
    ? "grid grid-cols-[1.25rem_minmax(5.75rem,1fr)_1.25rem_1.25rem_1.25rem_1.25rem_2.5rem_1.75rem] gap-1"
    : "grid grid-cols-[1.25rem_minmax(4.75rem,1fr)_1.25rem_1.25rem_1.25rem_1.25rem_1.5rem_1.5rem_1.5rem_1.75rem] gap-1";
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`${sport}-standings-heading`}>
      <h2 id={`${sport}-standings-heading`} className="text-lg font-semibold">Points standings</h2>
      <Card className="overflow-hidden shadow-none">
        <CardContent className="p-3 sm:p-4">
          <div className={`${gridClass} border-b pb-2 text-xs font-semibold text-muted-foreground sm:text-sm`}>
            <span>#</span>
            <span>Team</span>
            <span className="text-right">P</span>
            <span className="text-right">W</span>
            <span className="text-right">{sport === "cricket" ? "T" : "D"}</span>
            <span className="text-right">L</span>
            {sport === "cricket" ? (
              <span className="text-right">NRR</span>
            ) : (
              <>
                <span className="text-right">GF</span>
                <span className="text-right">GA</span>
                <span className="text-right">GD</span>
              </>
            )}
            <span className="text-right">Pts</span>
          </div>
          <div className="divide-y">
            {standings.map((row) => (
              <div key={row.teamId} className={`${gridClass} py-2 text-xs sm:text-sm`}>
                <span className="font-medium tabular-nums">{row.rank}</span>
                <span className="break-words font-medium leading-snug">{teamName(row.teamId)}</span>
                <span className="text-right tabular-nums">{row.played}</span>
                <span className="text-right tabular-nums">{row.wins}</span>
                {"ties" in row ? (
                  <CricketStandingCells row={row} />
                ) : (
                  <FieldStandingCells row={row} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function FieldStandingCells({ row }: { row: FieldSportStandingRow }) {
  return (
    <>
      <span className="text-right tabular-nums">{row.draws}</span>
      <span className="text-right tabular-nums">{row.losses}</span>
      <span className="text-right tabular-nums">{row.goalsFor}</span>
      <span className="text-right tabular-nums">{row.goalsAgainst}</span>
      <span className="text-right tabular-nums">{row.goalDifference}</span>
      <span className="text-right font-semibold tabular-nums">{row.points}</span>
    </>
  );
}

function CricketStandingCells({ row }: { row: CricketStandingRow }) {
  return (
    <>
      <span className="text-right tabular-nums">{row.ties}</span>
      <span className="text-right tabular-nums">{row.losses}</span>
      <span className="text-right tabular-nums">{row.netRunRate.toFixed(3)}</span>
      <span className="text-right font-semibold tabular-nums">{row.points}</span>
    </>
  );
}
