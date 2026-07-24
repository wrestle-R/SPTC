"use client";

import { DEFAULT_SPORT_RULES, normalizeSportRules, type SportRules, type Team } from "@sports-fiesta/domain";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { callOrganizerCommand, usePrivateCollection, usePrivateTournament } from "@/lib/organizer-data";

type TournamentSettings = { name?: string; organizer?: string; venues?: string[]; sportRules?: Partial<SportRules> };
const pointRows = [
  { sport: "Football", places: [200, 150, 100, 50], league: "Win +20 · Tie +10" },
  { sport: "Cricket", places: [200, 150, 100, 50], league: "Win +20 · Tie +0" },
  { sport: "Throwball", places: [120, 80, 30, 30], league: "No league bonus" },
  { sport: "Handball", places: [150, 100, 50, 30], league: "Win +20 · Tie +0" },
  { sport: "Relay", places: [100, 75, 50, 20], league: "Men’s, Women’s & Potato Race" },
  { sport: "Kids & Women’s Games", places: [50, 30, 10], league: "Individual player placements" },
  { sport: "Combined full team game", places: [100, 75, 50, 25], league: "Record from Team bonus points" },
] as const;

export function OrganizerSettings() {
  const tournament = usePrivateTournament<TournamentSettings>();
  const teams = usePrivateCollection<Team>("teams");
  const [pending, setPending] = useState(false);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setPending(true);
    const sportRules = {
      cricket: { maxOvers: Number(form.get("cricket-max-overs")) },
    };
    try { await callOrganizerCommand("saveTournamentSettings", { name: form.get("name"), organizer: form.get("organizer"), venues: String(form.get("venues") ?? "").split("\n").map((value) => value.trim()).filter(Boolean), sportRules }); toast.success("Tournament settings saved."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Settings update failed."); } finally { setPending(false); }
  }
  async function saveBonus(event: React.FormEvent<HTMLFormElement>, kind: "timely-arrival" | "early-bird-bonus" | "combined-team-game") {
    event.preventDefault(); const form = new FormData(event.currentTarget); setPending(true);
    try { await callOrganizerCommand("saveTeamBonus", { kind, teamId: form.get("teamId"), place: form.get("place") }); toast.success("Team points saved."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not save team points."); } finally { setPending(false); }
  }
  async function savePlacement(event: React.FormEvent<HTMLFormElement>, sport: "football" | "cricket" | "throwball" | "handball") {
    event.preventDefault(); const form = new FormData(event.currentTarget); setPending(true);
    try { await callOrganizerCommand("saveSportPlacement", { sport, teamId: form.get("teamId"), place: form.get("place") }); toast.success(`${sport} placement saved.`); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not save placement."); } finally { setPending(false); }
  }
  if (tournament.loading || teams.loading) return <ContentSkeleton />;
  if (tournament.error || teams.error) return <DataError message={tournament.error ?? teams.error ?? "Unable to load settings."} retry={tournament.retry} />;
  const sportRules = normalizeSportRules(tournament.data?.sportRules ?? DEFAULT_SPORT_RULES);
  return <div className="flex flex-col gap-6"><div><h1 className="text-2xl font-semibold">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Tournament details and sport placement points.</p></div>
    <Card className="shadow-none"><CardHeader><CardTitle>Tournament</CardTitle><CardDescription>Tournament information and cricket scoring settings.</CardDescription></CardHeader><CardContent><form onSubmit={save}><FieldGroup><Field><FieldLabel htmlFor="tournament-name">Name</FieldLabel><Input id="tournament-name" name="name" defaultValue={tournament.data?.name ?? "Sports Fiesta"} /></Field><Field><FieldLabel htmlFor="organizer-name">Organizer</FieldLabel><Input id="organizer-name" name="organizer" defaultValue={tournament.data?.organizer ?? "SPTC"} /></Field><Field><FieldLabel htmlFor="venues">Venues</FieldLabel><Textarea id="venues" name="venues" defaultValue={tournament.data?.venues?.join("\n")} /><FieldDescription>One venue per line for tournament information.</FieldDescription></Field><Field><FieldLabel htmlFor="cricket-max-overs">Cricket overs</FieldLabel><Input id="cricket-max-overs" name="cricket-max-overs" type="number" min="1" defaultValue={sportRules.cricket.maxOvers ?? 5} /><FieldDescription>All-out is based on the batting team roster size.</FieldDescription></Field><Button type="submit" disabled={pending}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}Save settings</Button></FieldGroup></form></CardContent></Card>
    <Card className="shadow-none"><CardHeader><CardTitle>Locked tournament point system</CardTitle><CardDescription>These values follow the approved point table and are applied automatically to team standings.</CardDescription></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2">{pointRows.map((row) => <div key={row.sport} className="rounded-xl border bg-muted/15 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{row.sport}</p><p className="mt-1 text-xs text-muted-foreground">{row.league}</p></div><div className="flex gap-1">{row.places.map((points, index) => <span key={`${points}-${index}`} className="rounded-md bg-background px-2 py-1 text-xs font-bold tabular-nums">{index + 1}: {points}</span>)}</div></div></div>)}</div></CardContent></Card>
    <Card className="shadow-none"><CardHeader><CardTitle>Final sport placements</CardTitle><CardDescription>Record first through fourth for each main sport. The exact final-placement points are added automatically.</CardDescription></CardHeader><CardContent><div className="grid gap-4 lg:grid-cols-4"><PlacementForm title="Football" sport="football" teams={teams.data} pending={pending} onSubmit={savePlacement} /><PlacementForm title="Cricket" sport="cricket" teams={teams.data} pending={pending} onSubmit={savePlacement} /><PlacementForm title="Throwball" sport="throwball" teams={teams.data} pending={pending} onSubmit={savePlacement} /><PlacementForm title="Handball" sport="handball" teams={teams.data} pending={pending} onSubmit={savePlacement} /></div></CardContent></Card>
    <Card className="shadow-none"><CardHeader><CardTitle>Team bonus points</CardTitle><CardDescription>Record timely arrival, early bird, and combined-team-game points from the approved table.</CardDescription></CardHeader><CardContent><div className="grid gap-4 lg:grid-cols-3"><BonusForm title="Timely arrival" hint="1st 100 · 2nd 60 · 3rd 40 · 4th 20" kind="timely-arrival" teams={teams.data} pending={pending} onSubmit={saveBonus} /><BonusForm title="Early bird bonus" hint="100 points for each eligible team" kind="early-bird-bonus" teams={teams.data} pending={pending} onSubmit={saveBonus} /><BonusForm title="Combined full team game" hint="1st 100 · 2nd 75 · 3rd 50 · 4th 25" kind="combined-team-game" teams={teams.data} pending={pending} onSubmit={saveBonus} /></div></CardContent></Card>
  </div>;
}

function BonusForm({ title, hint, kind, teams, pending, onSubmit }: { title: string; hint: string; kind: "timely-arrival" | "early-bird-bonus" | "combined-team-game"; teams: Team[]; pending: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>, kind: "timely-arrival" | "early-bird-bonus" | "combined-team-game") => void }) { return <form onSubmit={(event) => onSubmit(event, kind)} className="rounded-xl border bg-muted/10 p-4"><FieldGroup><div><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{hint}</p></div><Field><FieldLabel>Team</FieldLabel><select name="teamId" required className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Choose team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></Field>{kind === "early-bird-bonus" ? null : <Field><FieldLabel>Place</FieldLabel><select name="place" required className="h-10 w-full rounded-lg border bg-background px-3 text-sm">{[1, 2, 3, 4].map((place) => <option key={place} value={place}>{place}</option>)}</select></Field>}<Button type="submit" variant="outline" disabled={pending}>Award points</Button></FieldGroup></form>; }
function PlacementForm({ title, sport, teams, pending, onSubmit }: { title: string; sport: "football" | "cricket" | "throwball" | "handball"; teams: Team[]; pending: boolean; onSubmit: (event: React.FormEvent<HTMLFormElement>, sport: "football" | "cricket" | "throwball" | "handball") => void }) { return <form onSubmit={(event) => onSubmit(event, sport)} className="rounded-xl border bg-muted/10 p-4"><FieldGroup><p className="font-semibold">{title}</p><Field><FieldLabel>Team</FieldLabel><select name="teamId" required className="h-10 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Choose team</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></Field><Field><FieldLabel>Place</FieldLabel><select name="place" required className="h-10 w-full rounded-lg border bg-background px-3 text-sm">{[1, 2, 3, 4].map((place) => <option key={place} value={place}>{place}</option>)}</select></Field><Button type="submit" variant="outline" disabled={pending}>Save placement</Button></FieldGroup></form>; }
