import { notFound } from "next/navigation";
import { ActivityEventsView } from "@/components/activity-events-view";
import { PublicShell } from "@/components/public-shell";
import { getActivitySport, type ActivitySportId } from "@/lib/activity-events";

export default async function ActivitySportPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  if (!getActivitySport(sport)) notFound();
  return <PublicShell><ActivityEventsView sportId={sport as ActivitySportId} /></PublicShell>;
}
