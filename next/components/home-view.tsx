"use client";

import { S9_SEEDED_MATCHES, S9_TEAMS } from "@sports-fiesta/domain";
import { ArrowRight, ArrowUpRight, CheckCircle2, Clock, Radio, Users } from "lucide-react";
import { TbPlayFootball, TbPlayHandball, TbCricket } from "react-icons/tb";
import Link from "next/link";
import { DataError, ContentSkeleton } from "@/components/data-state";
import { MatchCard } from "@/components/match-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicCollection } from "@/lib/public-data";
import type { PublicMatch, PublicTeam } from "@/lib/web-types";

const sportLinks = [
  { href: "/football", label: "Football", icon: TbPlayFootball, color: "text-orange-400", bg: "bg-orange-500/15", glow: "from-orange-500/15", line: "stroke-orange-400/25" },
  { href: "/handball", label: "Handball", icon: TbPlayHandball, color: "text-teal-400", bg: "bg-teal-500/15", glow: "from-teal-500/15", line: "stroke-teal-400/25" },
  { href: "/cricket", label: "Cricket", icon: TbCricket, color: "text-amber-400", bg: "bg-amber-500/15", glow: "from-amber-500/15", line: "stroke-amber-400/25" },
] as const;

export function HomeView() {
  const matchesState = usePublicCollection<PublicMatch>("matches");
  const teamsState = usePublicCollection<PublicTeam>("teams");
  const teams = teamsState.data.length ? teamsState.data : S9_TEAMS;
  const matches = matchesState.data.length ? matchesState.data : S9_SEEDED_MATCHES as unknown as PublicMatch[];

  const liveMatches = matches
    .filter((match) => ["live", "innings-break", "super-over"].includes(match.status))
    .slice(0, 2);

  const completedMatches = matches
    .filter((match) => match.status === "completed")
    .sort((a, b) => (b.matchNumber ?? b.id).localeCompare(a.matchNumber ?? a.id))
    .slice(0, 3);

  const upcomingMatches = matches
    .filter((match) => ["scheduled", "lineup"].includes(match.status))
    .sort((a, b) => (a.matchNumber ?? a.id).localeCompare(b.matchNumber ?? b.id))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 border-b pb-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
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

      <section className="flex flex-col gap-3" aria-label="Events">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Events</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {sportLinks.map(({ href, label, icon: Icon, color, bg, glow, line }) => (
            <Link key={href} href={href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="relative min-h-24 overflow-hidden border-white/10 bg-card/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg">
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${glow} via-transparent to-transparent opacity-80`} />
                <svg aria-hidden="true" viewBox="0 0 180 80" className={`pointer-events-none absolute inset-y-0 right-0 h-full w-1/2 fill-none ${line}`}>
                  <circle cx="145" cy="40" r="27" strokeWidth="1.2" />
                  <circle cx="145" cy="40" r="17" strokeWidth="1" />
                  <path d="M86 8 126 40 86 72M111 8l40 32-40 32M136 8l40 32-40 32" strokeWidth="1" />
                </svg>
                <CardContent className="relative flex min-h-24 items-center gap-4 p-4">
                  <div className={`grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 ${bg} ${color} shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                    <Icon className="size-7" strokeWidth={1.8} />
                  </div>
                  <span className="text-base font-bold tracking-tight">{label}</span>
                  <ArrowUpRight className={`ml-auto size-5 ${color} opacity-60 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100`} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {matchesState.loading || teamsState.loading ? <ContentSkeleton rows={2} /> : null}
      {matchesState.error ? <DataError message={matchesState.error} retry={matchesState.retry} /> : null}

      {!matchesState.loading && !matchesState.error ? (
        <>
          <section className="flex flex-col gap-3" aria-labelledby="live-heading">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <h2 id="live-heading" className="text-xl font-bold">Live Now</h2>
              </div>
              {liveMatches.length ? <Badge variant="destructive">{liveMatches.length} live</Badge> : <Badge variant="outline">No live match</Badge>}
            </div>
            {liveMatches.length ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {liveMatches.map((match, i) => <MatchCard key={match.id} match={match} teams={teams} featured={i === 0} />)}
              </div>
            ) : (
              <Card className="shadow-none border-dashed">
                <CardContent className="flex min-h-24 flex-col justify-center gap-2 text-center">
                  <p className="font-semibold text-muted-foreground">No match is being scored right now.</p>
                  <p className="text-sm text-muted-foreground/70">The first live fixture will appear here automatically.</p>
                </CardContent>
              </Card>
            )}
          </section>

          {upcomingMatches.length ? (
            <section className="flex flex-col gap-3" aria-labelledby="upcoming-heading">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <h2 id="upcoming-heading" className="text-xl font-bold">Upcoming Matches</h2>
                <Badge variant="secondary" className="ml-1">{upcomingMatches.length}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingMatches.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}
              </div>
            </section>
          ) : null}

          {completedMatches.length ? (
            <section className="flex flex-col gap-3" aria-labelledby="completed-heading">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <h2 id="completed-heading" className="text-xl font-bold">Completed Matches</h2>
                <Badge variant="secondary" className="ml-1">{completedMatches.length}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {completedMatches.map((match) => <MatchCard key={match.id} match={match} teams={teams} />)}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
