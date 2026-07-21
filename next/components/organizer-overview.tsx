"use client";

import type { Player, Team } from "@sports-fiesta/domain";
import { Activity, CalendarDays, DatabaseZap, LoaderCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { callOrganizerCommand, usePrivateCollection } from "@/lib/organizer-data";
import type { PublicMatch } from "@/lib/web-types";
import { useState } from "react";

const metrics = [
  { key: "live", label: "Live matches", icon: Activity },
  { key: "fixtures", label: "All matches", icon: CalendarDays },
  { key: "teams", label: "Teams", icon: Users },
  { key: "players", label: "Players", icon: Users },
] as const;

export function OrganizerOverview() {
  const matches = usePrivateCollection<PublicMatch>("matches");
  const teams = usePrivateCollection<Team>("teams");
  const players = usePrivateCollection<Player>("players");
  const [pending, setPending] = useState(false);
  const values = {
    live: matches.data.filter((match) => match.status === "live").length,
    fixtures: matches.data.length,
    teams: teams.data.length,
    players: players.data.length,
  };
  const loading = matches.loading || teams.loading || players.loading;
  const error = matches.error || teams.error || players.error;

  async function bootstrap() {
    setPending(true);
    try {
      const result = await callOrganizerCommand<{ bootstrapped: boolean }>("bootstrapTournament");
      toast.success(result.bootstrapped ? "Tournament teams and rosters added." : "Tournament is already configured.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Tournament setup failed.");
    } finally {
      setPending(false);
    }
  }

  if (loading) return <ContentSkeleton />;
  if (error) return <DataError message={error} retry={matches.retry} />;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">Organizer home</h1><p className="mt-1 text-sm text-muted-foreground">Create fixtures and monitor the live tournament state.</p></div>
        <Badge variant={values.live ? "destructive" : "outline"}>{values.live ? `${values.live} live` : "No live match"}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ key, label, icon: Icon }) => <Card key={key} className="shadow-none"><CardHeader><div className="flex items-center justify-between gap-3"><CardDescription>{label}</CardDescription><Icon /></div><CardTitle className="text-3xl tabular-nums">{values[key]}</CardTitle></CardHeader></Card>)}
      </div>
      {!teams.data.length ? (
        <Card className="shadow-none">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
            <span className="grid size-12 place-items-center rounded-md bg-muted"><DatabaseZap /></span>
            <div><h2 className="font-semibold">Set up Sports Fiesta S9</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Add the four approved teams and provisional rosters. No fixtures or scores will be created.</p></div>
            <Button onClick={bootstrap} disabled={pending}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : <DatabaseZap data-icon="inline-start" />}{pending ? "Setting up" : "Add teams and rosters"}</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
