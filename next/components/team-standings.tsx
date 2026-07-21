"use client";

import { S9_TEAMS } from "@sports-fiesta/domain";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePublicDocument } from "@/lib/public-data";
import type { OverallStandingDocument } from "@/lib/web-types";

const chartConfig = {
  football: { label: "Football", color: "var(--chart-1)" },
  handball: { label: "Handball", color: "var(--chart-2)" },
  cricket: { label: "Cricket", color: "var(--chart-3)" },
  discipline: { label: "Discipline", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function TeamStandings({ compact = false }: { compact?: boolean }) {
  const standings = usePublicDocument<OverallStandingDocument>("standings", "overall");
  const rows = S9_TEAMS.map((team, index) => {
    const stored = standings.data?.rows.find((row) => row.teamId === team.id);
    return {
      rank: stored?.rank ?? index + 1,
      teamId: team.id,
      team: team.shortName,
      name: team.name,
      accentColor: team.accentColor,
      football: stored?.football ?? 0,
      handball: stored?.handball ?? 0,
      cricket: stored?.cricket ?? 0,
      discipline: stored?.discipline ?? 0,
      total: stored?.total ?? 0,
    };
  }).sort((a, b) => b.total - a.total || a.rank - b.rank);

  return (
    <section className="flex flex-col gap-4" aria-labelledby="standings-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Team points</p>
          <h2 id="standings-heading" className="text-2xl font-semibold">Overall standings</h2>
        </div>
        {compact ? (
          <Button nativeButton={false} variant="outline" size="sm" render={<Link href="/teams" />}>Full standings</Button>
        ) : null}
      </div>
      {standings.loading ? <ContentSkeleton rows={1} /> : null}
      {standings.error ? <DataError message={standings.error} retry={standings.retry} /> : null}
      {!standings.loading ? (
        <div className={compact ? "grid gap-4 lg:grid-cols-[0.9fr_1.1fr]" : "flex flex-col gap-4"}>
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Points breakdown</CardTitle>
              <CardDescription>Sport placements plus discipline adjustments.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
                <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 12 }} accessibilityLayer>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="team" width={58} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="football" stackId="points" fill="var(--color-football)" />
                  <Bar dataKey="handball" stackId="points" fill="var(--color-handball)" />
                  <Bar dataKey="cricket" stackId="points" fill="var(--color-cricket)" />
                  <Bar dataKey="discipline" stackId="points" fill="var(--color-discipline)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Team</TableHead>
                    <TableHead className="text-right">Football</TableHead>
                    <TableHead className="text-right">Handball</TableHead>
                    <TableHead className="text-right">Cricket</TableHead>
                    <TableHead className="pr-6 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.teamId}>
                      <TableCell className="pl-6 font-medium">
                        <span className="flex items-center gap-3">
                          <span className="w-5 tabular-nums text-muted-foreground">{index + 1}</span>
                          <span className="size-2.5 shrink-0 rounded-sm border" style={{ backgroundColor: row.accentColor }} />
                          <span>{row.name}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.football}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.handball}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.cricket}</TableCell>
                      <TableCell className="pr-6 text-right font-semibold tabular-nums">{row.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
