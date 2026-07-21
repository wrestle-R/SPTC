"use client";

import type { Player, PlayerRole, Team } from "@sports-fiesta/domain";
import { LoaderCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { callOrganizerCommand, usePrivateCollection } from "@/lib/organizer-data";

const roles: Array<{ value: PlayerRole; label: string }> = [
  { value: "unassigned", label: "Unassigned" }, { value: "batter", label: "Batter" },
  { value: "bowler", label: "Bowler" }, { value: "all-rounder", label: "All-rounder" },
  { value: "wicket-keeper", label: "Wicket keeper" },
];

export function OrganizerTeams() {
  const teams = usePrivateCollection<Team>("teams");
  const players = usePrivateCollection<Player>("players");
  const [teamId, setTeamId] = useState("");
  const [role, setRole] = useState<PlayerRole>("unassigned");
  const [pending, setPending] = useState(false);
  const activeTeamId = teamId || teams.data[0]?.id || "";
  const activeTeam = teams.data.find((team) => team.id === activeTeamId);
  const roster = players.data.filter((player) => player.teamId === activeTeamId && player.active);

  async function saveTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeTeam) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await callOrganizerCommand("saveTeam", { id: activeTeam.id, name: form.get("name"), shortName: form.get("shortName"), accentColor: form.get("accentColor"), color: activeTeam.color, logoUrl: activeTeam.logoUrl });
      toast.success("Team updated.");
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Team update failed."); }
    finally { setPending(false); }
  }

  async function addPlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    try {
      await callOrganizerCommand("savePlayer", { teamId: activeTeamId, name: form.get("name"), jerseyNumber: form.get("jerseyNumber") ? Number(form.get("jerseyNumber")) : null, role, battingStyle: form.get("battingStyle") || null, bowlingStyle: form.get("bowlingStyle") || null, active: true });
      toast.success("Player added.");
      event.currentTarget.reset();
      setRole("unassigned");
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Player update failed."); }
    finally { setPending(false); }
  }

  async function deactivate(player: Player) {
    try {
      await callOrganizerCommand("savePlayer", { ...player, active: false });
      toast.success(`${player.name} removed from the active roster.`);
    } catch (cause) { toast.error(cause instanceof Error ? cause.message : "Roster update failed."); }
  }

  if (teams.loading || players.loading) return <ContentSkeleton />;
  const error = teams.error || players.error;
  if (error) return <DataError message={error} retry={teams.retry} />;
  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-2xl font-semibold">Teams</h1><p className="mt-1 text-sm text-muted-foreground">Maintain team presentation and provisional rosters.</p></div>
      <Field className="max-w-sm"><FieldLabel>Team</FieldLabel><Select value={activeTeamId} onValueChange={(value) => setTeamId(value ?? "")}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{teams.data.map((team) => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectGroup></SelectContent></Select></Field>
      {activeTeam ? <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <Card className="shadow-none"><CardHeader><CardTitle>Team details</CardTitle><CardDescription>Keep the silver accent visible for Karuppu Knights.</CardDescription></CardHeader><CardContent><form onSubmit={saveTeam}><FieldGroup><Field><FieldLabel htmlFor="team-name">Name</FieldLabel><Input id="team-name" name="name" defaultValue={activeTeam.name} required /></Field><Field><FieldLabel htmlFor="short-name">Short name</FieldLabel><Input id="short-name" name="shortName" defaultValue={activeTeam.shortName} required /></Field><Field><FieldLabel htmlFor="accent">Accent color</FieldLabel><Input id="accent" name="accentColor" type="color" defaultValue={activeTeam.accentColor} className="h-10" /></Field><Button type="submit" disabled={pending}>{pending ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}Save team</Button></FieldGroup></form></CardContent></Card>
          <Card className="shadow-none"><CardHeader><CardTitle>Add player</CardTitle></CardHeader><CardContent><form onSubmit={addPlayer}><FieldGroup><Field><FieldLabel htmlFor="player-name">Name</FieldLabel><Input id="player-name" name="name" required /></Field><div className="grid grid-cols-2 gap-3"><Field><FieldLabel htmlFor="jersey">Jersey</FieldLabel><Input id="jersey" name="jerseyNumber" type="number" min="0" /></Field><Field><FieldLabel>Role</FieldLabel><Select value={role} onValueChange={(value) => setRole((value ?? "unassigned") as PlayerRole)}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{roles.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field></div><Field><FieldLabel htmlFor="batting">Batting style</FieldLabel><Input id="batting" name="battingStyle" /></Field><Field><FieldLabel htmlFor="bowling">Bowling style</FieldLabel><Input id="bowling" name="bowlingStyle" /></Field><Button type="submit" disabled={pending}><UserPlus data-icon="inline-start" /> Add player</Button></FieldGroup></form></CardContent></Card>
        </div>
        <Card className="shadow-none"><CardHeader><CardTitle>Active roster</CardTitle><CardDescription>{roster.length} players</CardDescription></CardHeader><CardContent className="flex flex-col gap-2">{roster.map((player) => <div key={player.id} className="flex items-center justify-between gap-4 rounded-md border p-3"><div><p className="font-medium">{player.name}</p><div className="mt-1 flex flex-wrap gap-2"><Badge variant="secondary" className="capitalize">{player.role.replace("-", " ")}</Badge>{player.jerseyNumber !== null ? <Badge variant="outline">#{player.jerseyNumber}</Badge> : null}</div></div><Button variant="ghost" size="sm" onClick={() => deactivate(player)}>Remove</Button></div>)}</CardContent></Card>
      </div> : <Card className="shadow-none"><CardContent className="py-12 text-center text-muted-foreground">Run tournament setup before editing teams.</CardContent></Card>}
    </div>
  );
}
