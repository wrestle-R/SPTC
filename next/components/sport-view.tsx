"use client";

import { S9_PLAYERS, S9_TEAMS } from "@sports-fiesta/domain";
import { ChevronDown, ChevronUp, CircleDashed } from "lucide-react";
import { useState } from "react";
import { DataError, ContentSkeleton } from "@/components/data-state";
import { MatchCard } from "@/components/match-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePublicCollection, usePublicDocument } from "@/lib/public-data";
import type {
  CricketStandingRow,
  FieldSportStandingRow,
  PublicMatch,
  PublicPlayer,
  PublicTeam,
  SportStandingDocument,
  ThrowballLeaders,
  ThrowballStandingRow,
} from "@/lib/web-types";

const headings = {
  football: { title: "Football", description: "Fixtures, live goals, standings, and the road to the final." },
  handball: { title: "Handball", description: "Live scoring, results, and tournament progress." },
  cricket: { title: "Cricket", description: "Five-over fixtures, ball-by-ball scorecards, leaders, and match analytics." },
  throwball: { title: "Throwball", description: "Fast-paced fixtures, set-by-set scorelines, and rally-driven player leaders." },
} as const;

export function SportView({ sport }: { sport: keyof typeof headings }) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const matchesState = usePublicCollection<PublicMatch>("matches");
  const teamsState = usePublicCollection<PublicTeam>("teams");
  const playersState = usePublicCollection<PublicPlayer>("players");
  const standingsState = usePublicDocument<SportStandingDocument>("standings", sport);
  const leadersState = usePublicDocument<FieldLeaders | CricketLeaders>("leaderboards", sport);
  const teams = teamsState.data.length ? teamsState.data : S9_TEAMS;
  const matches = matchesState.data
    .filter((match) => match.sport === sport)
    .sort((a, b) => (a.matchNumber ?? a.id).localeCompare(b.matchNumber ?? b.id));
  const standings = standingsState.data?.rows?.length ? standingsState.data.rows : fallbackStandings(sport, matches);
  const groups = [
    { title: "Live now", matches: matches.filter((match) => ["live", "innings-break", "super-over"].includes(match.status)) },
    { title: "Upcoming", matches: matches.filter((match) => match.status === "scheduled") },
    { title: "Results", matches: matches.filter((match) => match.status === "completed") },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold text-primary">Sports Fiesta</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{headings[sport].title}</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">{headings[sport].description}</p>
      </header>
      {matchesState.loading || teamsState.loading || standingsState.loading || playersState.loading || leadersState.loading ? <ContentSkeleton /> : null}
      {matchesState.error ? <DataError message={matchesState.error} retry={matchesState.retry} /> : null}
      {standingsState.error ? <DataError message={standingsState.error} retry={standingsState.retry} /> : null}
      {!standingsState.loading && !standingsState.error ? (
        <SportStandings sport={sport} standings={standings} teams={teams} />
      ) : null}
      {!leadersState.loading && !leadersState.error ? (
        <SportLeaders sport={sport} leaders={leadersState.data} matches={matches} players={playersState.data.length ? playersState.data : S9_PLAYERS} />
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
      {groups.map((group) => {
        if (!group.matches.length) return null;
        const expanded = Boolean(expandedGroups[group.title]);
        const visibleMatches = expanded ? group.matches : group.matches.slice(0, 5);
        const hiddenCount = group.matches.length - 5;
        return (
          <section key={group.title} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{group.title}</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleMatches.map((match) => <MatchCard key={match.id} match={match} teams={teams} players={playersState.data.length ? playersState.data : S9_PLAYERS} />)}
            </div>
            {hiddenCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="self-center"
                aria-expanded={expanded}
                onClick={() => setExpandedGroups((current) => ({ ...current, [group.title]: !expanded }))}
              >
                {expanded ? <>Show less <ChevronUp data-icon="inline-end" /></> : <>View all ({group.matches.length}) <ChevronDown data-icon="inline-end" /></>}
              </Button>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

type FieldLeaders = { topScorers?: Array<{ playerId: string; teamId: string; goals: number }> };
type CricketLeaders = {
  orangeCap?: Array<{ playerId: string; runs: number; innings: number; strikeRate: number }>;
  purpleCap?: Array<{ playerId: string; wickets: number; economy: number }>;
  mostCatches?: Array<{ playerId: string; catches: number }>;
};

function SportLeaders({ sport, leaders, matches, players }: { sport: keyof typeof headings; leaders?: FieldLeaders | CricketLeaders | ThrowballLeaders | null; matches: PublicMatch[]; players: PublicPlayer[] }) {
  const playerName = (id: string) => players.find((player) => player.id === id)?.name ?? "Player";
  if (sport === "cricket") {
    const cricket = (leaders as CricketLeaders | undefined) ?? fallbackCricketLeaders(matches);
    return (
      <section className="grid gap-3 lg:grid-cols-3" aria-label="Cricket leaders">
        <LeaderCard title="Most Runs" label="Runs" rows={(cricket.orangeCap ?? []).slice(0, 5).map((row) => ({ playerId: row.playerId, value: row.runs }))} playerName={playerName} />
        <LeaderCard title="Most Wickets" label="Wickets" rows={(cricket.purpleCap ?? []).slice(0, 5).map((row) => ({ playerId: row.playerId, value: row.wickets }))} playerName={playerName} />
        <LeaderCard title="Most Catches" label="Catches" rows={(cricket.mostCatches ?? []).slice(0, 5).map((row) => ({ playerId: row.playerId, value: row.catches }))} playerName={playerName} />
      </section>
    );
  }
  if (sport === "throwball") {
    const throwball = (leaders as ThrowballLeaders | undefined) ?? fallbackThrowballLeaders(matches);
    return (
      <section className="grid gap-3 lg:grid-cols-2" aria-label="Throwball leaders">
        <LeaderCard
          title="Best Players"
          label="Score"
          rows={(throwball.bestPlayers ?? []).slice(0, 5).map((row) => ({
            playerId: row.playerId,
            value: row.playerScore,
            subtitle: `${row.successfulAttacks}A / ${row.ballsThrownOut}E / ${row.droppedCatches}D`,
          }))}
          playerName={playerName}
        />
        <LeaderCard
          title="Most Successful Attacks"
          label="Att"
          rows={(throwball.mostAttacks ?? []).slice(0, 5).map((row) => ({
            playerId: row.playerId,
            value: row.successfulAttacks,
          }))}
          playerName={playerName}
        />
      </section>
    );
  }
  const field = (leaders as FieldLeaders | undefined) ?? { topScorers: fallbackFieldLeaders(matches) };
  return (
    <section aria-label={`${sport} leaders`}>
      <LeaderCard title={sport === "football" ? "Most Goals" : "Most Goals"} label="Goals" rows={(field.topScorers ?? []).slice(0, 8).map((row) => ({ playerId: row.playerId, value: row.goals }))} playerName={playerName} />
    </section>
  );
}

function LeaderCard({ title, label, rows, playerName }: { title: string; label: string; rows: Array<{ playerId: string; value: number; subtitle?: string }>; playerName: (id: string) => string }) {
  return (
    <Card className="shadow-none">
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Updated from recorded match events.</CardDescription></CardHeader>
      <CardContent>
        {rows.some((row) => row.value !== 0) ? (
          <Table>
            <TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-right">{label}</TableHead></TableRow></TableHeader>
            <TableBody>{rows.filter((row) => row.value !== 0).map((row, index) => <TableRow key={row.playerId}><TableCell><div className="min-w-0"><p>{index + 1}. {playerName(row.playerId)}</p>{row.subtitle ? <p className="text-xs text-muted-foreground">{row.subtitle}</p> : null}</div></TableCell><TableCell className="text-right font-semibold tabular-nums">{row.value}</TableCell></TableRow>)}</TableBody>
          </Table>
        ) : <p className="py-8 text-center text-sm text-muted-foreground">Leaders will appear after scoring events.</p>}
      </CardContent>
    </Card>
  );
}

function fallbackFieldLeaders(matches: PublicMatch[]) {
  const rows = new Map<string, { playerId: string; teamId: string; goals: number }>();
  for (const match of matches) {
    for (const event of match.fieldState?.events ?? []) {
      if (event.type !== "goal" || typeof event.playerId !== "string" || typeof event.teamId !== "string") continue;
      const row = rows.get(event.playerId) ?? { playerId: event.playerId, teamId: event.teamId, goals: 0 };
      row.goals += 1; rows.set(event.playerId, row);
    }
  }
  return [...rows.values()].sort((a, b) => b.goals - a.goals || a.playerId.localeCompare(b.playerId));
}

function fallbackCricketLeaders(matches: PublicMatch[]): CricketLeaders {
  const rows = new Map<string, { playerId: string; runs: number; innings: number; balls: number; wickets: number; bowlingRuns: number; bowlingBalls: number; catches: number }>();
  const ensure = (playerId: string) => {
    const row = rows.get(playerId) ?? { playerId, runs: 0, innings: 0, balls: 0, wickets: 0, bowlingRuns: 0, bowlingBalls: 0, catches: 0 };
    rows.set(playerId, row);
    return row;
  };
  for (const match of matches) {
    for (const entry of match.cricket?.innings ?? []) {
      for (const batter of Object.values(entry.state.batters)) {
        const row = ensure(batter.playerId);
        row.runs += batter.runs; row.balls += batter.balls; row.innings += 1;
      }
      for (const bowler of Object.values(entry.state.bowlers)) {
        const row = ensure(bowler.playerId);
        row.wickets += bowler.wickets; row.bowlingRuns += bowler.runs; row.bowlingBalls += bowler.legalBalls;
      }
      for (const event of entry.state.events) {
        if (event.dismissal?.type === "caught" && event.dismissal.fielderId) ensure(event.dismissal.fielderId).catches += 1;
      }
    }
  }
  const values = [...rows.values()].map((row) => ({ ...row, strikeRate: row.balls ? Number(((row.runs / row.balls) * 100).toFixed(2)) : 0, economy: row.bowlingBalls ? Number(((row.bowlingRuns / row.bowlingBalls) * 6).toFixed(2)) : 0 }));
  return {
    orangeCap: [...values].sort((a, b) => b.runs - a.runs || a.innings - b.innings || b.strikeRate - a.strikeRate),
    purpleCap: [...values].sort((a, b) => b.wickets - a.wickets || a.economy - b.economy),
    mostCatches: [...values].sort((a, b) => b.catches - a.catches || a.playerId.localeCompare(b.playerId)),
  };
}

function fallbackStandings(sport: keyof typeof headings, matches: PublicMatch[]): SportStandingDocument["rows"] {
  if (sport === "cricket") return fallbackCricketStandings(matches);
  if (sport === "throwball") return fallbackThrowballStandings(matches);
  return fallbackFieldStandings(matches);
}

function fallbackThrowballLeaders(matches: PublicMatch[]): ThrowballLeaders {
  const rows = new Map<string, {
    playerId: string;
    teamId: string;
    successfulAttacks: number;
    ballsThrownOut: number;
    droppedCatches: number;
    playerScore: number;
  }>();
  for (const match of matches.filter((row) => row.sport === "throwball")) {
    for (const stats of Object.values(match.throwball?.playerStats ?? {})) {
      const row = rows.get(stats.playerId) ?? {
        playerId: stats.playerId,
        teamId: S9_PLAYERS.find((player) => player.id === stats.playerId)?.teamId ?? "",
        successfulAttacks: 0,
        ballsThrownOut: 0,
        droppedCatches: 0,
        playerScore: 0,
      };
      row.successfulAttacks += stats.successfulAttacks;
      row.ballsThrownOut += stats.ballsThrownOut;
      row.droppedCatches += stats.droppedCatches;
      row.playerScore += stats.playerScore;
      rows.set(stats.playerId, row);
    }
  }
  const values = [...rows.values()];
  return {
    id: "throwball",
    bestPlayers: [...values].sort((a, b) => b.playerScore - a.playerScore || a.playerId.localeCompare(b.playerId)),
    mostAttacks: [...values].sort((a, b) => b.successfulAttacks - a.successfulAttacks || a.playerId.localeCompare(b.playerId)),
  };
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
      const balls = state.wickets >= Math.min(state.battingLineup.length - 1, 8) ? state.maxOvers * 6 : state.legalBalls;
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

function fallbackThrowballStandings(matches: PublicMatch[]): ThrowballStandingRow[] {
  const rows = S9_TEAMS.map<ThrowballStandingRow>((team) => ({
    rank: 0,
    teamId: team.id,
    played: 0,
    wins: 0,
    losses: 0,
    setsFor: 0,
    setsAgainst: 0,
    setDifference: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    pointDifference: 0,
    points: 0,
  }));
  const byTeam = new Map(rows.map((row) => [row.teamId, row]));
  for (const match of matches.filter((row) => row.sport === "throwball" && row.status === "completed" && row.resultText && row.stage === "league")) {
    const state = match.throwball;
    const home = byTeam.get(match.homeTeamId);
    const away = byTeam.get(match.awayTeamId);
    if (!state || !home || !away) continue;
    const homeSets = state.sets.filter((set) => set.winnerTeamId === match.homeTeamId).length;
    const awaySets = state.sets.filter((set) => set.winnerTeamId === match.awayTeamId).length;
    home.played += 1;
    away.played += 1;
    home.setsFor += homeSets;
    home.setsAgainst += awaySets;
    away.setsFor += awaySets;
    away.setsAgainst += homeSets;
    for (const set of state.sets.filter((entry) => entry.completed)) {
      home.pointsFor += set.homeScore;
      home.pointsAgainst += set.awayScore;
      away.pointsFor += set.awayScore;
      away.pointsAgainst += set.homeScore;
    }
    if (match.winnerTeamId === match.homeTeamId) {
      home.wins += 1;
      away.losses += 1;
    } else if (match.winnerTeamId === match.awayTeamId) {
      away.wins += 1;
      home.losses += 1;
    }
  }
  return rows
    .map((row) => ({
      ...row,
      setDifference: row.setsFor - row.setsAgainst,
      pointDifference: row.pointsFor - row.pointsAgainst,
      points: row.wins * 3,
    }))
    .sort((a, b) => b.wins - a.wins || b.setDifference - a.setDifference || b.pointDifference - a.pointDifference || a.teamId.localeCompare(b.teamId))
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
    : sport === "throwball"
    ? "grid grid-cols-[1.25rem_minmax(4.75rem,1fr)_1.25rem_1.25rem_1.5rem_1.5rem_1.5rem_1.5rem_1.75rem] gap-1"
    : sport === "handball"
    ? "grid grid-cols-[1.25rem_minmax(4.75rem,1fr)_1.25rem_1.25rem_1.25rem_1.5rem_1.5rem_1.5rem_1.75rem] gap-1"
    : "grid grid-cols-[1.25rem_minmax(4.75rem,1fr)_1.25rem_1.25rem_1.25rem_1.25rem_1.5rem_1.5rem_1.5rem_1.75rem] gap-1";
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`${sport}-standings-heading`}>
      <h2 id={`${sport}-standings-heading`} className="text-lg font-semibold">Points standings</h2>
      <Card className="overflow-hidden shadow-none">
        <CardContent className="p-3 sm:p-4">
          <div className={`${gridClass} border-b pb-2 max-sm:border-b-0 text-xs font-semibold text-muted-foreground sm:text-sm`}>
            <span>#</span>
            <span>Team</span>
            <span className="text-right">P</span>
            <span className="text-right">W</span>
            {sport === "handball" ? null : sport === "throwball" ? (
              <span className="text-right">L</span>
            ) : (
              <span className="text-right">{sport === "cricket" ? "T" : "D"}</span>
            )}
            {sport === "throwball" ? (
              <>
                <span className="text-right">SF</span>
                <span className="text-right">SA</span>
                <span className="text-right">PD</span>
              </>
            ) : (
              <span className="text-right">L</span>
            )}
            {sport === "cricket" ? (
              <span className="text-right">NRR</span>
            ) : sport === "throwball" ? (
              <span className="text-right">Pts</span>
            ) : (
              <>
                <span className="text-right">GF</span>
                <span className="text-right">GA</span>
                <span className="text-right">GD</span>
              </>
            )}
            {sport === "throwball" ? null : <span className="text-right">Pts</span>}
          </div>
          <div className="divide-y max-sm:divide-y-0 max-sm:space-y-0.5">
            {standings.map((row) => (
              <div key={row.teamId} className={`${gridClass} py-2 text-xs sm:text-sm`}>
                <span className="font-medium tabular-nums">{row.rank}</span>
                <span className="break-words font-medium leading-snug">{teamName(row.teamId)}</span>
                <span className="text-right tabular-nums">{row.played}</span>
                <span className="text-right tabular-nums">{row.wins}</span>
                {"setsFor" in row ? (
                  <ThrowballStandingCells row={row} />
                ) : "ties" in row ? (
                  <CricketStandingCells row={row} />
                ) : (
                  <FieldStandingCells row={row} showDraws={sport === "football"} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function FieldStandingCells({ row, showDraws }: { row: FieldSportStandingRow; showDraws?: boolean }) {
  return (
    <>
      {showDraws ? (
        <span className="text-right tabular-nums">{row.draws}</span>
      ) : null}
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

function ThrowballStandingCells({ row }: { row: ThrowballStandingRow }) {
  return (
    <>
      <span className="text-right tabular-nums">{row.losses}</span>
      <span className="text-right tabular-nums">{row.setsFor}</span>
      <span className="text-right tabular-nums">{row.setsAgainst}</span>
      <span className="text-right tabular-nums">{row.pointDifference}</span>
      <span className="text-right font-semibold tabular-nums">{row.points}</span>
    </>
  );
}
