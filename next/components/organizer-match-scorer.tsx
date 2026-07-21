"use client";

import type { CricketExtraType, DismissalType, FieldEventType, Player, Team } from "@sports-fiesta/domain";
import { ArrowLeft, LoaderCircle, RotateCcw, Square, Trophy } from "lucide-react";
import Link from "next/link";
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
  const matchState = usePrivateDocument<PublicMatch>("matches", matchId);
  const teams = usePrivateCollection<Team>("teams");
  const players = usePrivateCollection<Player>("players");
  const [pending, setPending] = useState(false);
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

  if (matchState.loading || teams.loading || players.loading) return <ContentSkeleton />;
  const error = matchState.error || teams.error || players.error;
  if (error) return <DataError message={error} retry={matchState.retry} />;
  if (!match) return <p>Match not found.</p>;
  const home = teams.data.find((team) => team.id === match.homeTeamId);
  const away = teams.data.find((team) => team.id === match.awayTeamId);
  const teamName = (id: string) => teams.data.find((team) => team.id === id)?.name ?? "Team";
  const playerName = (id: string | null | undefined) => players.data.find((player) => player.id === id)?.name ?? "Player";
  const roster = (teamId: string) => players.data.filter((player) => player.teamId === teamId && player.active);

  return <div className="flex flex-col gap-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><Button nativeButton={false} variant="ghost" className="mb-3" render={<Link href="/organizer/matches" />}><ArrowLeft data-icon="inline-start" /> Matches</Button><h1 className="text-2xl font-semibold">{home?.name ?? "Home"} vs {away?.name ?? "Away"}</h1><p className="mt-1 text-sm capitalize text-muted-foreground">{match.sport} · {match.stage} · revision {match.revision}</p></div><Badge variant={match.status === "live" ? "destructive" : "secondary"}>{match.status.replace("-", " ")}</Badge></div>

    {match.status === "scheduled" ? <Card className="shadow-none"><CardHeader><CardTitle>Match setup</CardTitle><CardDescription>Publish each team lineup, then start the match.</CardDescription></CardHeader><CardContent className="flex flex-col gap-5"><div className="grid gap-4 lg:grid-cols-2"><LineupForm team={home} players={roster(match.homeTeamId)} pending={pending} onSave={(starters) => run("setLineup", { teamId: match.homeTeamId, starters, substitutes: [] })} /><LineupForm team={away} players={roster(match.awayTeamId)} pending={pending} onSave={(starters) => run("setLineup", { teamId: match.awayTeamId, starters, substitutes: [] })} /></div><Button size="lg" onClick={() => run("startMatch")} disabled={pending}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}Start match setup</Button></CardContent></Card> : null}

    {match.sport === "cricket" ? <CricketConsole key={`${match.id}-${match.status}-${match.revision}`} match={match} players={players.data} teams={teams.data} pending={pending} run={run} teamName={teamName} playerName={playerName} /> : <FieldConsole match={match} players={players.data} teams={teams.data} pending={pending} run={run} teamName={teamName} playerName={playerName} />}
  </div>;
}

function LineupForm({ team, players, pending, onSave }: { team?: Team; players: Player[]; pending: boolean; onSave: (ids: string[]) => void }) {
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); onSave(new FormData(event.currentTarget).getAll("players").map(String)); }
  return <form onSubmit={submit} className="rounded-md border p-4"><FieldGroup><div><p className="font-semibold">{team?.name ?? "Team"}</p><p className="text-sm text-muted-foreground">Select the playing lineup.</p></div><div className="grid max-h-60 gap-2 overflow-y-auto">{players.map((player) => <label key={player.id} className="flex min-h-10 items-center gap-3 rounded-md border px-3 text-sm"><input type="checkbox" name="players" value={player.id} defaultChecked /> {player.name}</label>)}</div><Button type="submit" variant="outline" disabled={pending || players.length === 0}>Publish lineup</Button></FieldGroup></form>;
}

type RunCommand = (name: string, data?: Record<string, unknown>) => Promise<void>;

function CricketConsole({ match, players, teams, pending, run, teamName, playerName }: { match: PublicMatch; players: Player[]; teams: Team[]; pending: boolean; run: RunCommand; teamName: (id: string) => string; playerName: (id?: string | null) => string }) {
  const entries = match.cricket?.innings ?? [];
  const currentIndex = match.cricket?.currentInnings ?? -1;
  const current = entries[currentIndex]?.state;
  if (["lineup", "innings-break", "super-over"].includes(match.status)) return <CricketInningsSetup match={match} players={players} teams={teams} pending={pending} run={run} superOver={match.status === "super-over"} />;
  if (!current && match.status === "scheduled") return null;
  if (!current) return <Card className="shadow-none"><CardContent className="py-12 text-center text-muted-foreground">Start the first innings to open scoring.</CardContent></Card>;
  const battingPlayers = players.filter((player) => current.battingLineup.includes(player.id));
  const bowlingPlayers = players.filter((player) => current.bowlingLineup.includes(player.id));
  const target = currentIndex % 2 === 1 ? (entries[currentIndex - 1]?.state.score ?? 0) + 1 : null;
  return <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
    <Card className="shadow-none"><CardHeader><CardDescription>{teamName(current.battingTeamId)} batting</CardDescription><CardTitle className="text-4xl tabular-nums">{current.score}/{current.wickets}</CardTitle><CardDescription>{current.overs} overs{target ? ` · Target ${target}` : ""}</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><div className="grid grid-cols-2 gap-3 rounded-md bg-muted p-3 text-sm"><div><p className="text-muted-foreground">Striker</p><p className="font-medium">{playerName(current.strikerId)}</p></div><div><p className="text-muted-foreground">Bowler</p><p className="font-medium">{playerName(current.currentBowlerId)}</p></div></div><div className="flex flex-col gap-2">{Object.entries(current.events.slice(-18).reduce((acc, event) => { if (!acc[event.over]) acc[event.over] = []; acc[event.over].push(event); return acc; }, {} as Record<number, typeof current.events>)).map(([overNum, overEvents]) => <div key={overNum} className="flex flex-wrap items-center gap-2"><span className="w-8 text-xs font-medium text-muted-foreground">Ov {Number(overNum) + 1}</span>{overEvents.map((event) => <span key={event.id} className="grid min-h-10 min-w-10 place-items-center rounded-md border px-2 text-sm font-semibold">{event.dismissal ? "W" : event.extraType === "wide" ? "Wd" : event.extraType === "no-ball" ? "Nb" : event.totalRuns}</span>)}</div>)}</div></CardContent></Card>
    <Card className="shadow-none"><CardHeader><CardTitle>Ball-by-ball scoring</CardTitle><CardDescription>Strike, totals, overs, and player figures update automatically.</CardDescription></CardHeader><CardContent>
      {!current.strikerId ? <ParticipantSelect label="Next batter" players={battingPlayers.filter((player) => player.id !== current.nonStrikerId && !current.batters[player.id]?.dismissal)} pending={pending} onSelect={(playerId) => run("selectNextBatter", { playerId })} /> : null}
      {!current.currentBowlerId ? <ParticipantSelect label="Bowler for this over" players={bowlingPlayers.filter((player) => player.id !== current.previousOverBowlerId)} pending={pending} onSelect={(playerId) => run("selectCricketBowler", { playerId })} /> : null}
      {current.strikerId && current.currentBowlerId ? <DeliveryControls current={current} pending={pending} run={run} bowlingPlayers={bowlingPlayers} playerName={playerName} /> : null}
      <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" onClick={() => run("undoLastEvent")} disabled={pending || current.events.length === 0}><RotateCcw data-icon="inline-start" /> Undo last ball</Button><Button variant="destructive" onClick={() => run("endInnings")} disabled={pending}><Square data-icon="inline-start" /> End innings</Button></div>
    </CardContent></Card>
  </div>;
}

function CricketInningsSetup({ match, players, teams, pending, run, superOver }: { match: PublicMatch; players: Player[]; teams: Team[]; pending: boolean; run: RunCommand; superOver: boolean }) {
  const previous = match.cricket?.innings.at(-1)?.state;
  const [batting, setBatting] = useState(previous ? previous.bowlingTeamId : match.homeTeamId);
  const bowling = batting === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
  const battingLineup = match.lineups?.[batting]?.starters?.length ? match.lineups[batting].starters : players.filter((player) => player.teamId === batting && player.active).map((player) => player.id);
  const bowlingLineup = match.lineups?.[bowling]?.starters?.length ? match.lineups[bowling].starters : players.filter((player) => player.teamId === bowling && player.active).map((player) => player.id);
  const [striker, setStriker] = useState(""); const [nonStriker, setNonStriker] = useState(""); const [bowler, setBowler] = useState("");
  const options = (ids: string[]) => players.filter((player) => ids.includes(player.id)).map((player) => ({ value: player.id, label: player.name }));
  return <Card className="shadow-none"><CardHeader><CardTitle>{superOver ? "Start Super Over" : previous ? "Start next innings" : "Start first innings"}</CardTitle><CardDescription>Select the opening participants. The match uses {superOver ? "one" : "five"} over per innings.</CardDescription></CardHeader><CardContent><FieldGroup className="grid md:grid-cols-2"><SimpleSelect label="Batting team" value={batting} setValue={setBatting} items={match.homeTeamId === match.awayTeamId ? [] : [{ value: match.homeTeamId, label: teams.find((team) => team.id === match.homeTeamId)?.name ?? "Home team" }, { value: match.awayTeamId, label: teams.find((team) => team.id === match.awayTeamId)?.name ?? "Away team" }]} /><SimpleSelect label="Striker" value={striker} setValue={setStriker} items={options(battingLineup)} /><SimpleSelect label="Non-striker" value={nonStriker} setValue={setNonStriker} items={options(battingLineup).filter((item) => item.value !== striker)} /><SimpleSelect label="Opening bowler" value={bowler} setValue={setBowler} items={options(bowlingLineup)} /><Button className="md:col-span-2" size="lg" disabled={pending || !striker || !nonStriker || !bowler || striker === nonStriker} onClick={() => run("startInnings", { battingTeamId: batting, bowlingTeamId: bowling, battingLineup, bowlingLineup, strikerId: striker, nonStrikerId: nonStriker, bowlerId: bowler, superOver })}>Start innings</Button></FieldGroup></CardContent></Card>;
}

function DeliveryControls({ current, pending, run, bowlingPlayers, playerName }: { current: NonNullable<NonNullable<PublicMatch["cricket"]>["innings"][number]["state"]>; pending: boolean; run: RunCommand; bowlingPlayers: Player[]; playerName: (id?: string | null) => string }) {
  const [extraRuns, setExtraRuns] = useState(1);
  const [dismissal, setDismissal] = useState<DismissalType>("bowled");
  const [fielderId, setFielderId] = useState("");
  const needsFielder = dismissal === "caught" || dismissal === "stumped" || dismissal === "run-out";
  const delivery = (data: Record<string, unknown>) => run("recordCricketDelivery", { delivery: data });
  const recordWicket = () => {
    const dismissData: Record<string, unknown> = { type: dismissal, playerOutId: current.strikerId };
    if (needsFielder && fielderId) dismissData.fielderId = fielderId;
    delivery({ runsOffBat: 0, dismissal: dismissData });
  };
  return <div className="flex flex-col gap-5"><div><p className="mb-2 text-sm font-medium">Runs</p><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{[0, 1, 2, 3, 4, 5, 6].map((runs) => <Button key={runs} variant={runs === 4 || runs === 6 ? "default" : "outline"} className="h-12 text-base" disabled={pending} onClick={() => delivery({ runsOffBat: runs })}>{runs}</Button>)}</div></div><div><p className="mb-2 text-sm font-medium">Extras</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Button variant="outline" disabled={pending} onClick={() => delivery({ runsOffBat: 0, extraType: "wide", extraRuns: 1 })}>Wide +1</Button><Button variant="outline" disabled={pending} onClick={() => delivery({ runsOffBat: 0, extraType: "no-ball", extraRuns: 1 })}>No ball +1</Button><Button variant="outline" disabled={pending} onClick={() => delivery({ runsOffBat: 0, extraType: "dead-ball" })}>Dead ball</Button></div><div className="mt-2 grid grid-cols-[90px_1fr_1fr] gap-2"><Input type="number" min="1" max="6" value={extraRuns} onChange={(event) => setExtraRuns(Number(event.target.value))} aria-label="Extra runs" /><Button variant="outline" onClick={() => delivery({ runsOffBat: 0, extraType: "bye" satisfies CricketExtraType, extraRuns })}>Bye</Button><Button variant="outline" onClick={() => delivery({ runsOffBat: 0, extraType: "leg-bye" satisfies CricketExtraType, extraRuns })}>Leg bye</Button></div></div><div><p className="mb-2 text-sm font-medium">Wicket</p><div className="grid gap-2 sm:grid-cols-[1fr_auto]"><SimpleSelect label="Dismissal" hideLabel value={dismissal} setValue={(value) => { setDismissal(value as DismissalType); setFielderId(""); }} items={["bowled", "caught", "lbw", "run-out", "stumped", "hit-wicket", "retired-hurt", "retired-out", "obstructing-field"].map((value) => ({ value, label: value.replaceAll("-", " ") }))} /><Button variant="destructive" disabled={pending || (needsFielder && !fielderId)} onClick={recordWicket}>Record wicket</Button></div>{needsFielder ? <SimpleSelect label={dismissal === "caught" ? "Catcher" : dismissal === "stumped" ? "Keeper" : "Fielder"} value={fielderId} setValue={setFielderId} items={bowlingPlayers.map((player) => ({ value: player.id, label: player.name }))} /> : null}</div></div>;
}

function ParticipantSelect({ label, players, pending, onSelect }: { label: string; players: Player[]; pending: boolean; onSelect: (id: string) => void }) { const [value, setValue] = useState(""); return <div className="mb-5 rounded-md border p-4"><FieldGroup><SimpleSelect label={label} value={value} setValue={setValue} items={players.map((player) => ({ value: player.id, label: player.name }))} /><Button disabled={pending || !value} onClick={() => onSelect(value)}>Confirm {label.toLowerCase()}</Button></FieldGroup></div>; }

function FieldConsole({ match, players, teams, pending, run, teamName, playerName }: { match: PublicMatch; players: Player[]; teams: Team[]; pending: boolean; run: RunCommand; teamName: (id: string) => string; playerName: (id?: string | null) => string }) {
  const [teamId, setTeamId] = useState(match.homeTeamId); const [playerId, setPlayerId] = useState(""); const [type, setType] = useState<FieldEventType>("goal");
  if (match.status === "scheduled") return null;
  const eligible = players.filter((player) => player.teamId === teamId && player.active);
  const score = match.fieldState?.score ?? { [match.homeTeamId]: 0, [match.awayTeamId]: 0 };
  return <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]"><Card className="shadow-none"><CardHeader><CardTitle>Live score</CardTitle></CardHeader><CardContent><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center"><div><p className="text-sm text-muted-foreground">{teamName(match.homeTeamId)}</p><p className="mt-2 text-5xl font-semibold">{score[match.homeTeamId] ?? 0}</p></div><span>VS</span><div><p className="text-sm text-muted-foreground">{teamName(match.awayTeamId)}</p><p className="mt-2 text-5xl font-semibold">{score[match.awayTeamId] ?? 0}</p></div></div><div className="mt-6 flex flex-col gap-2">{[...(match.fieldState?.events ?? [])].reverse().map((event, index) => <div key={String(event.id ?? index)} className="flex justify-between gap-3 rounded-md border p-3 text-sm"><span className="font-medium capitalize">{String(event.type).replace("-", " ")} · {playerName(String(event.playerId ?? ""))}</span><span className="text-muted-foreground">{teamName(String(event.teamId))}</span></div>)}</div></CardContent></Card><Card className="shadow-none"><CardHeader><CardTitle>Record event</CardTitle><CardDescription>No match clock is used.</CardDescription></CardHeader><CardContent><FieldGroup><SimpleSelect label="Event" value={type} setValue={(value) => setType(value as FieldEventType)} items={["goal", "own-goal", "yellow-card", "red-card", "shootout-goal", "shootout-miss"].map((value) => ({ value, label: value.replaceAll("-", " ") }))} /><SimpleSelect label="Team" value={teamId} setValue={(value) => { setTeamId(value); setPlayerId(""); }} items={teams.filter((team) => [match.homeTeamId, match.awayTeamId].includes(team.id)).map((team) => ({ value: team.id, label: team.name }))} /><SimpleSelect label="Player" value={playerId} setValue={setPlayerId} items={eligible.map((player) => ({ value: player.id, label: player.name }))} /><Button size="lg" disabled={pending || !teamId || (!playerId && !type.startsWith("shootout"))} onClick={() => run("recordFieldEvent", { event: { type, teamId, playerId: playerId || undefined } })}>Record event</Button><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => run("undoLastEvent")} disabled={pending || !(match.fieldState?.events.length)}><RotateCcw data-icon="inline-start" /> Undo</Button><Button variant="destructive" onClick={() => run("endMatch", { winnerTeamId: score[match.homeTeamId] === score[match.awayTeamId] ? null : score[match.homeTeamId] > score[match.awayTeamId] ? match.homeTeamId : match.awayTeamId, resultText: `${score[match.homeTeamId]}-${score[match.awayTeamId]}` })} disabled={pending}><Trophy data-icon="inline-start" /> End match</Button></div></FieldGroup></CardContent></Card></div>;
}

function SimpleSelect({ label, value, setValue, items, hideLabel = false }: { label: string; value: string; setValue: (value: string) => void; items: Array<{ value: string; label: string }>; hideLabel?: boolean }) { return <Field>{hideLabel ? null : <FieldLabel>{label}</FieldLabel>}<Select value={value} onValueChange={(next) => setValue(next ?? "")}><SelectTrigger className="h-10 w-full capitalize"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger><SelectContent><SelectGroup>{items.map((item) => <SelectItem key={item.value} value={item.value} className="capitalize">{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>; }
