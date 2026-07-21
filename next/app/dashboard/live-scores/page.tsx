import { Radio } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { PageHeader } from "@/components/page-header";

export default function LiveScoresPage() {
  return (
    <>
      <PageHeader title="Live scores" description="Follow active matches and sport-specific scoring events in real time." />
      <DashboardEmptyState icon={Radio} title="No matches are live" description="Live match cards will appear here when an organizer starts a fixture." />
    </>
  );
}
