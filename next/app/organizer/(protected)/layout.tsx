import { DashboardShell } from "@/components/dashboard-shell";

export default function OrganizerProtectedLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
