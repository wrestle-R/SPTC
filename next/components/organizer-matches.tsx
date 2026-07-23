"use client";

import type { Team } from "@sports-fiesta/domain";
import { Activity, CalendarPlus, CheckCircle2, ChevronRight, Clock3, LoaderCircle, Pencil, Swords, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { MatchStatusBadge } from "@/components/match-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { callOrganizerCommand, usePrivateCollection } from "@/lib/organizer-data";
import type { PublicMatch } from "@/lib/web-types";

const sports = [{ value: "football", label: "Football" }, { value: "handball", label: "Handball" }, { value: "cricket", label: "Cricket" }, { value: "throwball", label: "Throwball" }];
const stages = [{ value: "league", label: "League" }, { value: "third-place", label: "Third place" }, { value: "final", label: "Final" }];

export function OrganizerMatches() {
  const teams = usePrivateCollection<Team>("teams");
  const matches = usePrivateCollection<PublicMatch>("matches");
  const [sport, setSport] = useState("football"); const [home, setHome] = useState(""); const [away, setAway] = useState(""); const [stage, setStage] = useState("league");
  const [pending, setPending] = useState(false); const [editing, setEditing] = useState<PublicMatch | null>(null); const [deleting, setDeleting] = useState<PublicMatch | null>(null);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true);
    try { await callOrganizerCommand("createMatch", { sport, homeTeamId: home, awayTeamId: away, stage }); toast.success("Fixture created."); setHome(""); setAway(""); setStage("league"); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Fixture creation failed."); } finally { setPending(false); }
  }
  async function remove() {
    if (!deleting) return; setPending(true);
    try { await callOrganizerCommand("deleteMatch", { matchId: deleting.id }); toast.success("Fixture deleted."); setDeleting(null); }
    catch (cause) { toast.error(cause instanceof Error ? cause.message : "Fixture deletion failed."); } finally { setPending(false); }
  }
  if (teams.loading || matches.loading) return <ContentSkeleton />;
  const error = teams.error || matches.error; if (error) return <DataError message={error} retry={matches.retry} />;
  const sortedMatches = [...matches.data].sort((a, b) => (a.matchNumber ?? a.id).localeCompare(b.matchNumber ?? b.id));
  const groups = { live: sortedMatches.filter((match) => ["live", "innings-break", "super-over"].includes(match.status)), scheduled: sortedMatches.filter((match) => match.status === "scheduled"), completed: sortedMatches.filter((match) => match.status === "completed") };
  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
    <div><h1 className="text-2xl font-semibold">Matches</h1><p className="mt-1 text-sm text-muted-foreground">Build fixtures, then open the scoring console when teams are ready.</p></div>
    <Card className="overflow-hidden border-border/70 shadow-sm"><CardHeader className="border-b bg-muted/25"><CardTitle className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><CalendarPlus className="size-4" /></span>Create fixture</CardTitle><CardDescription>Follow the match flow: sport, teams, then stage.</CardDescription></CardHeader><CardContent className="p-4 sm:p-6"><form onSubmit={create} className="space-y-5">
      <div className="rounded-2xl border bg-muted/20 p-4"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Pick the sport</p><SelectField label="Sport" value={sport} onChange={setSport} items={sports} /></div>
      <div className="rounded-2xl border bg-background p-4 shadow-sm"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Choose the matchup</p><div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]"><SelectField label="Home team" value={home} onChange={setHome} items={teams.data.map((team) => ({ value: team.id, label: team.name }))} /><div className="mx-auto flex size-11 items-center justify-center rounded-full border-4 border-background bg-primary text-xs font-black text-primary-foreground shadow-md md:mb-0">VS</div><SelectField label="Away team" value={away} onChange={setAway} items={teams.data.filter((team) => team.id !== home).map((team) => ({ value: team.id, label: team.name }))} /></div></div>
      <div className="rounded-2xl border bg-muted/20 p-4"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">3. Set the stage</p><div className="grid gap-4 md:grid-cols-[1fr_auto]"><SelectField label="Tournament stage" value={stage} onChange={setStage} items={stages} /><Button type="submit" size="lg" className="md:self-end" disabled={pending || !home || !away || home === away}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Swords data-icon="inline-start" />}{pending ? "Creating" : "Create fixture"}</Button></div></div>
    </form></CardContent></Card>
    <section className="flex flex-col gap-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Tournament fixtures</h2><p className="text-sm text-muted-foreground">Edit or remove a scheduled fixture before it starts.</p></div><Badge variant="outline">{matches.data.length} total</Badge></div>
      {!matches.data.length ? <Card className="border-dashed shadow-none"><CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center"><p className="font-semibold">No fixtures yet</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Create a fixture above. Nothing will be restored automatically.</p></CardContent></Card> : <Tabs defaultValue="live"><TabsList className="mb-4 inline-flex h-auto w-full flex-wrap items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground sm:w-fit"><TabsTrigger value="live" className="min-h-10 flex-1 px-3 sm:flex-none"><Activity /> Live <Badge variant="secondary">{groups.live.length}</Badge></TabsTrigger><TabsTrigger value="scheduled" className="min-h-10 flex-1 px-3 sm:flex-none"><Clock3 /> Scheduled <Badge variant="secondary">{groups.scheduled.length}</Badge></TabsTrigger><TabsTrigger value="completed" className="min-h-10 flex-1 px-3 sm:flex-none"><CheckCircle2 /> Completed <Badge variant="secondary">{groups.completed.length}</Badge></TabsTrigger></TabsList><TabsContent value="live"><FixtureGrid matches={groups.live} teams={teams.data} empty="No match is live right now." onEdit={setEditing} onDelete={setDeleting} /></TabsContent><TabsContent value="scheduled"><FixtureGrid matches={groups.scheduled} teams={teams.data} empty="No scheduled fixtures." onEdit={setEditing} onDelete={setDeleting} /></TabsContent><TabsContent value="completed"><FixtureGrid matches={groups.completed} teams={teams.data} empty="No completed fixtures yet." onEdit={setEditing} onDelete={setDeleting} /></TabsContent></Tabs>}
    </section>
    {editing ? <EditFixtureDialog key={editing.id} match={editing} teams={teams.data} close={() => setEditing(null)} /> : null}
    <Dialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}><DialogContent><DialogHeader><DialogTitle>Delete this fixture?</DialogTitle><DialogDescription>This permanently removes {deleting ? `${teams.data.find((team) => team.id === deleting.homeTeamId)?.name ?? "Home"} vs ${teams.data.find((team) => team.id === deleting.awayTeamId)?.name ?? "Away"}` : "this fixture"}. Any scoring data will be lost.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(null)} disabled={pending}>Cancel</Button><Button variant="destructive" onClick={remove} disabled={pending}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Trash2 data-icon="inline-start" />}Delete fixture</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function FixtureGrid({ matches, teams, empty, onEdit, onDelete }: { matches: PublicMatch[]; teams: Team[]; empty: string; onEdit: (match: PublicMatch) => void; onDelete: (match: PublicMatch) => void }) {
  if (!matches.length) return <Card className="border-dashed shadow-none"><CardContent className="py-12 text-center text-sm text-muted-foreground">{empty}</CardContent></Card>;
  return <div className="grid gap-3 lg:grid-cols-2">{matches.map((match) => { const home = teams.find((team) => team.id === match.homeTeamId); const away = teams.find((team) => team.id === match.awayTeamId); const editable = match.status === "scheduled"; return <Card key={match.id} className="group overflow-hidden border-border/70 shadow-none transition-all hover:border-primary/40 hover:shadow-md"><CardContent className="p-0"><Link href={`/organizer/matches/${match.id}`} className="block p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{match.matchNumber ?? "Match"} · {match.sport} · {match.stage}</p><div className="mt-3 flex items-center gap-2 font-semibold"><span>{home?.shortName ?? "HOME"}</span><span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">VS</span><span>{away?.shortName ?? "AWAY"}</span></div></div><MatchStatusBadge status={match.status} /></div><div className="mt-4 flex items-center justify-between border-t pt-3 text-sm text-muted-foreground"><span>Open scoring console</span><ChevronRight className="transition-transform group-hover:translate-x-1" /></div></Link>{editable ? <div className="flex gap-2 border-t bg-muted/20 px-5 py-2.5"><Button variant="ghost" size="sm" onClick={() => onEdit(match)}><Pencil data-icon="inline-start" />Edit</Button><Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onDelete(match)}><Trash2 data-icon="inline-start" />Delete</Button></div> : null}</CardContent></Card>; })}</div>;
}

function EditFixtureDialog({ match, teams, close }: { match: PublicMatch; teams: Team[]; close: () => void }) {
  const [sport, setSport] = useState<string>(match.sport); const [home, setHome] = useState(match.homeTeamId); const [away, setAway] = useState(match.awayTeamId); const [stage, setStage] = useState<string>(match.stage); const [pending, setPending] = useState(false);
  const openChange = (open: boolean) => { if (!open) close(); };
  async function save() { setPending(true); try { await callOrganizerCommand("updateMatch", { matchId: match.id, sport, homeTeamId: home, awayTeamId: away, stage }); toast.success("Fixture updated."); close(); } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Fixture update failed."); } finally { setPending(false); } }
  return <Dialog open onOpenChange={openChange}><DialogContent><DialogHeader><DialogTitle>Edit scheduled fixture</DialogTitle><DialogDescription>Update the matchup before scoring begins.</DialogDescription></DialogHeader><FieldGroup className="py-2"><SelectField label="Sport" value={sport} onChange={setSport} items={sports} /><div className="grid gap-3 sm:grid-cols-2"><SelectField label="Home team" value={home} onChange={setHome} items={teams.map((team) => ({ value: team.id, label: team.name }))} /><SelectField label="Away team" value={away} onChange={setAway} items={teams.filter((team) => team.id !== home).map((team) => ({ value: team.id, label: team.name }))} /></div><SelectField label="Stage" value={stage} onChange={setStage} items={stages} /></FieldGroup><DialogFooter><Button variant="outline" onClick={close} disabled={pending}>Cancel</Button><Button onClick={save} disabled={pending || !sport || !home || !away || home === away}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <Pencil data-icon="inline-start" />}Save changes</Button></DialogFooter></DialogContent></Dialog>;
}

function SelectField({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: Array<{ value: string; label: string }> }) { return <Field><FieldLabel>{label}</FieldLabel><Select value={value} onValueChange={(next) => onChange(next ?? "")}><SelectTrigger className="h-11 w-full"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger><SelectContent><SelectGroup>{items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>; }
