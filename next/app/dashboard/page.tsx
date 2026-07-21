import { DatabaseZap } from "lucide-react";
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

export default function DashboardPage() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Tournament overview"
          description="A clear view of the tournament once teams, fixtures, and matches are added."
        />
        <Badge variant="outline" className="w-fit">No tournament data</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map(({ label, icon: Icon }) => (
          <Card key={label} className="shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardDescription>{label}</CardDescription>
                <Icon className="text-muted-foreground" />
              </div>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">No records yet</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DashboardEmptyState
        icon={DatabaseZap}
        title="Start with an empty tournament"
        description="Tournament activity will appear here after teams, fixtures, and match results are added."
      />
    </>
  );
}
