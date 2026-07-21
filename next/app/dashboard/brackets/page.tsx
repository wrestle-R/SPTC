import { GitFork } from "lucide-react";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { PageHeader } from "@/components/page-header";

export default function BracketsPage() {
  return (
    <>
      <PageHeader title="Brackets" description="Track qualification paths from early rounds through the final." />
      <DashboardEmptyState icon={GitFork} title="No brackets created" description="Tournament brackets will appear here after teams and knockout rounds are configured." />
    </>
  );
}
