"use client";

import { cricketInningsMetrics, S9_TEAMS } from "@sports-fiesta/domain";
import { ArrowLeft, CalendarDays, CircleDashed, MapPin, Radio } from "lucide-react";
import Link from "next/link";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePublicCollection, usePublicDocument } from "@/lib/public-data";
import type { PublicMatch, PublicPlayer, PublicTeam } from "@/lib/web-types";

type Sport = "football" | "handball" | "cricket";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Schedule pending"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeStyle: "short" }).format(date);
}

export function MatchDetail({ sport, matchId }: { sport: Sport; matchId: string }) {
  const matchState = usePublicDocument<PublicMatch>("matches", matchId);
  const teamsState = usePublicCollection<PublicTeam>("teams");
  const playersState = usePublicCollection<PublicPlayer>("players");
  const match = matchState.data;
  const teams = teamsState.data.length ? teamsState.data : S9_TEAMS;

  if (matchState.loading || teamsState.loading || playersState.loading) return <ContentSkeleton rows={3} />;
  if (matchState.error) return <DataError message={matchState.error} retry={matchState.retry} />;
  if (!match || match.sport !== sport) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
          <CircleDashed />
          <div>
            <h1 className="font-semibold">Match not available</h1>
            <p className="mt-1 text-sm text-muted-foreground">This fixture may not have been published yet.</p>
          </div>
          <Button nativeButton={false} variant="outline" render={<Link href={`/${sport}`} />}>Back to fixtures</Button>
        </CardContent>
      </Card>
    );
  }

  const home = teams.find((team) => team.id === match.homeTeamId);
  const away = teams.find((team) => team.id === match.awayTeamId);
  const playerName = (id: string | null | undefined) => playersState.data.find((player) => player.id === id)?.name ?? "Player";
  const teamName = (id: string) => teams.find((team) => team.id === id)?.name ?? "Team";

  return (
    <div className="flex flex-col gap-6">
      <Button nativeButton={false} className="w-fit" variant="ghost" render={<Link href={`/${sport}`} />}>
        <ArrowLeft data-icon="inline-start" /> Fixtures
      </Button>
      <Card className="overflow-hidden shadow-none">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardDescription className="capitalize">{match.stage} {sport}</CardDescription>
              <CardTitle className="mt-1 text-xl sm:text-2xl">{home?.name ?? "Team"} vs {away?.name ?? "Team"}</CardTitle>
            </div>
            <Badge variant={match.status === "live" ? "destructive" : "secondary"}>
              {match.status === "live" ? <Radio data-icon="inline-start" /> : null}
              {match.status.replace("-", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-6">
          {sport === "cricket" ? (
            <CricketScore match={match} teamName={teamName} playerName={playerName} />
          ) : (
            <FieldScore match={match} homeName={home?.name ?? "Team"} awayName={away?.name ?? "Team"} playerName={playerName} teamName={teamName} />
          )}
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><CalendarDays /> {formatDate(match.startsAt)}</span>
            <span className="inline-flex items-center gap-2"><MapPin /> {match.venue || "Venue pending"}</span>
          </div>
          {match.resultText ? <p className="rounded-md bg-muted p-3 font-medium">{match.resultText}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function FieldScore({ match, homeName, awayName, playerName, teamName }: {
  match: PublicMatch;
  homeName: string;
  awayName: string;
  playerName: (id?: string) => string;
  teamName: (id: string) => string;
}) {
  const events = match.fieldState?.events ?? [];
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
        <div><p className="text-sm text-muted-foreground">{homeName}</p><p className="mt-2 text-5xl font-semibold tabular-nums">{match.fieldState?.score?.[match.homeTeamId] ?? 0}</p></div>
        <span className="text-sm font-medium text-muted-foreground">VS</span>
        <div><p className="text-sm text-muted-foreground">{awayName}</p><p className="mt-2 text-5xl font-semibold tabular-nums">{match.fieldState?.score?.[match.awayTeamId] ?? 0}</p></div>
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Match events</h2>
        {events.length ? (
          <div className="flex flex-col gap-2">
            {[...events].reverse().map((event, index) => (
              <div key={String(event.id ?? index)} className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm">
                <div><p className="font-medium capitalize">{String(event.type).replace("-", " ")}</p><p className="text-muted-foreground">{playerName(String(event.playerId ?? ""))}</p></div>
                <span className="text-right text-muted-foreground">{teamName(String(event.teamId))}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No match events have been recorded.</p>}
      </div>
    </div>
  );
}

function CricketScore({ match, teamName, playerName }: {
  match: PublicMatch;
  teamName: (id: string) => string;
  playerName: (id?: string | null) => string;
}) {
  const entries = match.cricket?.innings ?? [];
  const currentIndex = match.cricket?.currentInnings ?? Math.max(0, entries.length - 1);
  const current = entries[currentIndex]?.state;
  const target = currentIndex % 2 === 1 ? (entries[currentIndex - 1]?.state.score ?? 0) + 1 : null;
  const metrics = current ? cricketInningsMetrics(current, target) : null;

  if (!current) return <p className="text-center text-muted-foreground">The scorecard will appear when the innings starts.</p>;
  const batters = Object.values(current.batters);
  const bowlers = Object.values(current.bowlers);
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">{teamName(current.battingTeamId)} batting</p>
        <p className="mt-2 text-5xl font-semibold tabular-nums">{current.score}/{current.wickets}</p>
        <p className="mt-2 text-sm text-muted-foreground">{current.overs} overs · RR {metrics?.runRate.toFixed(2)}</p>
        {target ? <p className="mt-2 font-medium">Need {metrics?.runsRequired} from {metrics?.ballsRemaining} balls · RRR {metrics?.requiredRunRate === Infinity ? "-" : metrics?.requiredRunRate.toFixed(2)}</p> : null}
      </div>
      <ScoreTable title="Batting" headers={["Batter", "R", "B", "4s", "6s", "SR"]} rows={batters.map((batter) => [
        playerName(batter.playerId), batter.runs, batter.balls, batter.fours, batter.sixes,
        batter.balls ? ((batter.runs / batter.balls) * 100).toFixed(1) : "0.0",
      ])} />
      <ScoreTable title="Bowling" headers={["Bowler", "O", "M", "R", "W", "Econ"]} rows={bowlers.map((bowler) => [
        playerName(bowler.playerId), `${Math.floor(bowler.legalBalls / 6)}.${bowler.legalBalls % 6}`,
        bowler.maidens, bowler.runs, bowler.wickets,
        bowler.legalBalls ? ((bowler.runs / bowler.legalBalls) * 6).toFixed(1) : "0.0",
      ])} />
      <div>
        <h2 className="mb-3 text-lg font-semibold">Ball progression</h2>
        <div className="flex flex-wrap gap-2">
          {current.events.length ? current.events.map((event) => (
            <span key={event.id} className="grid min-h-10 min-w-10 place-items-center rounded-md border px-2 text-sm font-semibold" title={event.commentary}>
              {event.dismissal ? "W" : event.extraType === "wide" ? "Wd" : event.extraType === "no-ball" ? "Nb" : event.totalRuns}
            </span>
          )) : <p className="text-sm text-muted-foreground">No deliveries recorded.</p>}
        </div>
      </div>
    </div>
  );
}

function ScoreTable({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <Table>
        <TableHeader><TableRow>{headers.map((header) => <TableHead key={header} className={header === headers[0] ? "" : "text-right"}>{header}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{rows.map((row, index) => <TableRow key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <TableCell key={cellIndex} className={cellIndex === 0 ? "font-medium" : "text-right tabular-nums"}>{cell}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
    </div>
  );
}
