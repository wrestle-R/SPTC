import { PlayerProfile } from "@/components/player-profile";
import { PublicShell } from "@/components/public-shell";

export default async function PlayerPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { playerId } = await params;
  return <PublicShell><PlayerProfile playerId={playerId} /></PublicShell>;
}
