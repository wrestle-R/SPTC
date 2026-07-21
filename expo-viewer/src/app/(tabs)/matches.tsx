import { MatchList } from "@/components/match-list";
import { Screen, Section } from "@/components/ui/primitives";

export default function MatchesScreen() {
  return <Screen title="Matches" subtitle="Scheduled fixtures, live scores, and completed results."><Section title="Scheduled"><MatchList filter={(match) => ["scheduled", "lineup"].includes(match.status)} /></Section><Section title="Live"><MatchList filter={(match) => ["live", "innings-break", "super-over"].includes(match.status)} /></Section><Section title="Upcoming"><MatchList filter={(match) => match.status === "scheduled"} /></Section><Section title="Completed"><MatchList filter={(match) => match.status === "completed"} /></Section></Screen>;
}
