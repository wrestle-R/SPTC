"use client";

import { S9_TEAMS } from "@sports-fiesta/domain";
import { ArrowRight, Camera, Medal, Trophy } from "lucide-react";
import Link from "next/link";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { TeamIdentity } from "@/components/team-identity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicCollection } from "@/lib/public-data";
import type { ImageSubmission, PublicTeam } from "@/lib/web-types";

const POSITION_LABELS: Record<number, string> = {
  1: "1st team in",
  2: "2nd team in",
  3: "3rd team in",
  4: "4th team in",
};

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PublicArrivals() {
  const teamsState = usePublicCollection<PublicTeam>("teams");
  const submissionsState = usePublicCollection<ImageSubmission>("image_submissions");
  const teams = teamsState.data.length ? teamsState.data : S9_TEAMS;
  const arrivals = submissionsState.data
    .filter((submission) => submission.type === "timely-arrival")
    .sort((a, b) => (a.arrivalPosition ?? 99) - (b.arrivalPosition ?? 99) || a.groupPostedAt.localeCompare(b.groupPostedAt));

  if (teamsState.loading || submissionsState.loading) return <ContentSkeleton rows={3} />;
  if (teamsState.error || submissionsState.error) {
    return <DataError message={teamsState.error ?? submissionsState.error ?? "Failed to load arrivals."} retry={teamsState.retry} />;
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="arrivals-heading">
      <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,247,237,0.96))] p-6 shadow-sm dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.2),transparent_42%),linear-gradient(135deg,rgba(31,24,16,0.96),rgba(24,24,27,0.98))]">
        <Badge variant="secondary" className="w-fit">Timely arrival</Badge>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 id="arrivals-heading" className="text-3xl font-black tracking-tight text-balance sm:text-4xl">
              The first four team photos set the pace for the championship.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              Verified group photos appear here as soon as the organizer confirms them. The order below feeds directly into the Team of the Year race.
            </p>
          </div>
          <Button nativeButton={false} render={<Link href="/teams" />}>
            View full standings <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>

      {arrivals.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {arrivals.map((submission) => {
            const team = teams.find((entry) => entry.id === submission.teamId);
            if (!team) return null;
            return (
              <Link key={submission.id} href={`/teams/${team.id}`} className="group rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] py-0 shadow-none ring-1 ring-black/6 transition-all duration-300 hover:-translate-y-1 hover:ring-primary/30 dark:bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.16),transparent_30%),linear-gradient(180deg,rgba(24,24,27,0.98),rgba(28,25,23,0.98))]">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={submission.imageUrl} alt={`${team.name} arrival photo`} className="block h-full w-full bg-muted/40 object-contain p-1 transition-transform duration-500 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                    <div className="absolute left-4 top-4">
                      <Badge className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-900 shadow-sm">
                        {POSITION_LABELS[submission.arrivalPosition ?? 4] ?? "Verified arrival"}
                      </Badge>
                    </div>
                    <div className="absolute right-4 top-4 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground shadow-lg">
                      {submission.pointsAwarded} pts
                    </div>
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                      <TeamIdentity team={team} subtitle={formatWhen(submission.groupPostedAt)} className="rounded-2xl bg-black/35 p-2 pr-4 backdrop-blur-md" />
                      <div className="hidden rounded-full border border-white/20 bg-white/10 p-2 text-white backdrop-blur-md sm:block">
                        <Trophy className="size-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed bg-muted/20 shadow-none">
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <Camera className="size-6" />
            </span>
            <div className="max-w-md space-y-2">
              <CardTitle>No arrivals recorded yet</CardTitle>
              <p className="text-sm text-muted-foreground">
                No arrival photos have been verified yet. Check back after the event starts.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        {[100, 60, 40, 20].map((points, index) => (
          <Card key={points} className="shadow-none">
            <CardHeader className="gap-2">
              <Badge variant="outline" className="w-fit">{index + 1}{index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"}</Badge>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Medal className="size-4 text-primary" />
                {points} points
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
