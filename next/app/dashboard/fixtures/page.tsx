import { CalendarDays } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { PageHeader } from "@/components/page-header";

export default function FixturesPage() {
  return (
    <>
      <PageHeader title="Fixtures" description="View the complete match schedule across every tournament sport." />
      <DashboardEmptyState icon={CalendarDays} title="No fixtures scheduled" description="Scheduled matches will appear here after the tournament calendar is created." />
    </>
  );
}
