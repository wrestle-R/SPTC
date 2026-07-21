import { Users } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { PageHeader } from "@/components/page-header";

export default function PlayersPage() {
  return (
    <>
      <PageHeader title="Players" description="Browse registered players, teams, and sport roles." />
      <DashboardEmptyState icon={Users} title="No players registered" description="Player profiles will appear here after real team rosters are added." />
    </>
  );
}
