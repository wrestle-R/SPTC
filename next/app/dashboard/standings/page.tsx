import { ListOrdered } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { PageHeader } from "@/components/page-header";

export default function StandingsPage() {
  return (
    <>
      <PageHeader title="Standings" description="Compare team performance and points across the tournament." />
      <DashboardEmptyState icon={ListOrdered} title="No standings available" description="Team standings will be calculated after teams and match results are added." />
    </>
  );
}
