"use client";

import { S9_TEAMS } from "@sports-fiesta/domain";
import { ArrowRight, CircleDot, Hand, Radio, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { DataError, ContentSkeleton } from "@/components/data-state";
import { MatchCard } from "@/components/match-card";
import { TeamStandings } from "@/components/team-standings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicCollection } from "@/lib/public-data";
import type { PublicMatch, PublicTeam } from "@/lib/web-types";

const sportLinks = [
  { href: "/football", label: "Football", detail: "Goals, cards, lineups", icon: CircleDot },
  { href: "/handball", label: "Handball", detail: "Scores, fixtures, results", icon: Hand },
  { href: "/cricket", label: "Cricket", detail: "Five-over live scorecards", icon: Trophy },
] as const;

export function HomeView() {
  const matchesState = usePublicCollection<PublicMatch>("matches");
  const teamsState = usePublicCollection<PublicTeam>("teams");
  const teams = teamsState.data.length ? teamsState.data : S9_TEAMS;
  const liveMatches = matchesState.data.filter((match) => ["live", "innings-break", "super-over"].includes(match.status)).slice(0, 2);
  const upcoming = matchesState.data
    .filter((match) => ["scheduled", "lineup"].includes(match.status))
    .sort((a, b) => (a.matchNumber ?? a.id).localeCompare(b.matchNumber ?? b.id))
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-6 border-b pb-10 lg:grid-cols-[1fr_0.8fr] lg:items-end">
        <div className="flex max-w-3xl flex-col gap-4">
          <Badge variant="secondary" className="w-fit">Tournament hub</Badge>
          <h1 className="text-4xl font-semibold leading-tight text-balance sm:text-5xl">
            Sports Fiesta
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Live scores, fixtures, team standings, and match progress in one clear view for the whole community.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button nativeButton={false} render={<Link href="/teams" />}>
              View standings <ArrowRight data-icon="inline-end" />
            </Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/cricket" />}>
              Cricket fixtures
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-none">
            <CardHeader>
              <Users />
              <CardDescription>Teams</CardDescription>
              <CardTitle className="text-3xl">4</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-none">
            <CardHeader>
              <Radio />
              <CardDescription>Live now</CardDescription>
              <CardTitle className="text-3xl">{liveMatches.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      {matchesState.loading || teamsState.loading ? <ContentSkeleton rows={2} /> : null}
      {matchesState.error ? <DataError message={matchesState.error} retry={matchesState.retry} /> : null}

      {!matchesState.loading && !matchesState.error ? (
        <section className="flex flex-col gap-3" aria-labelledby="live-heading">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Match centre</p>
              <h2 id="live-heading" className="text-2xl font-semibold">{liveMatches.length ? "Live now" : "Tournament ready"}</h2>
            </div>
            {liveMatches.length ? <Badge variant="destructive">{liveMatches.length} live</Badge> : <Badge variant="outline">No live match</Badge>}
          </div>
          {liveMatches.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {liveMatches.map((match, i) => <MatchCard key={match.id} match={match} teams={teams} featured={i === 0} />)}
            </div>
          ) : (
            <Card className="shadow-none">
              <CardContent className="flex min-h-36 flex-col justify-center gap-2">
                <p className="font-semibold">No match is being scored right now.</p>
                <p className="text-sm text-muted-foreground">The first live fixture will appear here automatically.</p>
              </CardContent>
            </Card>
          )}
        </section>
      ) : null}

      <section className="flex flex-col gap-4" aria-labelledby="events-heading">
        <div>
          <p className="text-sm font-medium text-primary">Events</p>
          <h2 id="events-heading" className="text-2xl font-semibold">Choose a sport</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {sportLinks.map(({ href, label, detail, icon: Icon }) => (
            <Link key={href} href={href} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="h-full shadow-none transition-colors hover:border-primary/50">
                <CardHeader>
                  <Icon />
                  <CardTitle>{label}</CardTitle>
                  <CardDescription>{detail}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <TeamStandings compact />

      {upcoming.length ? (
        <section className="flex flex-col gap-3" aria-labelledby="upcoming-heading">
          <div className="flex items-center justify-between gap-4">
            <h2 id="upcoming-heading" className="text-2xl font-semibold">Coming up</h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {upcoming.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
