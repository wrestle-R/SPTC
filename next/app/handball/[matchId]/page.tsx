import { MatchDetail } from "@/components/match-detail";
import { PublicShell } from "@/components/public-shell";

export default async function HandballMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  return <PublicShell><MatchDetail sport="handball" matchId={matchId} /></PublicShell>;
}
