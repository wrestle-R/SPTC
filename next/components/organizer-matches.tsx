"use client";

import type { Team } from "@sports-fiesta/domain";
import { CalendarPlus, ChevronRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { MatchStatusBadge } from "@/components/match-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-semibold">Matches</h1><p className="mt-1 text-sm text-muted-foreground">Create fixtures, prepare lineups, and open the scoring console.</p></div>
      <Card className="shadow-none">
        <CardHeader><CardTitle>Create fixture</CardTitle><CardDescription>Fixtures begin empty and are added by an organizer.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={create}>
            <FieldGroup className="grid md:grid-cols-2 xl:grid-cols-3">
              <SelectField label="Sport" value={sport} onChange={setSport} items={[{ value: "football", label: "Football" }, { value: "handball", label: "Handball" }, { value: "cricket", label: "Cricket" }]} />
              <SelectField label="Home team" value={home} onChange={setHome} items={teams.data.map((team) => ({ value: team.id, label: team.name }))} />
              <SelectField label="Away team" value={away} onChange={setAway} items={teams.data.filter((team) => team.id !== home).map((team) => ({ value: team.id, label: team.name }))} />
              <SelectField label="Stage" value={stage} onChange={setStage} items={[{ value: "league", label: "League" }, { value: "semifinal", label: "Semi-final" }, { value: "final", label: "Final" }]} />
              <Button type="submit" className="md:col-span-2 xl:col-span-3" size="lg" disabled={pending || !home || !away || home === away}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <CalendarPlus data-icon="inline-start" />}{pending ? "Creating" : "Create fixture"}</Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">All fixtures</h2>
        {matches.data.length ? <div className="grid gap-3 lg:grid-cols-2">{[...matches.data].sort((a, b) => (a.matchNumber ?? a.id).localeCompare(b.matchNumber ?? b.id)).map((match) => {
          const homeTeam = teams.data.find((team) => team.id === match.homeTeamId);
          const awayTeam = teams.data.find((team) => team.id === match.awayTeamId);
          return <Link key={match.id} href={`/organizer/matches/${match.id}`} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Card className="shadow-none transition-colors hover:border-primary/50"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardDescription className="capitalize">{match.matchNumber ?? "Match"} · {match.sport} · {match.stage}</CardDescription><CardTitle className="mt-1">{homeTeam?.shortName ?? "Home"} vs {awayTeam?.shortName ?? "Away"}</CardTitle></div><MatchStatusBadge status={match.status} /></div></CardHeader><CardContent className="flex items-center justify-between gap-3 text-sm text-muted-foreground"><span>Open scoring console</span><ChevronRight /></CardContent></Card></Link>;
        })}</div> : <Card className="shadow-none"><CardContent className="py-12 text-center text-sm text-muted-foreground">No fixtures created.</CardContent></Card>}
      </section>
    </div>
  );
}

function SelectField({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: Array<{ value: string; label: string }> }) {
  return <Field><FieldLabel>{label}</FieldLabel><Select value={value} onValueChange={(next) => onChange(next ?? "")}><SelectTrigger className="h-10 w-full"><SelectValue placeholder={`Choose ${label.toLowerCase()}`} /></SelectTrigger><SelectContent><SelectGroup>{items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>;
}
