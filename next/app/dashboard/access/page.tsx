import { KeyRound } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { PageHeader } from "@/components/page-header";

export default function AccessPage() {
  return (
    <>
      <PageHeader title="Access" description="Manage organizer permissions and spectator access." />
      <DashboardEmptyState icon={KeyRound} title="No organizers added" description="Authorized organizer accounts will appear here after authentication is configured." />
    </>
  );
}
