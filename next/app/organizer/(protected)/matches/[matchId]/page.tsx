import { OrganizerMatchScorer } from "@/components/organizer-match-scorer";

export default async function OrganizerMatchPage({ params }: { params: Promise<{ matchId: string }> }) { const { matchId } = await params; return <OrganizerMatchScorer matchId={matchId} />; }
