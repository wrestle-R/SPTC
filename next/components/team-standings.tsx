"use client";

import { S9_TEAMS } from "@sports-fiesta/domain";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePublicDocument } from "@/lib/public-data";
import type { OverallStandingDocument } from "@/lib/web-types";
import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";

const TEAM_JERSEYS: Record<string, { front: string; back: string }> = {
  "crimson-warriors": { front: "/Jersey/red-front.png", back: "/Jersey/red-back.png" },
  "gods-gladiators": { front: "/Jersey/blue-front.png", back: "/Jersey/blue-back.png" },
  "karuppu-knights": { front: "/Jersey/black-front.png", back: "/Jersey/black-back.png" },
  "ivory-elites": { front: "/Jersey/ivory-front.png", back: "/Jersey/ivory-back.png" },
};

const TEAM_GRADIENTS: Record<string, string> = {
  "crimson-warriors": "from-red-600 to-orange-500",
  "gods-gladiators": "from-blue-600 to-cyan-500",
  "karuppu-knights": "from-zinc-700 to-slate-500",
  "ivory-elites": "from-amber-100 to-orange-50",
};

const TEAM_TEXT_COLORS: Record<string, string> = {
  "crimson-warriors": "text-red-500",
  "gods-gladiators": "text-blue-500",
  "karuppu-knights": "text-zinc-500",
  "ivory-elites": "text-orange-600",
};

export function TeamStandings() {
  const router = useRouter();
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
      total: stored?.total ?? 0,
    };
  }).sort((a, b) => b.total - a.total || a.rank - b.rank);

  return (
    <section className="flex flex-col gap-6" aria-labelledby="standings-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Sports Fiesta 2024</p>
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
              const textColor = TEAM_TEXT_COLORS[row.teamId] || "text-zinc-500";
              return (
                <motion.div
                  key={row.teamId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <Link href={`/teams/${row.teamId}`}>
                    <div className={`group relative overflow-hidden rounded-2xl border bg-card p-4 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer ${i === 0 ? 'ring-2 ring-amber-500/50' : ''}`}>
                      {i === 0 && (
                        <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
                          <Trophy className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${gradient} mb-3 opacity-60 group-hover:opacity-100 transition-opacity`} />
                      <div className="flex items-center gap-3">
                        {jersey && (
                          <div className="relative h-16 w-16 shrink-0">
                            <Image src={jersey.front} alt={row.name} fill className="object-contain drop-shadow-md" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={`text-2xl font-black tabular-nums ${textColor}`}>{row.total}</p>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">points</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm font-bold truncate">{row.name}</p>
                      <p className="text-xs text-muted-foreground">F {row.football} · H {row.handball} · C {row.cricket}</p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div>
            <Card className="shadow-none overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-primary" />
                  Full Standings
                </CardTitle>
                <CardDescription>Click a row to view team details.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6 font-bold">Team</TableHead>
                      <TableHead className="text-right font-bold">Football</TableHead>
                      <TableHead className="text-right font-bold">Handball</TableHead>
                      <TableHead className="text-right font-bold">Cricket</TableHead>
                      <TableHead className="pr-6 text-right font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => (
                      <TableRow 
                        key={row.teamId} 
                        className="border-l-[4px] cursor-pointer transition-all hover:bg-muted/50 hover:shadow-sm" 
                        style={{ borderLeftColor: row.accentColor }}
                        onClick={() => router.push(`/teams/${row.teamId}`)}
                      >
                        <TableCell className="pl-6 font-medium">
                          <span className="flex items-center gap-3">
                            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                              {index + 1}
                            </span>
                            <span className="text-sm font-bold">{row.name}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{row.football}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{row.handball}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{row.cricket}</TableCell>
                        <TableCell className="pr-6 text-right font-black tabular-nums text-base">{row.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </section>
  );
}
