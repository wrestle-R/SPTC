"use client";

import { cricketChaseText, cricketInningsMetrics, fallOfWickets, getShootoutStatus, type BatterInnings, type CricketDelivery, type CricketExtraType, type DismissalType, type FieldEventType, type FieldMatchEvent, type Player, type Team } from "@sports-fiesta/domain";
import { ArrowLeft, LoaderCircle, RotateCcw, Square, Trophy, Trash2 } from "lucide-react";
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
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { callOrganizerCommand, revisionCommand, usePrivateCollection, usePrivateDocument } from "@/lib/organizer-data";
import type { PublicMatch } from "@/lib/web-types";

export function OrganizerMatchScorer({ matchId }: { matchId: string }) {
  const router = useRouter();
  const matchState = usePrivateDocument<PublicMatch>("matches", matchId);
  const teams = usePrivateCollection<Team>("teams");
  const players = usePrivateCollection<Player>("players");
  const [pending, setPending] = useState(false);
  const match = matchState.data;

  async function run(name: string, data: Record<string, unknown> = {}) {
    if (!match) return;
    
    const previousMatch = { ...match };
    
    if (name === "recordFieldEvent") {
      const eventData = (data.event ?? {}) as {
        type?: string;
        teamId?: string;
      } & Record<string, string | number | undefined>;
      matchState.mutate((prev) => {
        if (!prev) return prev;
        const fieldState = prev.fieldState ?? {
          teamIds: [prev.homeTeamId, prev.awayTeamId] as [string, string],
          score: { [prev.homeTeamId]: 0, [prev.awayTeamId]: 0 },
          shootout: { [prev.homeTeamId]: 0, [prev.awayTeamId]: 0 },
          events: [],
        };
        const newScore = { ...fieldState.score };
        if ((eventData.type === "goal" || eventData.type === "shootout-goal") && eventData.teamId) {
           newScore[eventData.teamId] = (newScore[eventData.teamId] || 0) + 1;
        } else if (eventData.type === "own-goal" && eventData.teamId) {
           const otherTeamId = eventData.teamId === prev.homeTeamId ? prev.awayTeamId : prev.homeTeamId;
           newScore[otherTeamId] = (newScore[otherTeamId] || 0) + 1;
        }
        return {
          ...prev,
          fieldState: {
            ...fieldState,
            score: newScore,
            events: [...fieldState.events, { id: `optimistic-${Date.now()}`, teamId: eventData.teamId ?? "", type: (eventData.type ?? "goal") as FieldMatchEvent["type"], timestamp: new Date().toISOString(), ...eventData } as FieldMatchEvent],
          }
        };
      });
    } else if (name === "undoLastEvent" && match.sport !== "cricket") {
      matchState.mutate((prev) => {
        if (!prev || !prev.fieldState?.events?.length) return prev;
        const fieldState = prev.fieldState;
        const events = [...prev.fieldState.events];
        const lastEvent = events.pop() as Record<string, string | number> | undefined;
        const newScore = { ...fieldState.score };
        if (lastEvent) {
          if (lastEvent.type === "goal" || lastEvent.type === "shootout-goal") {
             newScore[lastEvent.teamId] = Math.max(0, (newScore[lastEvent.teamId] || 0) - 1);
          } else if (lastEvent.type === "own-goal") {
             const otherTeamId = lastEvent.teamId === prev.homeTeamId ? prev.awayTeamId : prev.homeTeamId;
             newScore[otherTeamId] = Math.max(0, (newScore[otherTeamId] || 0) - 1);
          }
        }
        return {
          ...prev,
          fieldState: {
            ...fieldState,
            score: newScore,
            events,
          }
        };
      });
    }

    setPending(true);
    try {
      await callOrganizerCommand(name, revisionCommand(previousMatch.id, previousMatch.revision, data));
    } catch (cause) {
      matchState.mutate(() => previousMatch);
      const msg = cause instanceof Error ? cause.message : "Score update failed.";
      if (msg.includes("out of sync")) {
        toast.loading("Syncing latest match data...");
        window.location.reload();
      } else {
        toast.error(msg);
      }
    } finally { setPending(false); }
  }

  async function deleteMatch() {
    if (!match) return;
    setPending(true);
    try {
      await callOrganizerCommand("deleteMatch", { matchId });
      toast.success("Match deleted.");
      router.push("/organizer/matches");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Failed to delete match.");
      setPending(false);
    }
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
        const parsed = JSON.parse(msg) as { reason?: string; message?: string };
        if (parsed.reason === "MOTM_REQUIRED") {
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
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Button nativeButton={false} variant="ghost" className="mb-3" render={<Link href="/organizer/matches" />}><ArrowLeft data-icon="inline-start" /> Matches</Button><h1 className="text-2xl font-semibold">{home?.name ?? "Home"} vs {away?.name ?? "Away"}</h1><p className="mt-1 text-sm capitalize text-muted-foreground">{match.sport} · {match.stage} · revision {match.revision}</p></div><div className="flex items-center gap-2"><Badge variant={match.status === "live" ? "destructive" : "secondary"}>{match.status.replace("-", " ")}</Badge><Dialog><DialogTrigger render={<Button variant="outline" size="icon" />}><Trash2 className="size-4 text-destructive" /></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Delete match</DialogTitle><DialogDescription>Are you sure you want to delete this match? This action cannot be undone. All recorded events and scores for this match will be lost.</DialogDescription></DialogHeader><DialogFooter className="mt-4"><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button variant="destructive" disabled={pending} onClick={deleteMatch}>{pending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}Delete</Button></DialogFooter></DialogContent></Dialog></div></div>

    {match.status === "scheduled" && match.sport !== "cricket" ? <Card className="shadow-none"><CardHeader><CardTitle>Start match</CardTitle><CardDescription>Start scoring when the match is ready.</CardDescription></CardHeader><CardContent><Button size="lg" onClick={() => run("startMatch")} disabled={pending}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}Start match</Button></CardContent></Card> : null}

    {match.sport === "cricket" ? <CricketConsole key={`${match.id}-${match.status}-${match.revision}`} match={match} players={players.data} teams={teams.data} pending={pending} run={run} completeMatch={completeMatch} confirmedPlayers={confirmedPlayers} teamName={teamName} playerName={playerName} /> : <FieldConsole match={match} players={players.data} teams={teams.data} pending={pending} run={run} completeMatch={completeMatch} confirmedPlayers={confirmedPlayers} teamName={teamName} playerName={playerName} />}
  </div>;
}

type RunCommand = (name: string, data?: Record<string, unknown>) => Promise<void>;

function playerLabel(player: Player) {
  return player.jerseyNumber === null ? player.name : `#${player.jerseyNumber} · ${player.name}`;
}

function CricketConsole({ match, players, teams, pending, run, completeMatch, confirmedPlayers, teamName, playerName }: { match: PublicMatch; players: Player[]; teams: Team[]; pending: boolean; run: RunCommand; completeMatch: (playerId?: string) => void; confirmedPlayers: Player[]; teamName: (id: string) => string; playerName: (id?: string | null) => string }) {
  const entries = match.cricket?.innings ?? [];
  const currentIndex = match.cricket?.currentInnings ?? -1;
  const current = entries[currentIndex]?.state;
  if (["scheduled", "innings-break", "super-over"].includes(match.status)) return <CricketInningsSetup match={match} players={players} teams={teams} pending={pending} run={run} superOver={match.status === "super-over"} />;
  if (!current && match.status === "scheduled") return null;
  if (!current) return <Card className="shadow-none max-sm:border-0 max-sm:bg-transparent"><CardContent className="py-12 text-center text-muted-foreground">Start the first innings to open scoring.</CardContent></Card>;
  const battingPlayers = players.filter((player) => current.battingLineup.includes(player.id));
  const bowlingPlayers = players.filter((player) => current.bowlingLineup.includes(player.id));
  return <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr] sm:gap-4">
    <OrganizerCricketScorecard entries={entries} currentIndex={currentIndex} teamName={teamName} playerName={playerName} />
    <Card className="shadow-none max-sm:border-0 max-sm:bg-transparent"><CardHeader><CardTitle>Ball-by-ball scoring</CardTitle><CardDescription>Score controls stay synced with the full scorecard.</CardDescription></CardHeader><CardContent className="max-sm:px-0">
      {!current.strikerId ? <ParticipantSelect label="Next batter" players={battingPlayers.filter((player) => player.id !== current.nonStrikerId && !current.batters[player.id]?.dismissal)} pending={pending} onSelect={(playerId) => run("selectNextBatter", { playerId })} /> : null}
      {!current.currentBowlerId ? <ParticipantSelect label="Bowler for this over" players={bowlingPlayers.filter((player) => player.id !== current.previousOverBowlerId)} pending={pending} onSelect={(playerId) => run("selectCricketBowler", { playerId })} /> : null}
      {current.strikerId && current.currentBowlerId && !current.completed ? <DeliveryControls current={current} pending={pending} run={run} battingPlayers={battingPlayers} bowlingPlayers={bowlingPlayers} playerName={playerName} /> : null}
      <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" onClick={() => run("undoLastEvent")} disabled={pending || current.events.length === 0}><RotateCcw data-icon="inline-start" /> Undo last ball</Button><Button variant="destructive" onClick={() => run("endInnings")} disabled={pending || current.completed}><Square data-icon="inline-start" /> End innings</Button></div>
      {match.resultText || current.completed ? <MotmPicker players={confirmedPlayers} pending={pending} onComplete={completeMatch} /> : null}
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
    <Card className="overflow-hidden shadow-none max-sm:border-0 max-sm:bg-transparent">
      <CardHeader className="border-b bg-muted/30 max-sm:border-b-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardDescription>{teamName(state.battingTeamId)} batting</CardDescription>
            <CardTitle className="mt-1 text-4xl tabular-nums">{state.score}/{state.wickets}</CardTitle>
            <CardDescription>{state.overs} ov{target ? ` · Target ${target}` : ""} · RR {metrics.runRate.toFixed(2)}</CardDescription>
          </div>
          {chaseText ? <Badge variant="outline">{chaseText}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-3 sm:gap-5 sm:pt-5">
        {entries.length > 1 ? (
          <div className="flex overflow-hidden rounded-md border">
            {entries.map((_, index) => <button key={index} type="button" onClick={() => setActiveInnings(index)} className={`flex-1 px-4 py-2.5 text-center text-sm font-semibold transition-colors ${index === safeIndex ? "bg-card text-card-foreground shadow-sm" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}>{inningsLabel(index)}</button>)}
          </div>
        ) : null}
        <div className="rounded-lg border max-sm:border-0 max-sm:bg-transparent">
          <div className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.5rem_1.5rem_1.5rem_2.75rem] gap-1 bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground max-sm:bg-transparent max-sm:px-0">
            <span>Batter</span><span className="text-right">R</span><span className="text-right">B</span><span className="text-right">4s</span><span className="text-right">6s</span><span className="text-right">S/R</span>
          </div>
          <div className="divide-y px-3 max-sm:divide-y-0 max-sm:space-y-0.5 max-sm:px-0">
            {batters.sort((a, b) => (battingOrder.indexOf(a.playerId) >= 0 ? battingOrder.indexOf(a.playerId) : 999) - (battingOrder.indexOf(b.playerId) >= 0 ? battingOrder.indexOf(b.playerId) : 999)).map((batter) => {
              const activeLabel = batter.playerId === state.strikerId ? "*" : "";
              return <div key={batter.playerId} className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.5rem_1.5rem_1.5rem_2.75rem] gap-1 py-2 text-sm"><div className="min-w-0"><p className="break-words font-medium text-card-foreground">{playerName(batter.playerId)}{activeLabel}</p><p className="break-words text-xs text-muted-foreground">{batter.dismissal ? organizerDismissalText(batter.dismissal, state.events, playerName) : "not out"}</p></div><p className="self-center text-right font-medium tabular-nums">{batter.runs}</p><p className="self-center text-right tabular-nums text-muted-foreground">{batter.balls}</p><p className="self-center text-right tabular-nums text-muted-foreground">{batter.fours}</p><p className="self-center text-right tabular-nums text-muted-foreground">{batter.sixes}</p><p className="self-center text-right tabular-nums text-muted-foreground">{batter.balls ? ((batter.runs / batter.balls) * 100).toFixed(1) : "0.0"}</p></div>;
            })}
            <div className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.5rem_1.5rem_1.5rem_2.75rem] gap-1 py-2 text-sm"><span className="text-muted-foreground">Extras</span><span className="text-right font-medium">{extrasTotal}</span><span className="col-span-4 text-right text-xs text-muted-foreground">W {state.extras.wides}, NB {state.extras.noBalls}, B {state.extras.byes}, LB {state.extras.legByes}</span></div>
          </div>
        </div>
        <div className="rounded-lg border max-sm:border-0 max-sm:bg-transparent">
          <div className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.5rem_1.75rem_1.5rem_2.75rem] gap-1 bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground max-sm:bg-transparent max-sm:px-0">
            <span>Bowler</span><span className="text-right">O</span><span className="text-right">M</span><span className="text-right">R</span><span className="text-right">W</span><span className="text-right">Econ</span>
          </div>
          <div className="divide-y px-3 max-sm:divide-y-0 max-sm:space-y-0.5 max-sm:px-0">
            {bowlers.map((bowler) => <div key={bowler.playerId} className="grid grid-cols-[minmax(0,1fr)_1.75rem_1.5rem_1.75rem_1.5rem_2.75rem] gap-1 py-2 text-sm"><p className="break-words font-medium text-card-foreground">{playerName(bowler.playerId)}{bowler.playerId === state.currentBowlerId ? "*" : ""}</p><p className="text-right tabular-nums">{Math.floor(bowler.legalBalls / 6)}.{bowler.legalBalls % 6}</p><p className="text-right tabular-nums text-muted-foreground">{bowler.maidens}</p><p className="text-right tabular-nums text-muted-foreground">{bowler.runs}</p><p className="text-right font-medium tabular-nums">{bowler.wickets}</p><p className="text-right tabular-nums text-muted-foreground">{bowler.legalBalls ? ((bowler.runs / bowler.legalBalls) * 6).toFixed(2) : "0.00"}</p></div>)}
          </div>
        </div>
        {fow.length ? <div className="rounded-md border px-4 py-3 max-sm:border-0 max-sm:px-0"><p className="mb-1 text-xs font-semibold text-muted-foreground">Fall of wickets</p><p className="text-sm">{fow.map((w) => `${w.score}/${w.wicket} (${playerName(w.playerOutId)}, ${w.over} ov)`).join(" · ")}</p></div> : null}
        <div>
          <h2 className="mb-2 text-lg font-semibold sm:mb-3">Ball progression</h2>
          {state.events.length ? <div className="flex flex-col gap-2 sm:gap-3">{Object.entries(state.events.reduce((acc, event) => { if (!acc[event.over]) acc[event.over] = []; acc[event.over].push(event); return acc; }, {} as Record<number, typeof state.events>)).map(([overNum, overEvents]) => <div key={overNum} className="flex flex-wrap items-center gap-2"><span className="w-10 text-sm font-medium text-muted-foreground">Ov {Number(overNum) + 1}</span>{overEvents.map((event) => <span key={event.id} className="grid min-h-10 min-w-10 place-items-center rounded-md border px-2 text-sm font-semibold" title={event.commentary}>{cricketEventLabel(event)}</span>)}</div>)}</div> : <p className="text-sm text-muted-foreground">No deliveries recorded.</p>}
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
  return <Card className="shadow-none max-sm:border-0 max-sm:bg-transparent"><CardHeader><CardTitle>{superOver ? "Start Super Over" : previous ? "Start next innings" : "Start first innings"}</CardTitle><CardDescription>Select the opening participants from the team rosters.</CardDescription></CardHeader><CardContent className="max-sm:px-0"><FieldGroup className="grid md:grid-cols-2"><SimpleSelect label="Batting team" value={batting} setValue={setBatting} items={match.homeTeamId === match.awayTeamId ? [] : [{ value: match.homeTeamId, label: teams.find((team) => team.id === match.homeTeamId)?.name ?? "Home team" }, { value: match.awayTeamId, label: teams.find((team) => team.id === match.awayTeamId)?.name ?? "Away team" }]} /><SimpleSelect label="Striker" value={striker} setValue={setStriker} items={options(battingLineup)} /><SimpleSelect label="Non-striker" value={nonStriker} setValue={setNonStriker} items={options(battingLineup).filter((item) => item.value !== striker)} /><SimpleSelect label="Opening bowler" value={bowler} setValue={setBowler} items={options(bowlingLineup)} /><Button className="md:col-span-2" size="lg" disabled={pending || !striker || !nonStriker || !bowler || striker === nonStriker} onClick={() => run("startInnings", { battingTeamId: batting, bowlingTeamId: bowling, strikerId: striker, nonStrikerId: nonStriker, bowlerId: bowler, superOver })}>Start innings</Button></FieldGroup></CardContent></Card>;
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

function DeliveryControls({ current, pending, run, battingPlayers, bowlingPlayers, playerName }: { current: NonNullable<NonNullable<PublicMatch["cricket"]>["innings"][number]["state"]>; pending: boolean; run: RunCommand; battingPlayers: Player[]; bowlingPlayers: Player[]; playerName: (id?: string | null) => string }) {
  const [extraRuns, setExtraRuns] = useState(1);
  const [dismissal, setDismissal] = useState<DismissalType | "">("");
  const [fielderId, setFielderId] = useState("");
  const [runOutRuns, setRunOutRuns] = useState(0);
  const [runOutNoBall, setRunOutNoBall] = useState(false);
  const [runOutPlayerId, setRunOutPlayerId] = useState(current.strikerId ?? "");
  const [runOutFielderId, setRunOutFielderId] = useState("");
  const [runOutIncomingBatterId, setRunOutIncomingBatterId] = useState("");
  const [runOutNextStrikerId, setRunOutNextStrikerId] = useState("");
  const [runOutOpen, setRunOutOpen] = useState(false);
  const needsFielder = dismissal === "caught" || dismissal === "stumped";
  const delivery = (data: Record<string, unknown>) => run("recordCricketDelivery", { delivery: data });
  const activeBatters = [
    current.strikerId ? { value: current.strikerId, label: `Striker · ${playerName(current.strikerId)}` } : null,
    current.nonStrikerId ? { value: current.nonStrikerId, label: `Non-striker · ${playerName(current.nonStrikerId)}` } : null,
  ].filter((item): item is { value: string; label: string } => Boolean(item));
  const runOutNeedsReplacement = current.wickets + 1 < current.battingLineup.length - 1;
  const eligibleIncomingBatters = battingPlayers.filter((player) => player.id !== current.strikerId && player.id !== current.nonStrikerId && !current.batters[player.id]?.dismissal);
  const survivingBatterId = runOutPlayerId === current.strikerId ? current.nonStrikerId : current.strikerId ?? current.nonStrikerId;
  const selectedIncomingBatterId = eligibleIncomingBatters.some((player) => player.id === runOutIncomingBatterId)
    ? runOutIncomingBatterId
    : eligibleIncomingBatters[0]?.id ?? "";
  const selectedNextStrikerId = [
    survivingBatterId,
    ...(runOutNeedsReplacement && selectedIncomingBatterId ? [selectedIncomingBatterId] : []),
  ].includes(runOutNextStrikerId)
    ? runOutNextStrikerId
    : survivingBatterId;

  const openRunOutModal = () => {
    const defaultOutBatterId = current.strikerId ?? current.nonStrikerId;
    const nextSurvivingBatterId = defaultOutBatterId === current.strikerId ? current.nonStrikerId : current.strikerId ?? current.nonStrikerId;
    setRunOutRuns(0);
    setRunOutNoBall(false);
    setRunOutPlayerId(defaultOutBatterId);
    setRunOutFielderId("");
    setRunOutIncomingBatterId(eligibleIncomingBatters[0]?.id ?? "");
    setRunOutNextStrikerId(nextSurvivingBatterId);
    setRunOutOpen(true);
  };

  const recordWicket = () => {
    if (dismissal === "run-out") {
      openRunOutModal();
      return;
    }
    const dismissData: Record<string, unknown> = { type: dismissal, playerOutId: current.strikerId };
    if (needsFielder && fielderId) dismissData.fielderId = fielderId;
    delivery({ runsOffBat: 0, dismissal: dismissData });
    setDismissal("");
    setFielderId("");
  };
  const recordRunOut = () => {
    delivery({
      runsOffBat: runOutRuns,
      ...(runOutNoBall ? { extraType: "no-ball" satisfies CricketExtraType, extraRuns: 1 } : {}),
      dismissal: { type: "run-out", playerOutId: runOutPlayerId, fielderId: runOutFielderId },
      ...(runOutNeedsReplacement ? { nextStrikerId: selectedNextStrikerId, replacementBatterId: selectedIncomingBatterId } : {}),
    });
    setRunOutOpen(false);
    setDismissal("");
    setRunOutIncomingBatterId("");
    setRunOutNextStrikerId("");
  };
  const nextStrikerItems = [
    { value: survivingBatterId, label: `Surviving batter · ${playerName(survivingBatterId)}` },
    ...(runOutNeedsReplacement && selectedIncomingBatterId
      ? [{ value: selectedIncomingBatterId, label: `Incoming batter · ${playerName(selectedIncomingBatterId)}` }]
      : []),
  ];
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-medium">Runs</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{[0, 1, 2, 3, 4, 5, 6].map((runs) => <Button key={runs} variant={runs === 4 || runs === 6 ? "default" : "outline"} className="h-12 text-base" disabled={pending} onClick={() => delivery({ runsOffBat: runs })}>{runs}</Button>)}</div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Extras</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Button variant="outline" disabled={pending} onClick={() => delivery({ runsOffBat: 0, extraType: "wide", extraRuns: 1 })}>Wide +1</Button><Button variant="outline" disabled={pending} onClick={() => delivery({ runsOffBat: 0, extraType: "no-ball", extraRuns: 1 })}>No ball +1</Button><Button variant="outline" disabled={pending} onClick={() => delivery({ runsOffBat: 0, extraType: "dead-ball" })}>Dead ball</Button></div>
        <div className="mt-2">
          <p className="mb-2 text-xs font-medium text-muted-foreground">No ball + bat runs</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {[0, 1, 2, 3, 4, 5, 6].map((runs) => (
              <Button
                key={`no-ball-${runs}`}
                variant={runs === 4 || runs === 6 ? "default" : "outline"}
                className="h-11 text-sm"
                disabled={pending}
                onClick={() => delivery({ runsOffBat: runs, extraType: "no-ball", extraRuns: 1 })}
              >
                Nb + {runs}
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-[90px_1fr_1fr] gap-2"><Input type="number" min="1" max="6" value={extraRuns} onChange={(event) => setExtraRuns(Number(event.target.value))} aria-label="Extra runs" /><Button variant="outline" onClick={() => delivery({ runsOffBat: 0, extraType: "bye" satisfies CricketExtraType, extraRuns })}>Bye</Button><Button variant="outline" onClick={() => delivery({ runsOffBat: 0, extraType: "leg-bye" satisfies CricketExtraType, extraRuns })}>Leg bye</Button></div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Record wicket</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <SimpleSelect label="Dismissal" hideLabel value={dismissal} setValue={(value) => { setDismissal(value as DismissalType); setFielderId(""); }} items={["bowled", "caught", "lbw", "stumped", "run-out", "hit-wicket", "retired-hurt", "retired-out", "obstructing-field"].map((value) => ({ value, label: value.replaceAll("-", " ") }))} />
          <Button variant="destructive" disabled={pending || !dismissal || (needsFielder && !fielderId)} onClick={recordWicket}>Record wicket</Button>
        </div>
        {needsFielder ? <div className="mt-2"><SimpleSelect label={dismissal === "caught" ? "Catcher" : "Keeper"} value={fielderId} setValue={setFielderId} items={bowlingPlayers.map((player) => ({ value: player.id, label: playerLabel(player) }))} /></div> : null}
      </div>
      <Dialog open={runOutOpen} onOpenChange={setRunOutOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Run out details</DialogTitle><DialogDescription>Provide details about the run out to accurately reflect the score and next strike.</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <SimpleSelect label="Completed runs" value={String(runOutRuns)} setValue={(value) => setRunOutRuns(Number(value))} items={[0, 1, 2, 3, 4, 5, 6].map((runs) => ({ value: String(runs), label: `${runs} run${runs === 1 ? "" : "s"}` }))} />
            <SimpleSelect label="Out batter" value={runOutPlayerId} setValue={setRunOutPlayerId} items={activeBatters} />
            <SimpleSelect label="Fielder" value={runOutFielderId} setValue={setRunOutFielderId} items={bowlingPlayers.map((player) => ({ value: player.id, label: playerLabel(player) }))} />
            {runOutNeedsReplacement ? <SimpleSelect label="Incoming batter" value={selectedIncomingBatterId} setValue={setRunOutIncomingBatterId} items={eligibleIncomingBatters.map((player) => ({ value: player.id, label: playerLabel(player) }))} /> : null}
            {runOutNeedsReplacement ? <SimpleSelect label="Next striker" value={selectedNextStrikerId} setValue={setRunOutNextStrikerId} items={nextStrikerItems} /> : null}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={runOutNoBall ? "default" : "outline"} onClick={() => setRunOutNoBall((value) => !value)} disabled={pending}>
                {runOutNoBall ? "No ball included" : "Add no ball"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={pending || !runOutPlayerId || !runOutFielderId || (runOutNeedsReplacement && (!selectedIncomingBatterId || !selectedNextStrikerId))} onClick={recordRunOut}>Confirm run out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ParticipantSelect({ label, players, pending, onSelect }: { label: string; players: Player[]; pending: boolean; onSelect: (id: string) => void }) { const [value, setValue] = useState(""); return <div className="mb-5 rounded-md border p-4"><FieldGroup><SimpleSelect label={label} value={value} setValue={setValue} items={players.map((player) => ({ value: player.id, label: playerLabel(player) }))} /><Button disabled={pending || !value} onClick={() => onSelect(value)}>Confirm {label.toLowerCase()}</Button></FieldGroup></div>; }

function FieldConsole({ match, players, teams, pending, run, completeMatch, confirmedPlayers, teamName, playerName }: { match: PublicMatch; players: Player[]; teams: Team[]; pending: boolean; run: RunCommand; completeMatch: (playerId?: string) => void; confirmedPlayers: Player[]; teamName: (id: string) => string; playerName: (id?: string | null) => string }) {
  const [teamId, setTeamId] = useState(match.homeTeamId);
  const [playerId, setPlayerId] = useState("");
  const [type, setType] = useState<FieldEventType>("goal");
  if (match.status === "scheduled") return null;
  const eligible = players.filter((player) => player.teamId === teamId);
  const score = match.fieldState?.score ?? { [match.homeTeamId]: 0, [match.awayTeamId]: 0 };
  const shootoutScore = match.fieldState?.shootout ?? { [match.homeTeamId]: 0, [match.awayTeamId]: 0 };
  const homeScore = score[match.homeTeamId] ?? 0;
  const awayScore = score[match.awayTeamId] ?? 0;
  const jerseyFor = (id: string) => players.find((player) => player.id === id)?.jerseyNumber ?? null;

  const scoresLevel = homeScore === awayScore;
  const shootoutAvailable = match.sport === "handball" || match.stage === "third-place" || match.stage === "final";
  const hasShootoutEvents = (match.fieldState?.events ?? []).some((e) => e.type === "shootout-goal" || e.type === "shootout-miss");
  const showShootout = shootoutAvailable && (scoresLevel || hasShootoutEvents);
  const shootoutStatus = showShootout && match.fieldState ? getShootoutStatus(match.fieldState) : null;

  const getEventMeta = (type: string) => {
    switch (type) {
      case "goal": return { icon: match.sport === "handball" ? "🤾" : "⚽", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500", label: "" };
      case "own-goal": return { icon: match.sport === "handball" ? "🤾" : "⚽", bg: "bg-orange-500/10 border-orange-500/20 text-orange-500", label: "Own Goal" };
      case "yellow-card": return { icon: "🟨", bg: "bg-yellow-500/10 border-yellow-500/20", label: "" };
      case "red-card": return { icon: "🟥", bg: "bg-red-500/10 border-red-500/20", label: "" };
      case "shootout-goal": return { icon: "✅", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500", label: "" };
      case "shootout-miss": return { icon: "❌", bg: "bg-destructive/10 border-destructive/20 text-destructive", label: "" };
      default: return { icon: "⏱", bg: "bg-primary/10 border-primary/20 text-primary", label: "" };
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="shadow-none">
        <CardHeader><CardTitle>Live score</CardTitle></CardHeader>
        <CardContent>
          <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-muted/50 to-muted/10 p-6">
            <div className="flex items-center justify-between gap-2 text-center">
              <div className="flex flex-1 flex-col items-center gap-2">
                <p className="line-clamp-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{teamName(match.homeTeamId)}</p>
                <p className="text-5xl font-black tracking-tighter">{homeScore}</p>
                {showShootout && hasShootoutEvents ? (
                  <p className="text-lg font-bold tabular-nums text-emerald-500">({shootoutScore[match.homeTeamId] ?? 0})</p>
                ) : null}
              </div>
              <div className="flex flex-col items-center">
                <span className="rounded-full bg-background px-2 py-1 text-[10px] font-bold tracking-widest text-muted-foreground shadow-sm">VS</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-2">
                <p className="line-clamp-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{teamName(match.awayTeamId)}</p>
                <p className="text-5xl font-black tracking-tighter">{awayScore}</p>
                {showShootout && hasShootoutEvents ? (
                  <p className="text-lg font-bold tabular-nums text-emerald-500">({shootoutScore[match.awayTeamId] ?? 0})</p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            {[...(match.fieldState?.events ?? [])].reverse().map((event, index) => {
              const meta = getEventMeta(String(event.type));
              return (
                <div key={String(event.id ?? index)} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 text-sm shadow-sm transition-all hover:bg-muted/50">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-full border text-base ${meta.bg}`}>
                      {meta.icon}
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="font-bold capitalize">{meta.label || String(event.type).replace("-", " ")}</span>
                      {event.playerId ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          {jerseyFor(String(event.playerId)) !== null ? (
                            <span className="font-semibold">#{jerseyFor(String(event.playerId))}</span>
                          ) : null}
                          <span className="truncate">{playerName(String(event.playerId))}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">Team event</span>
                      )}
                    </div>
                  </div>
                  <span className="max-w-24 shrink-0 truncate text-right text-xs font-medium text-muted-foreground">{teamName(String(event.teamId))}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader><CardTitle>Record event</CardTitle></CardHeader>
        <CardContent>
          <FieldGroup>
            <div>
              <p className="mb-2 text-sm font-medium">Event Type</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "goal", icon: match.sport === "handball" ? "🤾" : "⚽", label: "Goal" },
                  { id: "own-goal", icon: match.sport === "handball" ? "🤾" : "⚽", label: "Own Goal" },
                  { id: "yellow-card", icon: "🟨", label: "Yellow Card" },
                  { id: "red-card", icon: "🟥", label: "Red Card" },
                  ...(showShootout ? [
                    { id: "shootout-goal", icon: "✅", label: "Shootout Goal" },
                    { id: "shootout-miss", icon: "❌", label: "Shootout Miss" },
                  ] : [])
                ].map((item) => {
                  const isActive = type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id as FieldEventType)}
                      className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                        isActive 
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {showShootout ? (
              <div className="rounded-md border bg-muted/20 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  {hasShootoutEvents ? "🔴 Shootout in progress" : "⚪ Shootout mode"}
                </p>
                {shootoutStatus ? (
                  <div className="mb-3 space-y-1 text-sm">
                    <p className="font-medium">
                      {teamName(match.homeTeamId)}: {shootoutScore[match.homeTeamId] ?? 0}/{shootoutStatus.attempts[match.homeTeamId]}
                      {" "}· {teamName(match.awayTeamId)}: {shootoutScore[match.awayTeamId] ?? 0}/{shootoutStatus.attempts[match.awayTeamId]}
                    </p>
                    <p className="text-muted-foreground">
                      Phase: {shootoutStatus.phase === "sudden-death" ? "Sudden Death" : "Best of 5"}
                      {hasShootoutEvents && !shootoutStatus.complete ? (
                        <span className="ml-2 font-semibold text-foreground">
                          Next: {teamName(shootoutStatus.nextTeamId)}
                        </span>
                      ) : null}
                      {shootoutStatus.complete && shootoutStatus.winnerTeamId ? (
                        <span className="ml-2 font-semibold text-emerald-500">
                          Winner: {teamName(shootoutStatus.winnerTeamId)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            <SimpleSelect label="Team" value={teamId} setValue={(value) => { setTeamId(value); setPlayerId(""); }} items={teams.filter((team) => [match.homeTeamId, match.awayTeamId].includes(team.id)).map((team) => ({ value: team.id, label: team.name }))} />
            <SimpleSelect label="Player" value={playerId} setValue={setPlayerId} items={eligible.map((player) => ({ value: player.id, label: playerLabel(player) }))} />
            <Button size="lg" disabled={pending || !teamId || (!playerId && !type.startsWith("shootout"))} onClick={() => run("recordFieldEvent", { event: { type, teamId, playerId: playerId || undefined } })}>Record event</Button>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => run("undoLastEvent")} disabled={pending || !(match.fieldState?.events.length)}><RotateCcw data-icon="inline-start" /> Undo</Button>
            </div>
            <MotmPicker players={confirmedPlayers} pending={pending} onComplete={completeMatch} />
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

function MotmPicker({ players, pending, onComplete }: { players: Player[]; pending: boolean; onComplete: (playerId?: string) => void }) {
  const [value, setValue] = useState("");
  const ordered = [...players].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="rounded-md border p-4">
      <FieldGroup>
        <div><p className="font-semibold">Man of the Match</p><p className="text-sm text-muted-foreground">Select the award winner before completing.</p></div>
        <SimpleSelect label="Award winner" value={value} setValue={setValue} items={ordered.map((player) => ({ value: player.id, label: playerLabel(player) }))} />
        <Button variant="destructive" onClick={() => onComplete(value)} disabled={pending || !value}><Trophy data-icon="inline-start" /> End match</Button>
      </FieldGroup>
    </div>
  );
}

function SimpleSelect({ label, value, setValue, items, hideLabel = false }: { label: string; value: string; setValue: (value: string) => void; items: Array<{ value: string; label: string }>; hideLabel?: boolean }) { return <Field>{hideLabel ? null : <FieldLabel>{label}</FieldLabel>}<Select value={value} onValueChange={(next) => setValue(next ?? "")}><SelectTrigger className="h-10 w-full capitalize"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger><SelectContent><SelectGroup>{items.map((item) => <SelectItem key={item.value} value={item.value} className="capitalize">{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>; }
