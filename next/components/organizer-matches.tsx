"use client";

import type { Team } from "@sports-fiesta/domain";
import { Activity, CalendarPlus, CheckCircle2, ChevronRight, Clock3, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { MatchStatusBadge } from "@/components/match-status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { callOrganizerCommand, usePrivateCollection } from "@/lib/organizer-data";
import type { PublicMatch } from "@/lib/web-types";

export function OrganizerMatches() {
  const teams = usePrivateCollection<Team>("teams");
  const matches = usePrivateCollection<PublicMatch>("matches");
  const [sport, setSport] = useState("football");
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [stage, setStage] = useState("league");
  const [pending, setPending] = useState(false);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      await callOrganizerCommand("createMatch", {
        sport, homeTeamId: home, awayTeamId: away, stage,
      });
      toast.success("Fixture created.");
      event.currentTarget.reset();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Fixture creation failed.");
    } finally {
      setPending(false);
    }
  }

  if (teams.loading || matches.loading) return <ContentSkeleton />;
  const error = teams.error || matches.error;
  if (error) return <DataError message={error} retry={matches.retry} />;
  const sortedMatches = [...matches.data].sort((a, b) => (a.matchNumber ?? a.id).localeCompare(b.matchNumber ?? b.id));
  const groups = {
    live: sortedMatches.filter((match) => ["live", "innings-break", "super-over"].includes(match.status)),
    scheduled: sortedMatches.filter((match) => match.status === "scheduled"),
    completed: sortedMatches.filter((match) => match.status === "completed"),
  };
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-semibold">Matches</h1><p className="mt-1 text-sm text-muted-foreground">Create fixtures and open the scoring console.</p></div>
      <Card className="shadow-none">
        <CardHeader><CardTitle>Create fixture</CardTitle><CardDescription>Fixtures begin empty and are added by an organizer.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={create}>
            <FieldGroup className="grid md:grid-cols-2 xl:grid-cols-3">
              <SelectField label="Sport" value={sport} onChange={setSport} items={[{ value: "football", label: "Football" }, { value: "handball", label: "Handball" }, { value: "cricket", label: "Cricket" }]} />
              <SelectField label="Home team" value={home} onChange={setHome} items={teams.data.map((team) => ({ value: team.id, label: team.name }))} />
              <SelectField label="Away team" value={away} onChange={setAway} items={teams.data.filter((team) => team.id !== home).map((team) => ({ value: team.id, label: team.name }))} />
              <SelectField label="Stage" value={stage} onChange={setStage} items={[{ value: "league", label: "League" }, { value: "third-place", label: "Third place" }, { value: "final", label: "Final" }]} />
              <Button type="submit" className="md:col-span-2 xl:col-span-3" size="lg" disabled={pending || !home || !away || home === away}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <CalendarPlus data-icon="inline-start" />}{pending ? "Creating" : "Create fixture"}</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Tournament fixtures</h2><p className="text-sm text-muted-foreground">Open any fixture to manage scoring.</p></div><Badge variant="outline">{matches.data.length} total</Badge></div>
        {!matches.data.length ? <Card className="border-dashed shadow-none"><CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center"><p className="font-semibold">No fixtures yet</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Create a fixture above. Nothing will be restored automatically.</p></CardContent></Card> : (
          <Tabs defaultValue="live" className="gap-4">
            <TabsList className="grid h-auto w-full grid-cols-3 bg-muted/60 p-1 sm:w-fit sm:min-w-lg">
              <TabsTrigger value="live" className="min-h-10 px-3"><Activity /> Live <Badge variant="secondary">{groups.live.length}</Badge></TabsTrigger>
              <TabsTrigger value="scheduled" className="min-h-10 px-3"><Clock3 /> Scheduled <Badge variant="secondary">{groups.scheduled.length}</Badge></TabsTrigger>
              <TabsTrigger value="completed" className="min-h-10 px-3"><CheckCircle2 /> Completed <Badge variant="secondary">{groups.completed.length}</Badge></TabsTrigger>
            </TabsList>
            <TabsContent value="live"><FixtureGrid matches={groups.live} teams={teams.data} empty="No match is live right now." /></TabsContent>
            <TabsContent value="scheduled"><FixtureGrid matches={groups.scheduled} teams={teams.data} empty="No scheduled fixtures." /></TabsContent>
            <TabsContent value="completed"><FixtureGrid matches={groups.completed} teams={teams.data} empty="No completed fixtures yet." /></TabsContent>
          </Tabs>
        )}
      </section>
    </div>
  );
}

function FixtureGrid({ matches, teams, empty }: { matches: PublicMatch[]; teams: Team[]; empty: string }) {
  if (!matches.length) return <Card className="border-dashed shadow-none"><CardContent className="py-12 text-center text-sm text-muted-foreground">{empty}</CardContent></Card>;
  return <div className="grid gap-3 lg:grid-cols-2">{matches.map((match) => {
    const homeTeam = teams.find((team) => team.id === match.homeTeamId);
    const awayTeam = teams.find((team) => team.id === match.awayTeamId);
    return <Link key={match.id} href={`/organizer/matches/${match.id}`} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Card className="group h-full shadow-none transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardDescription className="capitalize">{match.matchNumber ?? "Match"} · {match.sport} · {match.stage}</CardDescription><CardTitle className="mt-1">{homeTeam?.shortName ?? "Home"} vs {awayTeam?.shortName ?? "Away"}</CardTitle></div><MatchStatusBadge status={match.status} /></div></CardHeader><CardContent className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><span>Open scoring console</span><ChevronRight className="transition-transform group-hover:translate-x-1" /></CardContent></Card></Link>;
  })}</div>;
}

function SelectField({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: Array<{ value: string; label: string }> }) {
  return <Field><FieldLabel>{label}</FieldLabel><Select value={value} onValueChange={(next) => onChange(next ?? "")}><SelectTrigger className="h-10 w-full"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger><SelectContent><SelectGroup>{items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>;
}
