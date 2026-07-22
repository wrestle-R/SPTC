"use client";

import { DEFAULT_SPORT_RULES, normalizeSportRules, type SportRules } from "@sports-fiesta/domain";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { callOrganizerCommand, usePrivateTournament } from "@/lib/organizer-data";

type TournamentSettings = { name?: string; organizer?: string; venues?: string[]; placementPoints?: Record<string, number[]>; sportRules?: Partial<SportRules> };

export function OrganizerSettings() {
  const tournament = usePrivateTournament<TournamentSettings>();
  const [pending, setPending] = useState(false);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setPending(true);
    const sportRules = {
      cricket: { maxOvers: Number(form.get("cricket-max-overs")) },
    };
    try { await callOrganizerCommand("saveTournamentSettings", { name: form.get("name"), organizer: form.get("organizer"), venues: String(form.get("venues") ?? "").split("\n").map((value) => value.trim()).filter(Boolean), sportRules }); toast.success("Tournament settings saved."); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Settings update failed."); } finally { setPending(false); }
  }
  async function placement(event: React.FormEvent<HTMLFormElement>, sport: string) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { await callOrganizerCommand("setPlacementPoints", { sport, points: [1, 2, 3, 4].map((place) => Number(form.get(`place-${place}`))) }); toast.success(`${sport} placement points saved.`); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Placement points failed."); }
  }
  if (tournament.loading) return <ContentSkeleton />;
  if (tournament.error) return <DataError message={tournament.error} retry={tournament.retry} />;
  const sportRules = normalizeSportRules(tournament.data?.sportRules ?? DEFAULT_SPORT_RULES);
  return <div className="flex flex-col gap-6"><div><h1 className="text-2xl font-semibold">Settings</h1><p className="mt-1 text-sm text-muted-foreground">Tournament details and sport placement points.</p></div>
    <Card className="shadow-none"><CardHeader><CardTitle>Tournament</CardTitle><CardDescription>Tournament information and cricket scoring settings.</CardDescription></CardHeader><CardContent><form onSubmit={save}><FieldGroup><Field><FieldLabel htmlFor="tournament-name">Name</FieldLabel><Input id="tournament-name" name="name" defaultValue={tournament.data?.name ?? "Sports Fiesta"} /></Field><Field><FieldLabel htmlFor="organizer-name">Organizer</FieldLabel><Input id="organizer-name" name="organizer" defaultValue={tournament.data?.organizer ?? "SPTC"} /></Field><Field><FieldLabel htmlFor="venues">Venues</FieldLabel><Textarea id="venues" name="venues" defaultValue={tournament.data?.venues?.join("\n")} /><FieldDescription>One venue per line for tournament information.</FieldDescription></Field><Field><FieldLabel htmlFor="cricket-max-overs">Cricket overs</FieldLabel><Input id="cricket-max-overs" name="cricket-max-overs" type="number" min="1" defaultValue={sportRules.cricket.maxOvers ?? 5} /><FieldDescription>All-out is based on the batting team roster size.</FieldDescription></Field><Button type="submit" disabled={pending}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Save data-icon="inline-start" />}Save settings</Button></FieldGroup></form></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-4">{["football", "handball", "cricket", "throwball"].map((sport) => { const values = tournament.data?.placementPoints?.[sport] ?? [10, 5, 3, 1]; return <Card key={sport} className="shadow-none"><CardHeader><CardTitle className="capitalize">{sport} placements</CardTitle></CardHeader><CardContent><form onSubmit={(event) => placement(event, sport)}><FieldGroup>{values.map((value, index) => <Field key={index}><FieldLabel htmlFor={`${sport}-${index}`}>Place {index + 1}</FieldLabel><Input id={`${sport}-${index}`} name={`place-${index + 1}`} type="number" defaultValue={value} required /></Field>)}<Button type="submit" variant="outline">Save points</Button></FieldGroup></form></CardContent></Card>; })}</div>
  </div>;
}
