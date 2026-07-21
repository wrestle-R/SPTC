import { ScrollText } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { PageHeader } from "@/components/page-header";

export default function AuditTrailPage() {
  return (
    <>
      <PageHeader title="Audit trail" description="Review organizer actions and tournament record changes." />
      <DashboardEmptyState icon={ScrollText} title="No activity recorded" description="Verified organizer actions will appear here as tournament records are created or updated." />
    </>
  );
}
