"use client";

import { CircleDashed } from "lucide-react";
import { DataError, ContentSkeleton } from "@/components/data-state";
import { MatchCard } from "@/components/match-card";
import { Card, CardContent } from "@/components/ui/card";
import { usePublicCollection } from "@/lib/public-data";
import type { PublicMatch, PublicTeam } from "@/lib/web-types";

const headings = {
  football: { title: "Football", description: "Fixtures, live goals, lineups, standings, and the road to the final." },
  handball: { title: "Handball", description: "Live scoring, lineups, results, and tournament progress." },
  cricket: { title: "Cricket", description: "Five-over fixtures, ball-by-ball scorecards, leaders, and match analytics." },
} as const;

export function SportView({ sport }: { sport: keyof typeof headings }) {
  const matchesState = usePublicCollection<PublicMatch>("matches");
  const teamsState = usePublicCollection<PublicTeam>("teams");
  const matches = matchesState.data
    .filter((match) => match.sport === sport)
    .sort((a, b) => (a.matchNumber ?? a.id).localeCompare(b.matchNumber ?? b.id));
  const groups = [
    { title: "Live now", matches: matches.filter((match) => ["live", "innings-break", "super-over"].includes(match.status)) },
    { title: "Upcoming", matches: matches.filter((match) => ["scheduled", "lineup"].includes(match.status)) },
    { title: "Results", matches: matches.filter((match) => match.status === "completed") },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="max-w-2xl">
        <p className="text-sm font-semibold text-primary">Sports Fiesta S9</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{headings[sport].title}</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">{headings[sport].description}</p>
      </header>
      {matchesState.loading || teamsState.loading ? <ContentSkeleton /> : null}
      {matchesState.error ? <DataError message={matchesState.error} retry={matchesState.retry} /> : null}
      {!matchesState.loading && !matchesState.error && matches.length === 0 ? (
        <Card className="shadow-none">
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <span className="grid size-11 place-items-center rounded-lg bg-muted text-muted-foreground"><CircleDashed /></span>
            <div>
              <h2 className="font-semibold">No fixtures yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">Organizer-created matches will appear here immediately.</p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {groups.map((group) => group.matches.length ? (
        <section key={group.title} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{group.title}</h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {group.matches.map((match) => <MatchCard key={match.id} match={match} teams={teamsState.data} />)}
          </div>
        </section>
      ) : null)}
    </div>
  );
}
