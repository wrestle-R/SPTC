import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getOrganizerSession } from "@/lib/organizer-session";

export default async function OrganizerProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!(await getOrganizerSession())) redirect("/organizer/login");
  return <DashboardShell>{children}</DashboardShell>;
}
