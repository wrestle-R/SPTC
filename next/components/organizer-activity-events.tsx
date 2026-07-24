"use client";

import type { Player, Team } from "@sports-fiesta/domain";
import { ArrowLeft, Check, Medal, Search, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getActivitySport, type ActivityFixture, type ActivityRecord, type ActivityResult, type ActivitySportId } from "@/lib/activity-events";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { callOrganizerCommand, usePrivateCollection } from "@/lib/organizer-data";

const placeNames = ["1st", "2nd", "3rd", "4th"];

export function OrganizerActivityEvents({ sportId }: { sportId: ActivitySportId }) {
  const sport = getActivitySport(sportId)!;
  const players = usePrivateCollection<Player>("players");
  const teams = usePrivateCollection<Team>("teams");
  const records = usePrivateCollection<ActivityRecord>("awards");
  const [selectedEventId, setSelectedEventId] = useState(sport.events[0].id);
  const [pending, setPending] = useState(false);
  const [deletingResult, setDeletingResult] = useState(false);
  const [deletingFixture, setDeletingFixture] = useState(false);
  const selectedEvent = sport.events.find((event) => event.id === selectedEventId) ?? sport.events[0];
  const results = records.data.filter((record): record is ActivityResult => record.type === "activity-result");
  const existing = results.find((result) => result.sport === sportId && result.eventId === selectedEvent.id);
  const fixture = records.data.find((record): record is ActivityFixture => record.type === "activity-fixture" && record.sport === sportId && record.eventId === selectedEvent.id);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [lineups, setLineups] = useState<Record<string, string[]>>({});
  const draftPlacements = Object.keys(placements).length ? placements : existing?.placements ?? {};
  const draftLineups = Object.keys(lineups).length ? lineups : existing?.lineups ?? fixture?.lineups ?? {};

  function selectEvent(eventId: string) {
    const result = results.find((item) => item.sport === sportId && item.eventId === eventId);
    const eventFixture = records.data.find((item): item is ActivityFixture => item.type === "activity-fixture" && item.sport === sportId && item.eventId === eventId);
    setSelectedEventId(eventId);
    setPlacements(result?.placements ?? {});
    setLineups(result?.lineups ?? eventFixture?.lineups ?? {});
  }

  const activePlayers = useMemo(() => players.data.filter((player) => player.active), [players.data]);
  const busy = players.loading || teams.loading || records.loading;
  const error = players.error || teams.error || records.error;
  const created = sport.events.filter((event) => records.data.some((record) => record.type === "activity-fixture" && record.sport === sportId && record.eventId === event.id)).length;
  const completed = sport.events.filter((event) => records.data.some((record) => record.type === "activity-fixture" && record.sport === sportId && record.eventId === event.id && record.status === "completed")).length;
  const requiredPlaces = selectedEvent.points.length;

  async function save() {
    const selected = Array.from({ length: requiredPlaces }, (_, index) => draftPlacements[String(index + 1)]).filter(Boolean);
    if (selected.length !== requiredPlaces || new Set(selected).size !== selected.length) {
      toast.error(`Choose a different ${selectedEvent.kind === "relay" ? "team" : "player"} for every place.`);
      return;
    }
    if (selectedEvent.kind === "relay" && selected.some((teamId) => !(draftLineups[teamId] ?? []).length)) {
      toast.error("Add at least one player to every placed relay team’s lineup.");
      return;
    }
    setPending(true);
    try {
      await callOrganizerCommand("saveActivityResult", { sport: sportId, eventId: selectedEvent.id, placements: draftPlacements, lineups: selectedEvent.kind === "relay" ? draftLineups : undefined });
      toast.success(`${selectedEvent.name} results saved and points added.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save event results.");
    } finally { setPending(false); }
  }
  async function createFixture() {
    if (selectedEvent.kind === "relay" && teams.data.some((team) => !(draftLineups[team.id] ?? []).length)) { toast.error("Add at least one player to every relay team lineup before creating the fixture."); return; }
    setPending(true);
    try { await callOrganizerCommand("createActivityFixture", { sport: sportId, eventId: selectedEvent.id, ...(selectedEvent.kind === "relay" ? { lineups: draftLineups } : {}) }); toast.success(`${selectedEvent.name} fixture created.`); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not create fixture."); } finally { setPending(false); }
  }
  async function startFixture() { setPending(true); try { await callOrganizerCommand("startActivityFixture", { sport: sportId, eventId: selectedEvent.id }); toast.success(`${selectedEvent.name} is now live.`); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not start event."); } finally { setPending(false); } }
  async function deleteResult() { setPending(true); try { await callOrganizerCommand("deleteActivityResult", { sport: sportId, eventId: selectedEvent.id }); toast.success("Result deleted. The event is live again for correction."); setDeletingResult(false); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not delete event result."); } finally { setPending(false); } }
  async function deleteFixture() { setPending(true); try { await callOrganizerCommand("deleteActivityFixture", { sport: sportId, eventId: selectedEvent.id }); toast.success("Fixture deleted. You can create it again when ready."); setDeletingFixture(false); setPlacements({}); setLineups({}); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not delete event fixture."); } finally { setPending(false); } }

  if (busy) return <ContentSkeleton rows={3} />;
  if (error) return <DataError message={error} retry={records.retry} />;

  return <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
    <div>
      <Button nativeButton={false} variant="ghost" className="mb-2 -ml-3" render={<Link href="/organizer/matches" />}><ArrowLeft data-icon="inline-start" />All sports</Button>
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Event fixtures</p><h1 className="mt-1 text-2xl font-bold tracking-tight">{sport.label}</h1><p className="mt-1 text-sm text-muted-foreground">Create each event once, start it when ready, then record the winners.</p></div><Badge variant="secondary">{created}/{sport.events.length} fixtures · {completed} completed</Badge></div>
    </div>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {sport.events.map((event) => {
        const eventFixture = records.data.find((record): record is ActivityFixture => record.type === "activity-fixture" && record.sport === sportId && record.eventId === event.id);
        const result = eventFixture?.status === "completed" ? eventFixture : null;
        const active = event.id === selectedEvent.id;
        return <button key={event.id} type="button" onClick={() => selectEvent(event.id)} className={`rounded-2xl border p-4 text-left transition-all ${active ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30" : "bg-card hover:border-primary/40 hover:bg-muted/30"}`}><div className="flex items-center justify-between gap-3"><span className={`grid size-10 place-items-center rounded-xl ${event.kind === "relay" ? "bg-violet-500/15 text-violet-400" : "bg-sky-500/15 text-sky-400"}`}><Medal className="size-5" /></span>{result ? <Badge variant="secondary"><Check className="size-3" />Saved</Badge> : <Badge variant="outline">To score</Badge>}</div><p className="mt-5 font-bold leading-snug">{event.name}</p><p className="mt-1 text-xs text-muted-foreground">{event.kind === "relay" ? "Team relay" : "Individual event"} · {event.points.join(" / ")} pts</p></button>;
      })}
    </section>

    <Card className="overflow-hidden shadow-none"><CardHeader className="border-b bg-muted/20"><div className="flex items-start justify-between gap-3"><div><CardTitle>{selectedEvent.name}</CardTitle><CardDescription>{selectedEvent.kind === "relay" ? "Build the participating team lineups, then record first through fourth." : "Choose the first, second, and third-place players."}</CardDescription></div><div className="flex shrink-0 items-center gap-2"><Badge variant={selectedEvent.kind === "relay" ? "secondary" : "outline"}>{selectedEvent.kind === "relay" ? "Relay" : "Individual"}</Badge>{fixture ? <Button type="button" variant="ghost" size="icon-sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingFixture(true)} aria-label="Delete fixture"><Trash2 /></Button> : null}</div></div></CardHeader><CardContent className="space-y-6 p-4 sm:p-6">
      {!fixture ? selectedEvent.kind === "relay" ? <RelayFixtureSetup teams={teams.data} players={activePlayers} lineups={draftLineups} setLineups={setLineups} pending={pending} onCreate={createFixture} /> : <FixtureAction title="Create this fixture" description="This event can only be created once. Once created, viewers will see it as upcoming." action="Create fixture" pending={pending} onClick={createFixture} /> : fixture.status === "scheduled" ? <FixtureAction title="Fixture is ready" description="It is visible to viewers as upcoming. Start it when the event begins." action="Start event" pending={pending} onClick={startFixture} /> : <><PointsStrip points={selectedEvent.points} />{selectedEvent.kind === "individual" ? <IndividualPlacements players={activePlayers} placements={draftPlacements} setPlacements={setPlacements} places={requiredPlaces} /> : <RelayResult teams={teams.data} players={activePlayers} placements={draftPlacements} setPlacements={setPlacements} lineups={draftLineups} setLineups={setLineups} places={requiredPlaces} />}<div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => { setPlacements(existing?.placements ?? {}); setLineups(existing?.lineups ?? fixture.lineups ?? {}); }} disabled={pending}>Reset</Button>{fixture.status === "completed" ? <Button type="button" variant="destructive" onClick={() => setDeletingResult(true)} disabled={pending}><Trash2 data-icon="inline-start" />Delete result</Button> : null}<Button type="button" size="lg" onClick={save} disabled={pending}>{fixture.status === "completed" ? "Save result changes" : "Save results & complete"}</Button></div></>}
    </CardContent></Card>
    <Dialog open={deletingResult} onOpenChange={(open) => { if (!open && !pending) setDeletingResult(false); }}><DialogContent><DialogHeader><DialogTitle>Delete this event result?</DialogTitle><DialogDescription>Points will be removed from the standings and the event will return to live status so you can enter the correct result.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => setDeletingResult(false)}>Cancel</Button><Button type="button" variant="destructive" disabled={pending} onClick={deleteResult}><Trash2 data-icon="inline-start" />Delete result</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={deletingFixture} onOpenChange={(open) => { if (!open && !pending) setDeletingFixture(false); }}><DialogContent><DialogHeader><DialogTitle>Delete this fixture?</DialogTitle><DialogDescription>This removes the fixture, any saved result, and its points from standings. You can create this event fixture again afterward.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={() => setDeletingFixture(false)}>Cancel</Button><Button type="button" variant="destructive" disabled={pending} onClick={deleteFixture}><Trash2 data-icon="inline-start" />Delete fixture</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function PointsStrip({ points }: { points: readonly number[] }) { return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{points.map((pointsForPlace, index) => <div key={pointsForPlace} className={`rounded-xl border p-3 ${index === 0 ? "border-amber-400/30 bg-amber-500/10" : "bg-muted/20"}`}><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{placeNames[index]}</p><p className="mt-1 text-xl font-black tabular-nums">{pointsForPlace}<span className="ml-1 text-xs font-medium text-muted-foreground">pts</span></p></div>)}</div>; }
function FixtureAction({ title, description, action, pending, onClick, complete = false }: { title: string; description: string; action: string; pending: boolean; onClick: () => void; complete?: boolean }) { return <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/10 p-6 text-center"><Check className={`size-8 ${complete ? "text-emerald-400" : "text-primary"}`} /><h3 className="mt-3 text-lg font-bold">{title}</h3><p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p><Button className="mt-5" disabled={pending || complete} onClick={onClick}>{action}</Button></div>; }

function IndividualPlacements({ players, placements, setPlacements, places }: { players: Player[]; placements: Record<string, string>; setPlacements: (next: Record<string, string>) => void; places: number }) { return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: places }, (_, index) => { const place = String(index + 1); return <PlayerPicker key={place} label={`${placeNames[index]} place`} players={players.filter((player) => !Object.entries(placements).some(([selectedPlace, value]) => selectedPlace !== place && value === player.id))} value={placements[place] ?? ""} onChange={(value) => setPlacements({ ...placements, [place]: value })} />; })}</div>; }

function RelayFixtureSetup({ teams, players, lineups, setLineups, pending, onCreate }: { teams: Team[]; players: Player[]; lineups: Record<string, string[]>; setLineups: (next: Record<string, string[]>) => void; pending: boolean; onCreate: () => void }) {
  return <div className="space-y-5"><div><h3 className="font-bold">Build the relay lineups</h3><p className="mt-1 text-sm text-muted-foreground">Add the players for all teams before announcing this fixture. Viewers will see these saved lineups.</p></div><div className="grid gap-3 md:grid-cols-2">{teams.map((team) => <RelayLineupCard key={team.id} team={team} players={players.filter((player) => player.teamId === team.id)} selected={lineups[team.id] ?? []} onChange={(next) => setLineups({ ...lineups, [team.id]: next })} />)}</div><div className="flex justify-end border-t pt-5"><Button type="button" size="lg" onClick={onCreate} disabled={pending}>{pending ? "Creating fixture" : "Save lineups & create fixture"}</Button></div></div>;
}

function RelayResult({ teams, players, placements, setPlacements, lineups, setLineups, places }: { teams: Team[]; players: Player[]; placements: Record<string, string>; setPlacements: (next: Record<string, string>) => void; lineups: Record<string, string[]>; setLineups: (next: Record<string, string[]>) => void; places: number }) {
  const placedTeams = new Set(Object.values(placements));
  return <div className="space-y-6"><div><p className="mb-3 text-sm font-semibold">1. Build team lineups</p><div className="grid gap-3 md:grid-cols-2">{teams.map((team) => <RelayLineupCard key={team.id} team={team} players={players.filter((player) => player.teamId === team.id)} selected={lineups[team.id] ?? []} onChange={(next) => setLineups({ ...lineups, [team.id]: next })} />)}</div></div><div><p className="mb-3 text-sm font-semibold">2. Record the finishing order</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: places }, (_, index) => { const place = String(index + 1); return <TeamPicker key={place} label={`${placeNames[index]} team`} teams={teams.filter((team) => !placedTeams.has(team.id) || placements[place] === team.id)} value={placements[place] ?? ""} onChange={(value) => setPlacements({ ...placements, [place]: value })} />; })}</div></div></div>;
}

function RelayLineupCard({ team, players, selected, onChange }: { team: Team; players: Player[]; selected: string[]; onChange: (next: string[]) => void }) { return <div className="rounded-2xl border bg-muted/10 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold">{team.name}</p><p className="text-xs text-muted-foreground">{selected.length} in lineup</p></div><span className="size-3 rounded-full" style={{ backgroundColor: team.accentColor }} /></div><PlayerPicker label="Add player" players={players.filter((player) => !selected.includes(player.id))} value="" onChange={(playerId) => onChange([...selected, playerId])} compact /><div className="mt-3 flex flex-wrap gap-2">{selected.length ? selected.map((playerId) => { const player = players.find((item) => item.id === playerId); return <button key={playerId} type="button" className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium hover:border-destructive hover:text-destructive" onClick={() => onChange(selected.filter((id) => id !== playerId))}>{player?.name ?? "Player"} ×</button>; }) : <p className="text-xs text-muted-foreground">No players selected yet.</p>}</div></div>; }

function PlayerPicker({ label, players, value, onChange, compact = false }: { label: string; players: Player[]; value: string; onChange: (value: string) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false); const [searching, setSearching] = useState(false); const [query, setQuery] = useState("");
  const selected = players.find((player) => player.id === value); const visible = players.filter((player) => `${player.name} ${player.jerseyNumber ?? ""}`.toLowerCase().includes(query.toLowerCase().trim()));
  function close(next: boolean) { setOpen(next); if (!next) { setSearching(false); setQuery(""); } }
  return <Field><FieldLabel>{label}</FieldLabel><Button type="button" variant="outline" className={`w-full justify-between font-normal ${compact ? "h-10" : "h-11"}`} onClick={() => setOpen(true)}><span className={selected ? "truncate" : "truncate text-muted-foreground"}>{selected ? playerText(selected) : `Choose ${label.toLowerCase()}`}</span><Users className="size-4 text-muted-foreground" /></Button><Dialog open={open} onOpenChange={close}><DialogContent className="max-h-[80dvh] overflow-y-auto max-sm:top-auto max-sm:bottom-0 max-sm:max-w-none max-sm:-translate-y-0 max-sm:rounded-b-none"><DialogHeader><DialogTitle>Choose a player</DialogTitle><DialogDescription>Browse first, or search only when you need the keyboard.</DialogDescription></DialogHeader><div className="grid gap-3">{searching ? <Input autoFocus placeholder="Search players" value={query} onChange={(event) => setQuery(event.target.value)} /> : <Button type="button" variant="outline" className="justify-start" onClick={() => setSearching(true)}><Search data-icon="inline-start" />Search players</Button>}<div className="grid max-h-80 gap-2 overflow-y-auto">{visible.map((player) => <Button key={player.id} type="button" variant={player.id === value ? "secondary" : "outline"} className="min-h-11 justify-start whitespace-normal py-3 text-left" onClick={() => { onChange(player.id); close(false); }}>{playerText(player)}</Button>)}{!visible.length ? <p className="py-4 text-sm text-muted-foreground">No players found.</p> : null}</div></div></DialogContent></Dialog></Field>;
}

function TeamPicker({ label, teams, value, onChange }: { label: string; teams: Team[]; value: string; onChange: (value: string) => void }) { return <Field><FieldLabel>{label}</FieldLabel><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"><option value="">Choose team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></Field>; }
function playerText(player: Player) { return `${player.jerseyNumber !== null ? `#${player.jerseyNumber} · ` : ""}${player.name}`; }
