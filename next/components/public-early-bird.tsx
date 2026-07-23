"use client";

import { S9_TEAMS } from "@sports-fiesta/domain";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import Link from "next/link";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { TeamIdentity } from "@/components/team-identity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { usePublicCollection } from "@/lib/public-data";
import type { ImageSubmission, PublicTeam } from "@/lib/web-types";

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PublicEarlyBird() {
  const teamsState = usePublicCollection<PublicTeam>("teams");
  const submissionsState = usePublicCollection<ImageSubmission>("image_submissions");
  const teams = teamsState.data.length ? teamsState.data : S9_TEAMS;
  const entries = submissionsState.data
    .filter((submission) => submission.type === "early-bird")
    .sort((a, b) => a.groupPostedAt.localeCompare(b.groupPostedAt));

  if (teamsState.loading || submissionsState.loading) return <ContentSkeleton rows={3} />;
  if (teamsState.error || submissionsState.error) {
    return <DataError message={teamsState.error ?? submissionsState.error ?? "Failed to load early bird teams."} retry={teamsState.retry} />;
  }

  return (
    <section className="flex flex-col gap-6" aria-labelledby="early-bird-heading">
      <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.16),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,249,255,0.98))] p-6 shadow-sm dark:bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_38%),linear-gradient(135deg,rgba(20,23,31,0.98),rgba(24,24,27,0.98))]">
        <Badge variant="secondary" className="w-fit">Early Bird Jackpot</Badge>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 id="early-bird-heading" className="text-3xl font-black tracking-tight text-balance sm:text-4xl">
              Every verified team photo before 2:30 PM unlocks an extra 100 points.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              These are the teams that turned up early, showed the jersey count, and banked the bonus before the first whistle.
            </p>
          </div>
          <Button nativeButton={false} variant="outline" render={<Link href="/arrivals" />}>
            See arrival order <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>

      {entries.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((submission) => {
            const team = teams.find((entry) => entry.id === submission.teamId);
            if (!team) return null;
            return (
              <Link key={submission.id} href={`/teams/${team.id}`} className="group rounded-[1.75rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="overflow-hidden border-0 py-0 shadow-none ring-1 ring-black/6 transition-all duration-300 hover:-translate-y-1 hover:ring-primary/30">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={submission.imageUrl} alt={`${team.name} early bird photo`} className="block h-full w-full bg-muted/40 object-contain p-1 transition-transform duration-500 group-hover:scale-[1.03]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                    <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-900 shadow-sm">
                      <Clock3 className="size-3.5" />
                      Before 2:30 PM
                    </div>
                    <div className="absolute right-4 top-4 rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground shadow-lg">
                      100 pts
                    </div>
                    <div className="absolute inset-x-4 bottom-4 space-y-3">
                      <TeamIdentity team={team} subtitle={formatWhen(submission.groupPostedAt)} className="rounded-2xl bg-black/35 p-2 pr-4 backdrop-blur-md" />
                      <div className="flex items-center gap-2 text-sm text-white/85">
                        <Sparkles className="size-4 text-amber-300" />
                        Bonus locked in before the cutoff.
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
              <Clock3 className="size-6" />
            </span>
            <div className="max-w-md space-y-2">
              <CardTitle>No early bird submissions yet</CardTitle>
              <p className="text-sm text-muted-foreground">
                No early bird teams have been verified yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
