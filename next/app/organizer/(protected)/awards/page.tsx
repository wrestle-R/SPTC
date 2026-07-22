"use client";

import { S9_PLAYERS } from "@sports-fiesta/domain";
import { Medal } from "lucide-react";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePublicCollection, usePublicDocument } from "@/lib/public-data";
import type { PublicPlayer } from "@/lib/web-types";

type FieldLeaders = { topScorers?: Array<{ playerId: string; teamId: string; goals: number }> };
type CricketLeaders = {
  orangeCap?: Array<{ playerId: string; runs: number }>;
  purpleCap?: Array<{ playerId: string; wickets: number }>;
  mostCatches?: Array<{ playerId: string; catches: number }>;
};

export default function OrganizerAwardsPage() {
  const players = usePublicCollection<PublicPlayer>("players");
  const football = usePublicDocument<FieldLeaders>("leaderboards", "football");
  const handball = usePublicDocument<FieldLeaders>("leaderboards", "handball");
  const cricket = usePublicDocument<CricketLeaders>("leaderboards", "cricket");
  const loading = players.loading || football.loading || handball.loading || cricket.loading;
  const error = players.error || football.error || handball.error || cricket.error;
  const roster = players.data.length ? players.data : S9_PLAYERS;
  const playerName = (id: string) => roster.find((player) => player.id === id)?.name ?? "Player";

  if (loading) return <ContentSkeleton />;
  if (error) return <DataError message={error} retry={players.retry} />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Awards</h1>
        <p className="mt-1 text-sm text-muted-foreground">Organizer view of tournament award leaders from accepted match events.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <AwardTable title="Football Top Scorer" metric="Goals" rows={(football.data?.topScorers ?? []).map((row) => ({ playerId: row.playerId, value: row.goals }))} playerName={playerName} />
        <AwardTable title="Handball Most Goals" metric="Goals" rows={(handball.data?.topScorers ?? []).map((row) => ({ playerId: row.playerId, value: row.goals }))} playerName={playerName} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <AwardTable title="Cricket Most Runs" metric="Runs" rows={(cricket.data?.orangeCap ?? []).map((row) => ({ playerId: row.playerId, value: row.runs }))} playerName={playerName} />
        <AwardTable title="Cricket Most Wickets" metric="Wickets" rows={(cricket.data?.purpleCap ?? []).map((row) => ({ playerId: row.playerId, value: row.wickets }))} playerName={playerName} />
        <AwardTable title="Cricket Most Catches" metric="Catches" rows={(cricket.data?.mostCatches ?? []).map((row) => ({ playerId: row.playerId, value: row.catches }))} playerName={playerName} />
      </div>
    </div>
  );
}

function AwardTable({ title, metric, rows, playerName }: { title: string; metric: string; rows: Array<{ playerId: string; value: number }>; playerName: (id: string) => string }) {
  const visible = rows.filter((row) => row.value > 0).slice(0, 10);
  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div><CardTitle>{title}</CardTitle><CardDescription>Generated from recorded scoring data.</CardDescription></div>
          <Medal className="size-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {visible.length ? (
          <Table>
            <TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-right">{metric}</TableHead></TableRow></TableHeader>
            <TableBody>{visible.map((row, index) => <TableRow key={row.playerId}><TableCell>{index + 1}. {playerName(row.playerId)}</TableCell><TableCell className="text-right font-semibold tabular-nums">{row.value}</TableCell></TableRow>)}</TableBody>
          </Table>
        ) : <p className="py-10 text-center text-sm text-muted-foreground">No qualifying events yet.</p>}
      </CardContent>
    </Card>
  );
}
