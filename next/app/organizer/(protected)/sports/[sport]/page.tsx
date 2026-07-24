import { notFound } from "next/navigation";
import { OrganizerActivityEvents } from "@/components/organizer-activity-events";
import { OrganizerMatches } from "@/components/organizer-matches";
import { getActivitySport, type ActivitySportId } from "@/lib/activity-events";

const sports = ["football", "handball", "cricket", "throwball"] as const;

export default async function SportFixturesPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  if (sports.includes(sport as (typeof sports)[number])) return <OrganizerMatches sportPage={sport as (typeof sports)[number]} />;
  if (getActivitySport(sport)) return <OrganizerActivityEvents sportId={sport as ActivitySportId} />;
  notFound();
}
