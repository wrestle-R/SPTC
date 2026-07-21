"use client";

import { cricketInningsMetrics, fallOfWickets, S9_TEAMS, type CricketDelivery } from "@sports-fiesta/domain";
import { ArrowLeft, CircleDashed } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { MatchStatusBadge } from "@/components/match-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicCollection, usePublicDocument } from "@/lib/public-data";
import type { PublicMatch, PublicPlayer, PublicTeam } from "@/lib/web-types";

type Sport = "football" | "handball" | "cricket";

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
              <CardDescription className="capitalize">{match.matchNumber ?? "Match"} · {match.stage} {sport}</CardDescription>
              <CardTitle className="mt-1 text-xl sm:text-2xl">{home?.name ?? "Team"} vs {away?.name ?? "Team"}</CardTitle>
            </div>
            <MatchStatusBadge status={match.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-6">
          {sport === "cricket" ? (
            <CricketScore match={match} teamName={teamName} playerName={playerName} />
          ) : (
            <FieldScore match={match} homeName={home?.name ?? "Team"} awayName={away?.name ?? "Team"} playerName={playerName} teamName={teamName} />
          )}
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

function dismissalText(dismissal: NonNullable<import("@sports-fiesta/domain").BatterInnings["dismissal"]>, events: CricketDelivery[], pName: (id?: string | null) => string) {
  const event = events.find((e) => e.dismissal?.playerOutId === dismissal.playerOutId);
  const bowler = event ? pName(event.bowlerId) : "?";
  const fielder = dismissal.fielderId ? pName(dismissal.fielderId) : null;
  switch (dismissal.type) {
    case "bowled": return `b ${bowler}`;
    case "caught": return fielder ? `c ${fielder} b ${bowler}` : `c ? b ${bowler}`;
    case "lbw": return `lbw b ${bowler}`;
    case "stumped": return fielder ? `st ${fielder} b ${bowler}` : `st ? b ${bowler}`;
    case "run-out": return `run out (${fielder ?? "?"})`;
    case "hit-wicket": return `hit wkt b ${bowler}`;
    case "retired-hurt": return "retired hurt";
    case "retired-out": return "retired out";
    case "obstructing-field": return "obstructing field";
    default: return dismissal.type;
  }
}

function CricketScore({ match, teamName, playerName }: {
  match: PublicMatch;
  teamName: (id: string) => string;
  playerName: (id?: string | null) => string;
}) {
  const entries = match.cricket?.innings ?? [];
  const [activeInnings, setActiveInnings] = useState(entries.length > 1 ? 1 : 0);
  const safeIndex = activeInnings < entries.length ? activeInnings : entries.length - 1;
  const state = entries[safeIndex]?.state;
  const target = safeIndex % 2 === 1 ? (entries[safeIndex - 1]?.state.score ?? 0) + 1 : null;
  const metrics = state ? cricketInningsMetrics(state, target) : null;

  if (!state) return <p className="text-center text-muted-foreground">The scorecard will appear when the innings starts.</p>;

  const batters = Object.values(state.batters);
  const bowlers = Object.values(state.bowlers);

  const battingOrder: string[] = [];
  for (const event of state.events) {
    if (!battingOrder.includes(event.strikerId)) battingOrder.push(event.strikerId);
    if (!battingOrder.includes(event.nonStrikerId)) battingOrder.push(event.nonStrikerId);
  }
  if (state.strikerId && !battingOrder.includes(state.strikerId)) battingOrder.push(state.strikerId);
  if (state.nonStrikerId && !battingOrder.includes(state.nonStrikerId)) battingOrder.push(state.nonStrikerId);
  const inningsLabel = (i: number) => {
    const s = entries[i]?.state;
    if (!s) return `Innings ${i + 1}`;
    return `${teamName(s.battingTeamId)} ${i % 2 === 1 ? "2nd" : "1st"}`;
  };
  const extrasTotal = state.extras.wides + state.extras.noBalls + state.extras.byes + state.extras.legByes + state.extras.penalty;
  const extrasParts: string[] = [];
  if (state.extras.wides) extrasParts.push(`W ${state.extras.wides}`);
  if (state.extras.noBalls) extrasParts.push(`NB ${state.extras.noBalls}`);
  if (state.extras.byes) extrasParts.push(`B ${state.extras.byes}`);
  if (state.extras.legByes) extrasParts.push(`LB ${state.extras.legByes}`);
  if (state.extras.penalty) extrasParts.push(`PEN ${state.extras.penalty}`);

  const yetToBat = state.battingLineup.filter((id) => !state.batters[id] && id !== state.nonStrikerId);
  const fow = fallOfWickets(state);

  return (
    <div className="flex flex-col gap-6">
      {entries.length > 1 ? (
        <div className="flex overflow-hidden rounded-md border">
          {entries.map((_, i) => {
            const s = entries[i]?.state;
            const active = i === safeIndex;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActiveInnings(i)}
                className={`flex-1 px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                  active
                    ? "bg-card text-card-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {s ? teamName(s.battingTeamId) : `Innings ${i + 1}`}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="rounded-lg border">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
          <p className="text-2xl font-bold tabular-nums">{state.score}/{state.wickets}</p>
          <p className="text-sm text-muted-foreground">
            {state.overs} ov{target ? ` · Target ${target}` : ""} · RR {metrics?.runRate.toFixed(2)}
          </p>
          {metrics?.runsRequired != null && metrics.runsRequired > 0 ? (
            <p className="text-sm font-medium text-muted-foreground">
              Need {metrics.runsRequired} from {metrics.ballsRemaining} balls · RRR {metrics.requiredRunRate === Infinity ? "-" : metrics.requiredRunRate.toFixed(2)}
            </p>
          ) : null}
        </div>

        <div className="p-4">
          <div className="mb-1 grid grid-cols-[1fr_48px_40px_36px_36px_60px] gap-1 px-3 py-2 text-xs font-semibold text-muted-foreground">
            <span>Batter</span>
            <span className="text-right">R</span>
            <span className="text-right">B</span>
            <span className="text-right">4s</span>
            <span className="text-right">6s</span>
            <span className="text-right">S/R</span>
          </div>
          <div className="divide-y">
            {batters
              .sort((a, b) => {
                const aIdx = battingOrder.indexOf(a.playerId);
                const bIdx = battingOrder.indexOf(b.playerId);
                return (aIdx >= 0 ? aIdx : 999) - (bIdx >= 0 ? bIdx : 999);
              })
              .map((batter) => {
                const dismissed = Boolean(batter.dismissal);
                const dismissInfo = batter.dismissal ? dismissalText(batter.dismissal, state.events, playerName) : "not out";
                return (
                  <div key={batter.playerId} className={`grid grid-cols-[1fr_48px_40px_36px_36px_60px] gap-1 px-3 py-2 ${dismissed ? "text-muted-foreground/70" : ""}`}>
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-medium ${dismissed ? "text-destructive" : "text-card-foreground"}`}>
                        {playerName(batter.playerId)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{dismissInfo}</p>
                    </div>
                    <p className="self-center text-right text-sm tabular-nums font-medium">{batter.runs}</p>
                    <p className="self-center text-right text-sm tabular-nums text-muted-foreground">{batter.balls}</p>
                    <p className="self-center text-right text-sm tabular-nums text-muted-foreground">{batter.fours}</p>
                    <p className="self-center text-right text-sm tabular-nums text-muted-foreground">{batter.sixes}</p>
                    <p className="self-center text-right text-sm tabular-nums text-muted-foreground">
                      {batter.balls ? ((batter.runs / batter.balls) * 100).toFixed(1) : "0.0"}
                    </p>
                  </div>
                );
              })}
          </div>

          <div className="mt-2 grid grid-cols-[1fr_48px_40px_36px_36px_60px] gap-1 border-t px-3 py-2 text-sm text-muted-foreground">
            <span>Extras</span>
            <span className="text-right font-medium text-card-foreground">{extrasTotal}</span>
            <span className="col-span-4 text-right text-xs">{extrasParts.length ? `(${extrasParts.join(", ")})` : ""}</span>
          </div>

          <div className="grid grid-cols-[1fr_48px_40px_36px_36px_60px] gap-1 border-t px-3 py-2 text-sm font-semibold">
            <span className="text-muted-foreground">Total</span>
            <span className="text-right text-card-foreground">{state.score}/{state.wickets}</span>
            <span className="col-span-4 text-right text-xs text-muted-foreground">({state.overs} ov)</span>
          </div>
        </div>

        {yetToBat.length > 0 ? (
          <div className="border-t px-5 py-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Yet to bat</p>
            <p className="text-sm text-card-foreground">{yetToBat.map((id) => playerName(id)).join(" · ")}</p>
          </div>
        ) : null}

        {fow.length > 0 ? (
          <div className="border-t px-5 py-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Fall of wickets</p>
            <p className="text-sm text-card-foreground">
              {fow
                .map((w) => `${w.score}/${w.wicket} (${playerName(w.playerOutId)}, ${w.over} ov)`)
                .join(" · ")}
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border">
        <div className="grid grid-cols-[1fr_48px_40px_36px_36px_60px] gap-1 bg-muted/30 px-5 py-3 text-xs font-semibold text-muted-foreground">
          <span>Bowler</span>
          <span className="text-right">O</span>
          <span className="text-right">M</span>
          <span className="text-right">R</span>
          <span className="text-right">W</span>
          <span className="text-right">Econ</span>
        </div>
        <div className="divide-y px-5">
          {bowlers.map((bowler) => (
            <div key={bowler.playerId} className="grid grid-cols-[1fr_48px_40px_36px_36px_60px] gap-1 py-2">
              <p className="truncate text-sm font-medium text-card-foreground">{playerName(bowler.playerId)}</p>
              <p className="self-center text-right text-sm tabular-nums text-card-foreground">{`${Math.floor(bowler.legalBalls / 6)}.${bowler.legalBalls % 6}`}</p>
              <p className="self-center text-right text-sm tabular-nums text-muted-foreground">{bowler.maidens}</p>
              <p className="self-center text-right text-sm tabular-nums text-muted-foreground">{bowler.runs}</p>
              <p className="self-center text-right text-sm tabular-nums font-medium">{bowler.wickets}</p>
              <p className="self-center text-right text-sm tabular-nums text-muted-foreground">
                {bowler.legalBalls ? ((bowler.runs / bowler.legalBalls) * 6).toFixed(2) : "0.00"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Ball progression</h2>
        {state.events.length ? (
          <div className="flex flex-col gap-3">
            {Object.entries(
              state.events.reduce((acc, event) => {
                if (!acc[event.over]) acc[event.over] = [];
                acc[event.over].push(event);
                return acc;
              }, {} as Record<number, typeof state.events>)
            ).map(([overNum, overEvents]) => (
              <div key={overNum} className="flex flex-wrap items-center gap-2">
                <span className="w-10 text-sm font-medium text-muted-foreground">Ov {Number(overNum) + 1}</span>
                {overEvents.map((event) => (
                  <span key={event.id} className="grid min-h-10 min-w-10 place-items-center rounded-md border px-2 text-sm font-semibold" title={event.commentary}>
                    {event.dismissal ? "W" : event.extraType === "wide" ? "Wd" : event.extraType === "no-ball" ? "Nb" : event.totalRuns}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">No deliveries recorded.</p>}
      </div>
    </div>
  );
}
