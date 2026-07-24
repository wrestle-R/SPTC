"use client";

import type { Team } from "@sports-fiesta/domain";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { OverallStandingDocument } from "@/lib/web-types";

const chartConfig = { points: { label: "Points" } } satisfies ChartConfig;

export function TeamPointsChart({ teams, standings }: { teams: Team[]; standings?: OverallStandingDocument | null }) {
  const rows = teams
    .map((team) => ({
      id: team.id,
      name: team.shortName || team.name,
      fullName: team.name,
      points: standings?.rows.find((row) => row.teamId === team.id)?.total ?? 0,
      color: team.accentColor || team.color || "#64748b",
      stroke: team.id === "karuppu-knights" ? "#e5e7eb" : "transparent",
    }))
    .sort((left, right) => right.points - left.points || left.fullName.localeCompare(right.fullName));

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="gap-1 pb-2">
        <CardTitle className="text-lg">Team points</CardTitle>
        <CardDescription>Live overall standings across every event.</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-3 sm:px-4">
        <ChartContainer config={chartConfig} className="pointer-events-none h-[260px] w-full touch-manipulation select-none aspect-auto sm:h-[280px] [&_.recharts-surface]:!outline-none [&_.recharts-wrapper]:!outline-none">
          <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 34, bottom: 0, left: 0 }} accessibilityLayer={false}>
            <CartesianGrid horizontal={false} strokeDasharray="3 4" />
            <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={86} tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
            <ChartTooltip cursor={{ fill: "hsl(var(--muted) / 0.55)" }} content={<ChartTooltipContent labelFormatter={(_, payload) => payload[0]?.payload?.fullName ?? "Team"} formatter={(value) => <><span className="text-muted-foreground">Overall points</span><span className="font-mono font-semibold tabular-nums">{Number(value).toLocaleString()}</span></>} />} />
            <Bar dataKey="points" radius={[0, 7, 7, 0]} maxBarSize={34}>
              {rows.map((row) => <Cell key={row.id} fill={row.color} stroke={row.stroke} strokeWidth={row.id === "karuppu-knights" ? 2 : 0} />)}
              <LabelList dataKey="points" position="right" className="fill-foreground text-xs font-bold" />
            </Bar>
          </BarChart>
        </ChartContainer>
        <p className="px-2 pt-1 text-xs text-muted-foreground">Each bar uses the team&apos;s official color. It updates when scores are recorded.</p>
      </CardContent>
    </Card>
  );
}
