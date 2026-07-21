"use client";

import type { Team } from "@sports-fiesta/domain";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { callOrganizerCommand, usePrivateCollection, usePrivateTournament } from "@/lib/organizer-data";

type TournamentSettings = { name?: string; organizer?: string; venues?: string[]; placementPoints?: Record<string, number[]> };

export function OrganizerSettings() {
  const tournament = usePrivateTournament<TournamentSettings>();
  const teams = usePrivateCollection<Team>("teams");
  const [disciplineTeam, setDisciplineTeam] = useState("");
  const [pending, setPending] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setPending(true);
    try { await callOrganizerCommand("saveTournamentSettings", { name: form.get("name"), organizer: form.get("organizer"), venues: String(form.get("venues") ?? "").split("\n").map((value) => value.trim()).filter(Boolean) }); toast.success("Tournament settings saved."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Settings update failed."); } finally { setPending(false); }
  }
  async function discipline(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setPending(true);
    try { await callOrganizerCommand("addDisciplineAdjustment", { teamId: disciplineTeam, points: Number(form.get("points")), reason: form.get("reason") }); toast.success("Discipline adjustment published."); event.currentTarget.reset(); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Adjustment failed."); } finally { setPending(false); }
  }
  async function placement(event: React.FormEvent<HTMLFormElement>, sport: string) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { await callOrganizerCommand("setPlacementPoints", { sport, points: [1, 2, 3, 4].map((place) => Number(form.get(`place-${place}`))) }); toast.success(`${sport} placement points saved.`); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Placement points failed."); }
  }
  if (tournament.loading || teams.loading) return <ContentSkeleton />;
  const error = tournament.error || teams.error; if (error) return <DataError message={error} retry={tournament.retry} />;
  return <div className="flex flex-col gap-6"><div><h1 className="text-2xl font-semibold">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Tournament details, scoring constants, and discipline points.</p></div><div className="grid gap-4 xl:grid-cols-2">
    <Card className="shadow-none"><CardHeader><CardTitle>Tournament</CardTitle><CardDescription>Five overs per innings is fixed for S9.</CardDescription></CardHeader><CardContent><form onSubmit={save}><FieldGroup><Field><FieldLabel htmlFor="tournament-name">Name</FieldLabel><Input id="tournament-name" name="name" defaultValue={tournament.data?.name ?? "Sports Fiesta S9"} /></Field><Field><FieldLabel htmlFor="organizer-name">Organizer</FieldLabel><Input id="organizer-name" name="organizer" defaultValue={tournament.data?.organizer ?? "SPTC"} /></Field><Field><FieldLabel htmlFor="venues">Venues</FieldLabel><Textarea id="venues" name="venues" defaultValue={tournament.data?.venues?.join("\n")} /><FieldDescription>One venue per line.</FieldDescription></Field><Button type="submit" disabled={pending}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}Save settings</Button></FieldGroup></form></CardContent></Card>
    <Card className="shadow-none"><CardHeader><CardTitle>Discipline points</CardTitle><CardDescription>Positive or negative values are visible to viewers with the reason.</CardDescription></CardHeader><CardContent><form onSubmit={discipline}><FieldGroup><Field><FieldLabel>Team</FieldLabel><Select value={disciplineTeam} onValueChange={(value) => setDisciplineTeam(value ?? "")}><SelectTrigger className="h-10 w-full"><SelectValue placeholder="Choose team" /></SelectTrigger><SelectContent><SelectGroup>{teams.data.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Field><FieldLabel htmlFor="points">Points</FieldLabel><Input id="points" name="points" type="number" min="-100" max="100" required /></Field><Field><FieldLabel htmlFor="reason">Reason</FieldLabel><Textarea id="reason" name="reason" required /></Field><Button type="submit" disabled={pending || !disciplineTeam}>Publish adjustment</Button></FieldGroup></form></CardContent></Card>
  </div><div className="grid gap-4 lg:grid-cols-3">{["football", "handball", "cricket"].map((sport) => { const values = tournament.data?.placementPoints?.[sport] ?? [10, 5, 3, 1]; return <Card key={sport} className="shadow-none"><CardHeader><CardTitle className="capitalize">{sport} placements</CardTitle></CardHeader><CardContent><form onSubmit={(event) => placement(event, sport)}><FieldGroup>{values.map((value, index) => <Field key={index}><FieldLabel htmlFor={`${sport}-${index}`}>Place {index + 1}</FieldLabel><Input id={`${sport}-${index}`} name={`place-${index + 1}`} type="number" defaultValue={value} required /></Field>)}<Button type="submit" variant="outline">Save points</Button></FieldGroup></form></CardContent></Card>; })}</div></div>;
}
