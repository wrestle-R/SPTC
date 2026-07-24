import { DashboardShell } from "@/components/dashboard-shell";
import { hasOrganizerAccess } from "@/lib/organizer-access";
import { redirect } from "next/navigation";

export default async function OrganizerProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasOrganizerAccess())) redirect("/organizer/access");
  return <DashboardShell>{children}</DashboardShell>;
}
