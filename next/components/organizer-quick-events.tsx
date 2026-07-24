"use client";

import type { Player, Team } from "@sports-fiesta/domain";
import { Check, LoaderCircle, Play, Plus, Trash2, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { callOrganizerCommand, usePrivateCollection } from "@/lib/organizer-data";
import { splitPlacementPoints, type QuickEventFixture, type QuickEventRecord, type QuickEventResult } from "@/lib/quick-events";

const places = ["1st", "2nd", "3rd"];

export function OrganizerQuickEvents({ teams, players }: { teams: Team[]; players: Player[] }) {
  const records = usePrivateCollection<QuickEventRecord>("awards");
  const [title, setTitle] = useState("");
  const [points, setPoints] = useState(["50", "30", "10"]);
  const [lineups, setLineups] = useState<Record<string, string[]>>({});
  const [placements, setPlacements] = useState<Record<string, Record<string, string>>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const fixtures = records.data.filter((record): record is QuickEventFixture => record.type === "quick-event-fixture");
  const results = records.data.filter((record): record is QuickEventResult => record.type === "quick-event-result");

  function togglePlayer(teamId: string, playerId: string) {
    const selected = lineups[teamId] ?? [];
    setLineups({ ...lineups, [teamId]: selected.includes(playerId) ? selected.filter((id) => id !== playerId) : [...selected, playerId] });
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.values(lineups).filter((lineup) => lineup.length).length < 3) {
      toast.error("Add players for at least three teams.");
      return;
    }
    setPendingId("create");
    try {
      await callOrganizerCommand("createQuickEvent", { title, points: points.map(Number), lineups });
      toast.success(`${title} fixture created.`);
      setTitle("");
      setPoints(["50", "30", "10"]);
      setLineups({});
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not create the quick event.");
    } finally {
      setPendingId(null);
    }
  }

  async function run(command: "startQuickEvent" | "deleteQuickEvent", fixture: QuickEventFixture) {
    setPendingId(fixture.id);
    try {
      await callOrganizerCommand(command, { fixtureId: fixture.id });
      toast.success(command === "startQuickEvent" ? `${fixture.title} is live.` : `${fixture.title} deleted.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update the quick event.");
    } finally {
      setPendingId(null);
    }
  }

  async function saveResult(fixture: QuickEventFixture) {
    const fixturePlacements = placements[fixture.id] ?? {};
    const winners = ["1", "2", "3"].map((place) => fixturePlacements[place]).filter(Boolean);
    if (winners.length !== 3 || new Set(winners).size !== 3) {
      toast.error("Choose three different teams for first, second, and third.");
      return;
    }
    setPendingId(fixture.id);
    try {
      await callOrganizerCommand("saveQuickEventResult", { fixtureId: fixture.id, placements: fixturePlacements });
      toast.success(`${fixture.title} results saved and points added.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save the result.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle>Quick event fixtures</CardTitle><CardDescription>Create an on-the-spot race or small game without changing the fixed tournament events.</CardDescription></div>
          <Badge variant="secondary">{fixtures.length} created</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={create} className="space-y-5 rounded-2xl border bg-muted/10 p-4 sm:p-5">
          <div><p className="font-semibold">Create a quick fixture</p><p className="mt-1 text-sm text-muted-foreground">Set the title, participating lineups, and total points for each finishing place.</p></div>
          <Field><FieldLabel htmlFor="quick-event-title">Event title</FieldLabel><Input id="quick-event-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Example: Three-legged race" maxLength={100} required /></Field>
          <div className="grid gap-3 sm:grid-cols-3">
            {places.map((place, index) => <Field key={place}><FieldLabel htmlFor={`quick-points-${index}`}>{place} place points</FieldLabel><Input id={`quick-points-${index}`} type="number" min="0" max="10000" step="0.01" value={points[index]} onChange={(event) => setPoints(points.map((value, pointIndex) => pointIndex === index ? event.target.value : value))} required /></Field>)}
          </div>
          <FieldDescription>These are team totals. Player credit is divided evenly within each selected lineup.</FieldDescription>
          <div className="grid gap-3 md:grid-cols-2">
            {teams.map((team) => {
              const teamPlayers = players.filter((player) => player.teamId === team.id && player.active);
              const selected = lineups[team.id] ?? [];
              return <div key={team.id} className="rounded-2xl border bg-background p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="font-semibold">{team.name}</p><p className="text-xs text-muted-foreground">{selected.length ? `${selected.length} selected` : "Not participating"}</p></div><span className="size-3 rounded-full" style={{ backgroundColor: team.accentColor }} /></div><div className="grid max-h-44 gap-2 overflow-y-auto pr-1">{teamPlayers.map((player) => { const active = selected.includes(player.id); return <button key={player.id} type="button" aria-pressed={active} onClick={() => togglePlayer(team.id, player.id)} className={`flex min-h-10 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${active ? "border-primary bg-primary/10 text-foreground" : "bg-muted/10 text-muted-foreground hover:border-primary/40"}`}><span>{player.jerseyNumber !== null ? `#${player.jerseyNumber} · ` : ""}{player.name}</span>{active ? <Check className="size-4 text-primary" /> : null}</button>; })}</div></div>;
            })}
          </div>
          <div className="flex justify-end border-t pt-4"><Button type="submit" size="lg" disabled={pendingId !== null}>{pendingId === "create" ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Plus data-icon="inline-start" />}Create fixture</Button></div>
        </form>

        {fixtures.length ? <div className="space-y-3"><p className="text-sm font-semibold">Created quick events</p>{fixtures.map((fixture) => {
          const result = results.find((item) => item.fixtureId === fixture.id);
          const participatingTeams = teams.filter((team) => fixture.lineups[team.id]?.length);
          const draft = placements[fixture.id] ?? result?.placements ?? {};
          return <div key={fixture.id} className="rounded-2xl border bg-muted/10 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{fixture.title}</p><p className="mt-1 text-xs text-muted-foreground">{fixture.points.join(" / ")} points · {participatingTeams.length} teams</p></div><Badge variant={fixture.status === "live" ? "destructive" : fixture.status === "completed" ? "secondary" : "outline"}>{fixture.status}</Badge></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">{participatingTeams.map((team) => <div key={team.id} className="rounded-xl border bg-background p-3"><p className="text-sm font-semibold">{team.name}</p><p className="mt-1 text-xs text-muted-foreground">{fixture.lineups[team.id].map((playerId) => players.find((player) => player.id === playerId)?.name ?? "Player").join(" · ")}</p></div>)}</div>
            {fixture.status === "live" ? <div className="mt-5 border-t pt-4"><p className="mb-3 text-sm font-semibold">Choose the finishing order</p><div className="grid gap-3 sm:grid-cols-3">{places.map((place, index) => <Field key={place}><FieldLabel>{place} place</FieldLabel><select value={draft[String(index + 1)] ?? ""} onChange={(event) => setPlacements({ ...placements, [fixture.id]: { ...draft, [String(index + 1)]: event.target.value } })} className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Choose team</option>{participatingTeams.filter((team) => !Object.entries(draft).some(([selectedPlace, teamId]) => selectedPlace !== String(index + 1) && teamId === team.id)).map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></Field>)}</div><div className="mt-4 flex justify-end"><Button onClick={() => saveResult(fixture)} disabled={pendingId !== null}><Trophy data-icon="inline-start" />Save 1st, 2nd & 3rd</Button></div></div> : null}
            {fixture.status === "completed" && result ? <div className="mt-5 grid gap-2 border-t pt-4 sm:grid-cols-3">{places.map((place, index) => { const teamId = result.placements[String(index + 1)]; const lineup = result.lineups[teamId] ?? []; const team = teams.find((item) => item.id === teamId); const each = splitPlacementPoints(result.points[index], lineup.length); return <div key={place} className="rounded-xl border bg-background p-3"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{place}</p><p className="mt-1 font-semibold">{team?.name ?? "Team"}</p><p className="mt-1 text-xs text-muted-foreground">{result.points[index]} total{lineup.length > 1 ? ` · ${formatPoints(each)} each` : ""}</p></div>; })}</div> : null}
            <div className="mt-4 flex justify-end gap-2 border-t pt-4">{fixture.status === "scheduled" ? <Button onClick={() => run("startQuickEvent", fixture)} disabled={pendingId !== null}><Play data-icon="inline-start" />Start event</Button> : null}<Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => run("deleteQuickEvent", fixture)} disabled={pendingId !== null}><Trash2 data-icon="inline-start" />Delete</Button></div>
          </div>;
        })}</div> : null}
      </CardContent>
    </Card>
  );
}

function formatPoints(points: number) {
  return Number.isInteger(points) ? `${points} pts` : `${Number(points.toFixed(2))} pts`;
}
