import { Trophy } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { PageHeader } from "@/components/page-header";

export default function LeaderboardsPage() {
  return (
    <>
      <PageHeader title="Leaderboards" description="See the leading scorers and player achievements across each sport." />
      <DashboardEmptyState icon={Trophy} title="No leaderboard results" description="Player rankings will appear after match statistics have been recorded." />
    </>
  );
}
