"use client";

import { cricketChaseText, cricketInningsMetrics, fallOfWickets, type BatterInnings, type CricketDelivery, type CricketExtraType, type DismissalType, type FieldEventType, type Player, type Team } from "@sports-fiesta/domain";
import { ArrowLeft, LoaderCircle, RotateCcw, Square, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { callOrganizerCommand, revisionCommand, usePrivateCollection, usePrivateDocument } from "@/lib/organizer-data";
import type { PublicMatch } from "@/lib/web-types";

export function OrganizerMatchScorer({ matchId }: { matchId: string }) {
  const router = useRouter();
  const matchState = usePrivateDocument<PublicMatch>("matches", matchId);
  const teams = usePrivateCollection<Team>("teams");
  const players = usePrivateCollection<Player>("players");
  const [pending, setPending] = useState(false);
  const [motmSuggestions, setMotmSuggestions] = useState<Array<{ playerId: string; total: number; reason: string }>>([]);
  const match = matchState.data;

  async function run(name: string, data: Record<string, unknown> = {}) {
    if (!match) return;
    setPending(true);
    try {
      await callOrganizerCommand(name, revisionCommand(match.id, match.revision, data));
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Score update failed.";
      if (msg.includes("out of sync")) {
        toast.loading("Syncing latest match data...");
        window.location.reload();
      } else {
        toast.error(msg);
      }
    } finally { setPending(false); }
  }

  async function completeMatch(manOfTheMatchPlayerId?: string) {
    if (!match) return;
    setPending(true);
    try {
      await callOrganizerCommand("endMatch", revisionCommand(match.id, match.revision, { manOfTheMatchPlayerId }));
      router.push("/organizer/matches");
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Match completion failed.";
      try {
        const parsed = JSON.parse(msg) as { reason?: string; message?: string; suggestions?: Array<{ playerId: string; total: number; reason: string }> };
        if (parsed.reason === "MOTM_REQUIRED") {
          setMotmSuggestions(parsed.suggestions ?? []);
          toast.error(parsed.message ?? "Select Man of the Match.");
        } else toast.error(msg);
      } catch {
        toast.error(msg);
      }
    } finally { setPending(false); }
  }

  if (matchState.loading || teams.loading || players.loading) return <ContentSkeleton />;
  const error = matchState.error || teams.error || players.error;
  if (error) return <DataError message={error} retry={matchState.retry} />;
  if (!match) return <p>Match not found.</p>;
  const home = teams.data.find((team) => team.id === match.homeTeamId);
  const away = teams.data.find((team) => team.id === match.awayTeamId);
  const teamName = (id: string) => teams.data.find((team) => team.id === id)?.name ?? "Team";
  const playerName = (id: string | null | undefined) => players.data.find((player) => player.id === id)?.name ?? "Player";
  const confirmedPlayers = players.data.filter((player) => [match.homeTeamId, match.awayTeamId].includes(player.teamId));

  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Button nativeButton={false} variant="ghost" className="mb-3" render={<Link href="/organizer/matches" />}><ArrowLeft data-icon="inline-start" /> Matches</Button><h1 className="text-2xl font-semibold">{home?.name ?? "Home"} vs {away?.name ?? "Away"}</h1><p className="mt-1 text-sm capitalize text-muted-foreground">{match.sport} · {match.stage} · revision {match.revision}</p></div><Badge variant={match.status === "live" ? "destructive" : "secondary"}>{match.status.replace("-", " ")}</Badge></div>

    {match.status === "scheduled" && match.sport !== "cricket" ? <Card className="shadow-none"><CardHeader><CardTitle>Start match</CardTitle><CardDescription>Start scoring when the match is ready.</CardDescription></CardHeader><CardContent><Button size="lg" onClick={() => run("startMatch")} disabled={pending}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}Start match</Button></CardContent></Card> : null}

    {match.sport === "cricket" ? <CricketConsole key={`${match.id}-${match.status}-${match.revision}`} match={match} players={players.data} teams={teams.data} pending={pending} run={run} completeMatch={completeMatch} motmSuggestions={motmSuggestions} confirmedPlayers={confirmedPlayers} teamName={teamName} playerName={playerName} /> : <FieldConsole match={match} players={players.data} teams={teams.data} pending={pending} run={run} completeMatch={completeMatch} motmSuggestions={motmSuggestions} confirmedPlayers={confirmedPlayers} teamName={teamName} playerName={playerName} />}
  </div>;
}

type RunCommand = (name: string, data?: Record<string, unknown>) => Promise<void>;

function playerLabel(player: Player) {
  return player.jerseyNumber === null ? player.name : `#${player.jerseyNumber} · ${player.name}`;
}

function CricketConsole({ match, players, teams, pending, run, completeMatch, motmSuggestions, confirmedPlayers, teamName, playerName }: { match: PublicMatch; players: Player[]; teams: Team[]; pending: boolean; run: RunCommand; completeMatch: (playerId?: string) => void; motmSuggestions: Array<{ playerId: string; total: number; reason: string }>; confirmedPlayers: Player[]; teamName: (id: string) => string; playerName: (id?: string | null) => string }) {
  const entries = match.cricket?.innings ?? [];
  const currentIndex = match.cricket?.currentInnings ?? -1;
  const current = entries[currentIndex]?.state;
  if (["scheduled", "innings-break", "super-over"].includes(match.status)) return <CricketInningsSetup match={match} players={players} teams={teams} pending={pending} run={run} superOver={match.status === "super-over"} />;
  if (!current && match.status === "scheduled") return null;
  if (!current) return <Card className="shadow-none"><CardContent className="py-12 text-center text-muted-foreground">Start the first innings to open scoring.</CardContent></Card>;
  const battingPlayers = players.filter((player) => current.battingLineup.includes(player.id));
  const bowlingPlayers = players.filter((player) => current.bowlingLineup.includes(player.id));
  return <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
    <OrganizerCricketScorecard entries={entries} currentIndex={currentIndex} teamName={teamName} playerName={playerName} />
    <Card className="shadow-none"><CardHeader><CardTitle>Ball-by-ball scoring</CardTitle><CardDescription>Score controls stay synced with the full scorecard.</CardDescription></CardHeader><CardContent>
      {!current.strikerId ? <ParticipantSelect label="Next batter" players={battingPlayers.filter((player) => player.id !== current.nonStrikerId && !current.batters[player.id]?.dismissal)} pending={pending} onSelect={(playerId) => run("selectNextBatter", { playerId })} /> : null}
      {!current.currentBowlerId ? <ParticipantSelect label="Bowler for this over" players={bowlingPlayers.filter((player) => player.id !== current.previousOverBowlerId)} pending={pending} onSelect={(playerId) => run("selectCricketBowler", { playerId })} /> : null}
      {current.strikerId && current.currentBowlerId && !current.completed ? <DeliveryControls current={current} pending={pending} run={run} bowlingPlayers={bowlingPlayers} playerName={playerName} /> : null}
      <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" onClick={() => run("undoLastEvent")} disabled={pending || current.events.length === 0}><RotateCcw data-icon="inline-start" /> Undo last ball</Button><Button variant="destructive" onClick={() => run("endInnings")} disabled={pending || current.completed}><Square data-icon="inline-start" /> End innings</Button></div>
      {match.resultText || current.completed ? <MotmPicker players={confirmedPlayers} suggestions={motmSuggestions} pending={pending} onComplete={completeMatch} /> : null}
    </CardContent></Card>
  </div>;
}

function OrganizerCricketScorecard({ entries, currentIndex, teamName, playerName }: {
  entries: NonNullable<PublicMatch["cricket"]>["innings"];
  currentIndex: number;
  teamName: (id: string) => string;
  playerName: (id?: string | null) => string;
}) {
  const [activeInnings, setActiveInnings] = useState(Math.max(0, currentIndex));
  const safeIndex = entries[activeInnings] ? activeInnings : Math.max(0, entries.length - 1);
  const state = entries[safeIndex]?.state;
  if (!state) return <Card className="shadow-none"><CardContent className="py-12 text-center text-muted-foreground">The scorecard will appear when the innings starts.</CardContent></Card>;
  const target = safeIndex % 2 === 1 ? (entries[safeIndex - 1]?.state.score ?? 0) + 1 : null;
  const metrics = cricketInningsMetrics(state, target);
  const chaseText = cricketChaseText(state, target);
  const batters = Object.values(state.batters);
  const bowlers = Object.values(state.bowlers);
  const battingOrder: string[] = [];
  for (const event of state.events) {
    if (!battingOrder.includes(event.strikerId)) battingOrder.push(event.strikerId);
    if (!battingOrder.includes(event.nonStrikerId)) battingOrder.push(event.nonStrikerId);
  }
  if (state.strikerId && !battingOrder.includes(state.strikerId)) battingOrder.push(state.strikerId);
  if (state.nonStrikerId && !battingOrder.includes(state.nonStrikerId)) battingOrder.push(state.nonStrikerId);
  const extrasTotal = state.extras.wides + state.extras.noBalls + state.extras.byes + state.extras.legByes + state.extras.penalty;
  const fow = fallOfWickets(state);
  const inningsLabel = (index: number) => {
    const innings = entries[index]?.state;
    return innings ? `${teamName(innings.battingTeamId)} ${index % 2 === 1 ? "2nd" : "1st"}` : `Innings ${index + 1}`;
  };

  return (
    <Card className="overflow-hidden shadow-none">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardDescription>{teamName(state.battingTeamId)} batting</CardDescription>
            <CardTitle className="mt-1 text-4xl tabular-nums">{state.score}/{state.wickets}</CardTitle>
            <CardDescription>{state.overs} ov{target ? ` · Target ${target}` : ""} · RR {metrics.runRate.toFixed(2)}</CardDescription>
          </div>
          {chaseText ? <Badge variant="outline">{chaseText}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-5">
        {entries.length > 1 ? (
          <div className="flex overflow-hidden rounded-md border">
            {entries.map((_, index) => <button key={index} type="button" onClick={() => setActiveInnings(index)} className={`flex-1 px-4 py-2.5 text-center text-sm font-semibold transition-colors ${index === safeIndex ? "bg-card text-card-foreground shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>{inningsLabel(index)}</button>)}
          </div>
        ) : null}
        <div className="grid gap-3 rounded-md bg-muted p-3 text-sm sm:grid-cols-3">
          <div><p className="text-muted-foreground">Striker</p><p className="font-medium">{playerName(state.strikerId)}{state.strikerId ? "*" : ""}</p></div>
          <div><p className="text-muted-foreground">Non-striker</p><p className="font-medium">{playerName(state.nonStrikerId)}</p></div>
          <div><p className="text-muted-foreground">Bowler</p><p className="font-medium">{playerName(state.currentBowlerId)}{state.currentBowlerId ? "*" : ""}</p></div>
        </div>
        <div className="rounded-lg border">
          <div className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.5rem_1.5rem_1.5rem_2.75rem] gap-1 bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground">
            <span>Batter</span><span className="text-right">R</span><span className="text-right">B</span><span className="text-right">4s</span><span className="text-right">6s</span><span className="text-right">S/R</span>
          </div>
          <div className="divide-y px-3">
            {batters.sort((a, b) => (battingOrder.indexOf(a.playerId) >= 0 ? battingOrder.indexOf(a.playerId) : 999) - (battingOrder.indexOf(b.playerId) >= 0 ? battingOrder.indexOf(b.playerId) : 999)).map((batter) => {
              const activeLabel = batter.playerId === state.strikerId ? "*" : "";
              return <div key={batter.playerId} className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.5rem_1.5rem_1.5rem_2.75rem] gap-1 py-2 text-sm"><div className="min-w-0"><p className="break-words font-medium text-card-foreground">{playerName(batter.playerId)}{activeLabel}</p><p className="break-words text-xs text-muted-foreground">{batter.dismissal ? organizerDismissalText(batter.dismissal, state.events, playerName) : "not out"}</p></div><p className="self-center text-right font-medium tabular-nums">{batter.runs}</p><p className="self-center text-right tabular-nums text-muted-foreground">{batter.balls}</p><p className="self-center text-right tabular-nums text-muted-foreground">{batter.fours}</p><p className="self-center text-right tabular-nums text-muted-foreground">{batter.sixes}</p><p className="self-center text-right tabular-nums text-muted-foreground">{batter.balls ? ((batter.runs / batter.balls) * 100).toFixed(1) : "0.0"}</p></div>;
            })}
            <div className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.5rem_1.5rem_1.5rem_2.75rem] gap-1 py-2 text-sm"><span className="text-muted-foreground">Extras</span><span className="text-right font-medium">{extrasTotal}</span><span className="col-span-4 text-right text-xs text-muted-foreground">W {state.extras.wides}, NB {state.extras.noBalls}, B {state.extras.byes}, LB {state.extras.legByes}</span></div>
          </div>
        </div>
        <div className="rounded-lg border">
          <div className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.5rem_1.75rem_1.5rem_2.75rem] gap-1 bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground">
            <span>Bowler</span><span className="text-right">O</span><span className="text-right">M</span><span className="text-right">R</span><span className="text-right">W</span><span className="text-right">Econ</span>
          </div>
          <div className="divide-y px-3">
            {bowlers.map((bowler) => <div key={bowler.playerId} className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.5rem_1.75rem_1.5rem_2.75rem] gap-1 py-2 text-sm"><p className="break-words font-medium text-card-foreground">{playerName(bowler.playerId)}{bowler.playerId === state.currentBowlerId ? "*" : ""}</p><p className="text-right tabular-nums">{Math.floor(bowler.legalBalls / 6)}.{bowler.legalBalls % 6}</p><p className="text-right tabular-nums text-muted-foreground">{bowler.maidens}</p><p className="text-right tabular-nums text-muted-foreground">{bowler.runs}</p><p className="text-right font-medium tabular-nums">{bowler.wickets}</p><p className="text-right tabular-nums text-muted-foreground">{bowler.legalBalls ? ((bowler.runs / bowler.legalBalls) * 6).toFixed(2) : "0.00"}</p></div>)}
          </div>
        </div>
        {fow.length ? <div className="rounded-md border px-4 py-3"><p className="mb-1 text-xs font-semibold text-muted-foreground">Fall of wickets</p><p className="text-sm">{fow.map((w) => `${w.score}/${w.wicket} (${playerName(w.playerOutId)}, ${w.over} ov)`).join(" · ")}</p></div> : null}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Ball progression</h2>
          {state.events.length ? <div className="flex flex-col gap-3">{Object.entries(state.events.reduce((acc, event) => { if (!acc[event.over]) acc[event.over] = []; acc[event.over].push(event); return acc; }, {} as Record<number, typeof state.events>)).map(([overNum, overEvents]) => <div key={overNum} className="flex flex-wrap items-center gap-2"><span className="w-10 text-sm font-medium text-muted-foreground">Ov {Number(overNum) + 1}</span>{overEvents.map((event) => <span key={event.id} className="grid min-h-10 min-w-10 place-items-center rounded-md border px-2 text-sm font-semibold" title={event.commentary}>{cricketEventLabel(event)}</span>)}</div>)}</div> : <p className="text-sm text-muted-foreground">No deliveries recorded.</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function organizerDismissalText(dismissal: NonNullable<BatterInnings["dismissal"]>, events: CricketDelivery[], playerName: (id?: string | null) => string) {
  const event = events.find((candidate) => candidate.dismissal?.playerOutId === dismissal.playerOutId);
  const bowler = event ? playerName(event.bowlerId) : "?";
  const fielder = dismissal.fielderId ? playerName(dismissal.fielderId) : null;
  if (dismissal.type === "bowled") return `b ${bowler}`;
  if (dismissal.type === "caught") return fielder ? `c ${fielder} b ${bowler}` : `c ? b ${bowler}`;
  if (dismissal.type === "lbw") return `lbw b ${bowler}`;
  if (dismissal.type === "stumped") return fielder ? `st ${fielder} b ${bowler}` : `st ? b ${bowler}`;
  if (dismissal.type === "run-out") return `run out (${fielder ?? "?"})`;
  return dismissal.type.replaceAll("-", " ");
}

function CricketInningsSetup({ match, players, teams, pending, run, superOver }: { match: PublicMatch; players: Player[]; teams: Team[]; pending: boolean; run: RunCommand; superOver: boolean }) {
  const previous = match.cricket?.innings.at(-1)?.state;
  const [batting, setBatting] = useState(previous ? previous.bowlingTeamId : match.homeTeamId);
  const bowling = batting === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
  const battingLineup = players.filter((player) => player.teamId === batting).map((player) => player.id);
  const bowlingLineup = players.filter((player) => player.teamId === bowling).map((player) => player.id);
  const [striker, setStriker] = useState(""); const [nonStriker, setNonStriker] = useState(""); const [bowler, setBowler] = useState("");
  const options = (ids: string[]) => players.filter((player) => ids.includes(player.id)).map((player) => ({ value: player.id, label: playerLabel(player) }));
  return <Card className="shadow-none"><CardHeader><CardTitle>{superOver ? "Start Super Over" : previous ? "Start next innings" : "Start first innings"}</CardTitle><CardDescription>Select the opening participants from the team rosters.</CardDescription></CardHeader><CardContent><FieldGroup className="grid md:grid-cols-2"><SimpleSelect label="Batting team" value={batting} setValue={setBatting} items={match.homeTeamId === match.awayTeamId ? [] : [{ value: match.homeTeamId, label: teams.find((team) => team.id === match.homeTeamId)?.name ?? "Home team" }, { value: match.awayTeamId, label: teams.find((team) => team.id === match.awayTeamId)?.name ?? "Away team" }]} /><SimpleSelect label="Striker" value={striker} setValue={setStriker} items={options(battingLineup)} /><SimpleSelect label="Non-striker" value={nonStriker} setValue={setNonStriker} items={options(battingLineup).filter((item) => item.value !== striker)} /><SimpleSelect label="Opening bowler" value={bowler} setValue={setBowler} items={options(bowlingLineup)} /><Button className="md:col-span-2" size="lg" disabled={pending || !striker || !nonStriker || !bowler || striker === nonStriker} onClick={() => run("startInnings", { battingTeamId: batting, bowlingTeamId: bowling, strikerId: striker, nonStrikerId: nonStriker, bowlerId: bowler, superOver })}>Start innings</Button></FieldGroup></CardContent></Card>;
}

function cricketEventLabel(event: CricketDelivery) {
  const parts: string[] = [];
  if (event.extraType === "no-ball") parts.push("Nb");
  else if (event.extraType === "wide") parts.push("Wd");
  else if (event.extraType === "dead-ball") parts.push("Dead");
  else if (event.extraType === "bye") parts.push(`${event.extraRuns ?? 0}B`);
  else if (event.extraType === "leg-bye") parts.push(`${event.extraRuns ?? 0}LB`);
  else if (event.extraType === "penalty") parts.push(`${event.extraRuns ?? 0}P`);
  if (!["wide", "bye", "leg-bye", "penalty", "dead-ball"].includes(event.extraType ?? "") && event.runsOffBat > 0) parts.push(String(event.runsOffBat));
  if (event.dismissal) parts.push("W");
  return parts.length ? parts.join(" + ") : String(event.totalRuns);
}

function DeliveryControls({ current, pending, run, bowlingPlayers, playerName }: { current: NonNullable<NonNullable<PublicMatch["cricket"]>["innings"][number]["state"]>; pending: boolean; run: RunCommand; bowlingPlayers: Player[]; playerName: (id?: string | null) => string }) {
  const [extraRuns, setExtraRuns] = useState(1);
  const [dismissal, setDismissal] = useState<DismissalType>("bowled");
  const [fielderId, setFielderId] = useState("");
  const [runOutRuns, setRunOutRuns] = useState(0);
  const [runOutNoBall, setRunOutNoBall] = useState(false);
  const [runOutPlayerId, setRunOutPlayerId] = useState(current.strikerId ?? "");
  const [runOutFielderId, setRunOutFielderId] = useState("");
  const needsFielder = dismissal === "caught" || dismissal === "stumped" || dismissal === "run-out";
  const delivery = (data: Record<string, unknown>) => run("recordCricketDelivery", { delivery: data });
  const recordWicket = () => {
    const dismissData: Record<string, unknown> = { type: dismissal, playerOutId: current.strikerId };
    if (needsFielder && fielderId) dismissData.fielderId = fielderId;
    delivery({ runsOffBat: 0, dismissal: dismissData });
  };
  const recordRunOut = () => {
    delivery({
      runsOffBat: runOutRuns,
      ...(runOutNoBall ? { extraType: "no-ball" satisfies CricketExtraType, extraRuns: 1 } : {}),
      dismissal: { type: "run-out", playerOutId: runOutPlayerId, fielderId: runOutFielderId },
    });
  };
  const activeBatters = [
    current.strikerId ? { value: current.strikerId, label: `Striker · ${playerName(current.strikerId)}` } : null,
    current.nonStrikerId ? { value: current.nonStrikerId, label: `Non-striker · ${playerName(current.nonStrikerId)}` } : null,
  ].filter((item): item is { value: string; label: string } => Boolean(item));
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-medium">Runs</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{[0, 1, 2, 3, 4, 5, 6].map((runs) => <Button key={runs} variant={runs === 4 || runs === 6 ? "default" : "outline"} className="h-12 text-base" disabled={pending} onClick={() => delivery({ runsOffBat: runs })}>{runs}</Button>)}</div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Extras</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Button variant="outline" disabled={pending} onClick={() => delivery({ runsOffBat: 0, extraType: "wide", extraRuns: 1 })}>Wide +1</Button><Button variant="outline" disabled={pending} onClick={() => delivery({ runsOffBat: 0, extraType: "no-ball", extraRuns: 1 })}>No ball +1</Button><Button variant="outline" disabled={pending} onClick={() => delivery({ runsOffBat: 0, extraType: "dead-ball" })}>Dead ball</Button></div>
        <div className="mt-2 grid grid-cols-[90px_1fr_1fr] gap-2"><Input type="number" min="1" max="6" value={extraRuns} onChange={(event) => setExtraRuns(Number(event.target.value))} aria-label="Extra runs" /><Button variant="outline" onClick={() => delivery({ runsOffBat: 0, extraType: "bye" satisfies CricketExtraType, extraRuns })}>Bye</Button><Button variant="outline" onClick={() => delivery({ runsOffBat: 0, extraType: "leg-bye" satisfies CricketExtraType, extraRuns })}>Leg bye</Button></div>
      </div>
      <div className="rounded-xl border p-3">
        <p className="mb-2 text-sm font-medium">Run out on this ball</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <SimpleSelect label="Completed runs" value={String(runOutRuns)} setValue={(value) => setRunOutRuns(Number(value))} items={[0, 1, 2, 3].map((runs) => ({ value: String(runs), label: `${runs} run${runs === 1 ? "" : "s"}` }))} />
          <SimpleSelect label="Out batter" value={runOutPlayerId} setValue={setRunOutPlayerId} items={activeBatters} />
          <SimpleSelect label="Fielder" value={runOutFielderId} setValue={setRunOutFielderId} items={bowlingPlayers.map((player) => ({ value: player.id, label: playerLabel(player) }))} />
          <Button type="button" variant={runOutNoBall ? "default" : "outline"} onClick={() => setRunOutNoBall((value) => !value)} disabled={pending}>
            {runOutNoBall ? "No ball included" : "Add no ball"}
          </Button>
          <Button className="sm:col-span-2" variant="destructive" disabled={pending || !runOutPlayerId || !runOutFielderId} onClick={recordRunOut}>Record run out</Button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Other wicket</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]"><SimpleSelect label="Dismissal" hideLabel value={dismissal} setValue={(value) => { setDismissal(value as DismissalType); setFielderId(""); }} items={["bowled", "caught", "lbw", "stumped", "hit-wicket", "retired-hurt", "retired-out", "obstructing-field"].map((value) => ({ value, label: value.replaceAll("-", " ") }))} /><Button variant="destructive" disabled={pending || (needsFielder && !fielderId)} onClick={recordWicket}>Record wicket</Button></div>
        {needsFielder ? <SimpleSelect label={dismissal === "caught" ? "Catcher" : dismissal === "stumped" ? "Keeper" : "Fielder"} value={fielderId} setValue={setFielderId} items={bowlingPlayers.map((player) => ({ value: player.id, label: playerLabel(player) }))} /> : null}
      </div>
    </div>
  );
}

function ParticipantSelect({ label, players, pending, onSelect }: { label: string; players: Player[]; pending: boolean; onSelect: (id: string) => void }) { const [value, setValue] = useState(""); return <div className="mb-5 rounded-md border p-4"><FieldGroup><SimpleSelect label={label} value={value} setValue={setValue} items={players.map((player) => ({ value: player.id, label: playerLabel(player) }))} /><Button disabled={pending || !value} onClick={() => onSelect(value)}>Confirm {label.toLowerCase()}</Button></FieldGroup></div>; }

function FieldConsole({ match, players, teams, pending, run, completeMatch, motmSuggestions, confirmedPlayers, teamName, playerName }: { match: PublicMatch; players: Player[]; teams: Team[]; pending: boolean; run: RunCommand; completeMatch: (playerId?: string) => void; motmSuggestions: Array<{ playerId: string; total: number; reason: string }>; confirmedPlayers: Player[]; teamName: (id: string) => string; playerName: (id?: string | null) => string }) {
  const [teamId, setTeamId] = useState(match.homeTeamId);
  const [playerId, setPlayerId] = useState("");
  const [type, setType] = useState<FieldEventType>("goal");
  if (match.status === "scheduled") return null;
  const eligible = players.filter((player) => player.teamId === teamId);
  const score = match.fieldState?.score ?? { [match.homeTeamId]: 0, [match.awayTeamId]: 0 };
  const homeScore = score[match.homeTeamId] ?? 0;
  const awayScore = score[match.awayTeamId] ?? 0;
  const jerseyFor = (id: string) => players.find((player) => player.id === id)?.jerseyNumber ?? null;

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="shadow-none">
        <CardHeader><CardTitle>Live score</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <div><p className="text-sm text-muted-foreground">{teamName(match.homeTeamId)}</p><p className="mt-2 text-5xl font-semibold">{homeScore}</p></div>
            <span>VS</span>
            <div><p className="text-sm text-muted-foreground">{teamName(match.awayTeamId)}</p><p className="mt-2 text-5xl font-semibold">{awayScore}</p></div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            {[...(match.fieldState?.events ?? [])].reverse().map((event, index) => (
              <div key={String(event.id ?? index)} className="flex justify-between gap-3 rounded-md border p-3 text-sm">
                <span className="font-medium capitalize">{String(event.type).replace("-", " ")} · {jerseyFor(String(event.playerId ?? "")) !== null ? `#${jerseyFor(String(event.playerId ?? ""))} · ` : ""}{playerName(String(event.playerId ?? ""))}</span>
                <span className="text-muted-foreground">{teamName(String(event.teamId))}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader><CardTitle>Record event</CardTitle><CardDescription>No match clock is used.</CardDescription></CardHeader>
        <CardContent>
          <FieldGroup>
            <SimpleSelect label="Event" value={type} setValue={(value) => setType(value as FieldEventType)} items={["goal", "own-goal", "yellow-card", "red-card", "shootout-goal", "shootout-miss"].map((value) => ({ value, label: value.replaceAll("-", " ") }))} />
            <SimpleSelect label="Team" value={teamId} setValue={(value) => { setTeamId(value); setPlayerId(""); }} items={teams.filter((team) => [match.homeTeamId, match.awayTeamId].includes(team.id)).map((team) => ({ value: team.id, label: team.name }))} />
            <SimpleSelect label="Player" value={playerId} setValue={setPlayerId} items={eligible.map((player) => ({ value: player.id, label: playerLabel(player) }))} />
            <Button size="lg" disabled={pending || !teamId || (!playerId && !type.startsWith("shootout"))} onClick={() => run("recordFieldEvent", { event: { type, teamId, playerId: playerId || undefined } })}>Record event</Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => run("undoLastEvent")} disabled={pending || !(match.fieldState?.events.length)}><RotateCcw data-icon="inline-start" /> Undo</Button>
            </div>
            <MotmPicker players={confirmedPlayers} suggestions={motmSuggestions} pending={pending} onComplete={completeMatch} />
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

function MotmPicker({ players, suggestions, pending, onComplete }: { players: Player[]; suggestions: Array<{ playerId: string; total: number; reason: string }>; pending: boolean; onComplete: (playerId?: string) => void }) {
  const [value, setValue] = useState("");
  const suggestedIds = suggestions.map((row) => row.playerId);
  const ordered = [...players].sort((a, b) => {
    const ai = suggestedIds.indexOf(a.id);
    const bi = suggestedIds.indexOf(b.id);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.name.localeCompare(b.name);
  });
  return (
    <div className="rounded-md border p-4">
      <FieldGroup>
        <div><p className="font-semibold">Man of the Match</p><p className="text-sm text-muted-foreground">Get suggestions, then select the award winner before completing.</p></div>
        {suggestions.length ? <div className="grid gap-2">{suggestions.map((row) => <button key={row.playerId} type="button" onClick={() => setValue(row.playerId)} className="rounded-md border px-3 py-2 text-left text-sm hover:bg-muted"><span className="font-medium">{players.find((player) => player.id === row.playerId)?.name ?? "Player"}</span><span className="block text-xs text-muted-foreground">{row.reason} · score {row.total}</span></button>)}</div> : null}
        <SimpleSelect label="Award winner" value={value} setValue={setValue} items={ordered.map((player) => ({ value: player.id, label: playerLabel(player) }))} />
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => onComplete()} disabled={pending}>Suggest names</Button><Button variant="destructive" onClick={() => onComplete(value)} disabled={pending || !value}><Trophy data-icon="inline-start" /> End match</Button></div>
      </FieldGroup>
    </div>
  );
}

function SimpleSelect({ label, value, setValue, items, hideLabel = false }: { label: string; value: string; setValue: (value: string) => void; items: Array<{ value: string; label: string }>; hideLabel?: boolean }) { return <Field>{hideLabel ? null : <FieldLabel>{label}</FieldLabel>}<Select value={value} onValueChange={(next) => setValue(next ?? "")}><SelectTrigger className="h-10 w-full capitalize"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger><SelectContent><SelectGroup>{items.map((item) => <SelectItem key={item.value} value={item.value} className="capitalize">{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>; }
