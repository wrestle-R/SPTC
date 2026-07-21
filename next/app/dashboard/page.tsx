import { CalendarCheck } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { overviewMetrics } from "@/lib/navigation";
import { tournamentFixtures, tournamentTeams } from "@/lib/tournament-fixtures";

const metricValues = {
  live: 0,
  fixtures: tournamentFixtures.length,
  teams: tournamentTeams.length,
  players: 0,
} as const;

export default function DashboardPage() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Tournament overview"
          description="A clear view of the tournament once teams, fixtures, and matches are added."
        />
        <Badge variant="secondary" className="w-fit">Fixtures ready</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map(({ key, label, icon: Icon }) => (
          <Card key={label} className="shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardDescription>{label}</CardDescription>
                <Icon className="text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl">{metricValues[key]}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {key === "fixtures" || key === "teams" ? "From the tournament schedule" : "No records yet"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardEmptyState
        icon={CalendarCheck}
        title="Group-stage fixtures are ready"
        description="Live scores and tournament activity will appear here when organizers begin recording match results."
      />
    </>
  );
}
