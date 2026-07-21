"use client";

import { ArrowLeft, UserRound } from "lucide-react";
import Link from "next/link";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePublicCollection, usePublicDocument } from "@/lib/public-data";
import type { PublicPlayer, PublicTeam } from "@/lib/web-types";

export function PlayerProfile({ playerId }: { playerId: string }) {
  const player = usePublicDocument<PublicPlayer>("players", playerId);
  const teams = usePublicCollection<PublicTeam>("teams");
  if (player.loading || teams.loading) return <ContentSkeleton rows={2} />;
  if (player.error) return <DataError message={player.error} retry={player.retry} />;
  if (!player.data) return <p>Player not found.</p>;
  const team = teams.data.find((item) => item.id === player.data?.teamId);
  return (
    <div className="flex flex-col gap-5">
      <Button nativeButton={false} className="w-fit" variant="ghost" render={<Link href="/leaderboards" />}><ArrowLeft data-icon="inline-start" /> Leaderboards</Button>
      <Card className="shadow-none">
        <CardHeader>
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-md bg-muted"><UserRound /></span>
            <div><CardTitle className="text-2xl">{player.data.name}</CardTitle><CardDescription>{team?.name ?? "Sports Fiesta"}</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">{player.data.role.replace("-", " ")}</Badge>
          {player.data.jerseyNumber ? <Badge variant="outline">Jersey {player.data.jerseyNumber}</Badge> : null}
          {player.data.battingStyle ? <Badge variant="outline">{player.data.battingStyle}</Badge> : null}
          {player.data.bowlingStyle ? <Badge variant="outline">{player.data.bowlingStyle}</Badge> : null}
        </CardContent>
      </Card>
    </div>
  );
}
