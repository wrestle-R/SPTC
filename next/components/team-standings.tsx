"use client";

import { S9_TEAMS } from "@sports-fiesta/domain";
import Image from "next/image";
import Link from "next/link";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePublicDocument } from "@/lib/public-data";
import type { OverallStandingDocument } from "@/lib/web-types";
import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";
import { TEAM_GRADIENTS, TEAM_JERSEYS } from "@/lib/team-assets";

export function TeamStandings() {
  const standings = usePublicDocument<OverallStandingDocument>("standings", "overall");
  const rows = S9_TEAMS.map((team, index) => {
    const stored = standings.data?.rows.find((row) => row.teamId === team.id);
    return {
      rank: stored?.rank ?? index + 1,
      teamId: team.id,
      name: team.name,
      accentColor: team.accentColor,
      football: stored?.football ?? 0,
      handball: stored?.handball ?? 0,
      cricket: stored?.cricket ?? 0,
      throwball: stored?.throwball ?? 0,
      timelyArrival: stored?.timelyArrival ?? 0,
      earlyBird: stored?.earlyBird ?? 0,
      leagueWin: stored?.leagueWin ?? 0,
      leagueTie: stored?.leagueTie ?? 0,
      total: stored?.total ?? 0,
    };
  }).sort((a, b) => b.total - a.total || a.rank - b.rank);

  return (
    <section className="flex flex-col gap-6" aria-labelledby="standings-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Sports Fiesta S9</p>
          <h2 id="standings-heading" className="mt-1 text-2xl sm:text-3xl font-black tracking-tight">Team Standings</h2>
        </div>
      </div>

      {standings.loading ? <ContentSkeleton rows={1} /> : null}
      {standings.error ? <DataError message={standings.error} retry={standings.retry} /> : null}

      {!standings.loading ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {rows.map((row, i) => {
              const jersey = TEAM_JERSEYS[row.teamId];
              const gradient = TEAM_GRADIENTS[row.teamId] || "from-zinc-600 to-zinc-400";
              const bonusSwing = row.timelyArrival + row.earlyBird + row.leagueWin + row.leagueTie;
              return (
                <motion.div
                  key={row.teamId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <Link href={`/teams/${row.teamId}`}>
                    <div className={`group relative overflow-hidden rounded-2xl border bg-card/40 backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer ${i === 0 ? 'ring-2 ring-amber-500/80 bg-amber-500/10' : 'hover:bg-card/80'}`}>
                      {i === 0 && (
                        <div className="absolute -right-3 -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 shadow-[0_0_20px_rgba(245,158,11,0.6)] border-[3px] border-background z-10">
                          <Trophy className="h-6 w-6 text-white drop-shadow-md" strokeWidth={2.5} />
                          <div className="absolute inset-0 rounded-full animate-ping bg-amber-400/40" style={{ animationDuration: '3s' }} />
                        </div>
                      )}
                      <div className={`absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r ${gradient} opacity-70 group-hover:opacity-100 group-hover:h-2 transition-all duration-300`} />
                      <div className="flex items-center gap-4">
                        {jersey && (
                          <div className="relative h-24 w-20 shrink-0 transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2 sm:h-28 sm:w-24">
                            <Image src={jersey.front} alt={`${row.name} jersey`} fill className="object-contain drop-shadow-[0_12px_14px_rgba(0,0,0,0.28)]" loading={i === 0 ? "eager" : "lazy"} sizes="(max-width: 640px) 80px, 96px" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-4xl font-black tabular-nums tracking-tighter text-foreground drop-shadow-sm">{row.total}</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">points</p>
                          <p className="mt-2 text-xs font-medium text-muted-foreground">
                            Bonus swing: <span className="font-semibold text-foreground">{bonusSwing}</span>
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-base font-extrabold truncate tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">{row.name}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-2xl">
            <Card className="shadow-none overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-primary" />
                  Team of the year ranking
                </CardTitle>
                <CardDescription>Click a row to view team details.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="sticky left-0 z-10 bg-card pl-6 font-bold">Sport / event</TableHead>
                      {rows.map((row) => <TableHead key={row.teamId} className="min-w-28 text-right font-bold">{row.name}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ["Football", "football"], ["Handball", "handball"], ["Cricket", "cricket"], ["Throwball", "throwball"],
                      ["League win", "leagueWin"], ["League tie", "leagueTie"], ["Arrival", "timelyArrival"], ["Early Bird", "earlyBird"], ["Total", "total"],
                    ].map(([label, key]) => (
                      <TableRow 
                        key={key}
                        className="transition-all hover:bg-muted/50"
                      >
                        <TableCell className="sticky left-0 z-10 bg-card pl-6 font-bold">{label}</TableCell>
                        {rows.map((row) => <TableCell key={row.teamId} className={`text-right tabular-nums ${key === "total" ? "font-black text-base" : "text-sm"}`}><Link href={`/teams/${row.teamId}`} className="hover:underline">{row[key as keyof typeof row] as number}</Link></TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  );
}
