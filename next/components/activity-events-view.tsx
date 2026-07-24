"use client";

import type { Player, Team } from "@sports-fiesta/domain";
import { Users } from "lucide-react";
import { ACTIVITY_SPORTS, getActivitySport, type ActivityFixture, type ActivityRecord, type ActivityResult, type ActivitySportId } from "@/lib/activity-events";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicCollection } from "@/lib/public-data";

export function ActivityEventsView({ sportId }: { sportId: ActivitySportId }) {
  const sport = getActivitySport(sportId)!;
  const awards = usePublicCollection<ActivityRecord>("awards");
  const players = usePublicCollection<Player>("players");
  const teams = usePublicCollection<Team>("teams");
  if (awards.loading || players.loading || teams.loading) return <ContentSkeleton rows={3} />;
  const error = awards.error || players.error || teams.error;
  if (error) return <DataError message={error} retry={awards.retry} />;

  const results = awards.data.filter((record): record is ActivityResult => record.type === "activity-result" && record.sport === sportId);
  const fixtures = awards.data.filter((record): record is ActivityFixture => record.type === "activity-fixture" && record.sport === sportId);
  const completed = fixtures.filter((fixture) => fixture.status === "completed").length;
  const live = fixtures.filter((fixture) => fixture.status === "live").length;
  const playerName = (id: string) => players.data.find((player) => player.id === id)?.name ?? "Player";
  const teamName = (id: string) => teams.data.find((team) => team.id === id)?.name ?? "Team";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="rounded-3xl border bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
        <Badge variant="secondary">Special events</Badge>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{sport.label}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Upcoming, live, and completed event fixtures with results, team points, and announced relay lineups.</p>
        <div className="mt-5 flex items-center gap-2 text-sm font-semibold"><span className={`size-2 rounded-full ${live ? "animate-pulse bg-red-500" : "bg-primary"}`} />{live ? `${live} live · ` : ""}{completed}/{sport.events.length} completed</div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {sport.events.map((event) => {
          const result = results.find((item) => item.eventId === event.id);
          const fixture = fixtures.find((item) => item.eventId === event.id);
          const status = fixture?.status ?? "scheduled";
          return (
            <Card key={event.id} className="overflow-hidden shadow-none">
              <CardHeader className="border-b bg-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div><CardTitle className="text-lg">{event.name}</CardTitle><CardDescription>{fixture ? status === "live" ? "Live now" : status === "completed" ? "Completed" : "Upcoming fixture" : "Fixture not announced yet"}</CardDescription></div>
                  <Badge variant={status === "live" ? "destructive" : status === "completed" ? "secondary" : "outline"}>{fixture ? status : "Not scheduled"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {result ? <ResultList result={result} points={event.points} playerName={playerName} teamName={teamName} /> : fixture?.lineups ? <AnnouncedLineups lineups={fixture.lineups} playerName={playerName} teamName={teamName} /> : <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center text-muted-foreground"><Users className="size-5" /><p className="text-sm font-medium">{fixture?.status === "live" ? "This event is live — results will appear shortly." : fixture ? "Fixture announced. Results will appear here once recorded." : "This event has not been scheduled yet."}</p></div>}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ACTIVITY_SPORTS.map((item) => <a key={item.id} href={`/events/${item.id}`} className={`rounded-2xl border p-4 transition-colors ${item.id === sportId ? "border-primary bg-primary/10" : "bg-card hover:border-primary/40"}`}><p className="font-bold">{item.label}</p><p className="mt-1 text-sm text-muted-foreground">{item.events.length} events</p></a>)}
      </section>
    </div>
  );
}

function ResultList({ result, points, playerName, teamName }: { result: ActivityResult; points: readonly number[]; playerName: (id: string) => string; teamName: (id: string) => string }) {
  return <div className="space-y-2">{points.map((pointsForPlace, index) => { const winner = result.placements[String(index + 1)]; return <div key={pointsForPlace} className="flex items-center justify-between gap-3 rounded-xl border bg-muted/10 p-3"><div className="flex min-w-0 items-center gap-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-black ${index === 0 ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground"}`}>{index + 1}</span><div className="min-w-0"><p className="truncate font-semibold">{result.kind === "relay" ? teamName(winner) : playerName(winner)}</p>{result.kind === "relay" && result.lineups?.[winner]?.length ? <p className="truncate text-xs text-muted-foreground">{result.lineups[winner].map(playerName).join(" · ")}</p> : null}</div></div><span className="shrink-0 text-sm font-black tabular-nums">{pointsForPlace} pts</span></div>; })}</div>;
}

function AnnouncedLineups({ lineups, playerName, teamName }: { lineups: Record<string, string[]>; playerName: (id: string) => string; teamName: (id: string) => string }) {
  return <div className="space-y-3"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Announced lineups</p>{Object.entries(lineups).map(([teamId, lineup]) => <div key={teamId} className="rounded-xl border bg-muted/10 p-3"><p className="font-semibold">{teamName(teamId)}</p><p className="mt-1 text-sm text-muted-foreground">{lineup.map(playerName).join(" · ")}</p></div>)}</div>;
}
