"use client";

import { S9_PLAYERS, S9_TEAMS, type Team } from "@sports-fiesta/domain";
import { useState } from "react";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrivateCollection } from "@/lib/organizer-data";

export function OrganizerTeams() {
  const teams = usePrivateCollection<Team>("teams");
  const [teamId, setTeamId] = useState("");
  const finalizedTeams = S9_TEAMS.map((seededTeam) => teams.data.find((team) => team.id === seededTeam.id) ?? seededTeam);
  const activeTeamId = teamId || finalizedTeams[0]?.id || "";
  const activeTeam = finalizedTeams.find((team) => team.id === activeTeamId);
  const roster = S9_PLAYERS.filter((player) => player.teamId === activeTeamId && player.active);

  if (teams.loading) return <ContentSkeleton />;
  const error = teams.error;
  if (error) return <DataError message={error} retry={teams.retry} />;
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-semibold">Teams</h1><p className="mt-1 text-sm text-muted-foreground">Finalized rosters are available for viewing only.</p></div>
      <Field className="max-w-sm"><FieldLabel>Team</FieldLabel><Select value={activeTeamId} onValueChange={(value) => setTeamId(value ?? "")}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{finalizedTeams.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
      {activeTeam ? (
        <Card className="overflow-hidden border-l-[5px] shadow-none" style={{ borderLeftColor: activeTeam.accentColor }}>
          <CardHeader><CardTitle>{activeTeam.name}</CardTitle><CardDescription>{roster.length} finalized players</CardDescription></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {roster.map((player, index) => (
              <div key={player.id} className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{index + 1}</span>
                <div className="min-w-0"><p className="truncate font-medium">{player.name}</p><div className="mt-1 flex flex-wrap gap-1">{player.role !== "unassigned" ? <Badge variant="secondary" className="capitalize">{player.role.replace("-", " ")}</Badge> : <span className="text-xs text-muted-foreground">Player</span>}{player.jerseyNumber !== null ? <Badge variant="outline">#{player.jerseyNumber}</Badge> : null}</div></div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : <Card className="shadow-none"><CardContent className="py-12 text-center text-muted-foreground">Run tournament setup to publish the finalized teams.</CardContent></Card>}
    </div>
  );
}
