"use client";

import type { Player, Team } from "@sports-fiesta/domain";
import { Activity, CalendarDays, Users } from "lucide-react";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePrivateCollection } from "@/lib/organizer-data";
import type { PublicMatch } from "@/lib/web-types";

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
  const values = {
    live: matches.data.filter((match) => match.status === "live").length,
    fixtures: matches.data.length,
    teams: teams.data.length,
    players: players.data.length,
  };
  const loading = matches.loading || teams.loading || players.loading;
  const error = matches.error || teams.error || players.error;

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
      {!matches.data.length ? (
        <Card className="shadow-none">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
            <span className="grid size-12 place-items-center rounded-md bg-muted"><CalendarDays /></span>
            <div><h2 className="font-semibold">No fixtures in the database</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Use the Matches page to create fixtures manually. The database will stay clean until an organizer creates a match.</p></div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
