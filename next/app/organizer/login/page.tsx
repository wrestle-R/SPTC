import { redirect } from "next/navigation";
import { OrganizerLoginForm } from "@/components/organizer-login-form";
import { getOrganizerSession } from "@/lib/organizer-session";

export default async function OrganizerLoginPage() {
  if (await getOrganizerSession()) redirect("/organizer");
  return <main className="grid min-h-svh place-items-center bg-muted/30 p-4"><OrganizerLoginForm /></main>;
}
