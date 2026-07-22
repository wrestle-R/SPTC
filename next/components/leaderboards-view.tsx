"use client";

import { Medal, Trophy } from "lucide-react";
import Link from "next/link";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePublicCollection, usePublicDocument } from "@/lib/public-data";
import type { PublicPlayer } from "@/lib/web-types";

type FieldLeaders = { id: string; topScorers?: Array<{ playerId: string; teamId: string; goals: number }> };
type CricketLeaders = {
  id: string;
  orangeCap?: Array<{ playerId: string; runs: number; innings: number; strikeRate: number }>;
  purpleCap?: Array<{ playerId: string; wickets: number; economy: number }>;
  mostCatches?: Array<{ playerId: string; catches: number }>;
};

export function LeaderboardsView() {
  const players = usePublicCollection<PublicPlayer>("players");
  const football = usePublicDocument<FieldLeaders>("leaderboards", "football");
  const handball = usePublicDocument<FieldLeaders>("leaderboards", "handball");
  const cricket = usePublicDocument<CricketLeaders>("leaderboards", "cricket");
  const loading = players.loading || football.loading || handball.loading || cricket.loading;
  const error = players.error || football.error || handball.error || cricket.error;
  const name = (id: string) => players.data.find((player) => player.id === id)?.name ?? "Player";

  if (loading) return <ContentSkeleton />;
  if (error) return <DataError message={error} retry={players.retry} />;

  return (
    <Tabs defaultValue="football" className="gap-5">
      <TabsList className="h-auto w-full justify-start overflow-x-auto p-1 sm:w-fit">
        <TabsTrigger value="football" className="min-h-10 px-4">Football</TabsTrigger>
        <TabsTrigger value="handball" className="min-h-10 px-4">Handball</TabsTrigger>
        <TabsTrigger value="cricket" className="min-h-10 px-4">Cricket</TabsTrigger>
      </TabsList>
      <TabsContent value="football"><FieldLeaderboard title="Football top scorers" rows={football.data?.topScorers ?? []} name={name} /></TabsContent>
      <TabsContent value="handball"><FieldLeaderboard title="Handball top scorers" rows={handball.data?.topScorers ?? []} name={name} /></TabsContent>
      <TabsContent value="cricket">
        <div className="grid gap-4 lg:grid-cols-3">
          <CricketLeaderboard title="Orange Cap" description="Most tournament runs" rows={cricket.data?.orangeCap ?? []} name={name} metric="runs" />
          <CricketLeaderboard title="Purple Cap" description="Most tournament wickets" rows={cricket.data?.purpleCap ?? []} name={name} metric="wickets" />
          <CricketLeaderboard title="Most Catches" description="Most tournament catches" rows={cricket.data?.mostCatches ?? []} name={name} metric="catches" />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function FieldLeaderboard({ title, rows, name }: { title: string; rows: Array<{ playerId: string; goals: number }>; name: (id: string) => string }) {
  return (
    <Card className="shadow-none">
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Goals update from accepted match events.</CardDescription></CardHeader>
      <CardContent>{rows.length ? <Table><TableHeader><TableRow><TableHead>Player</TableHead><TableHead className="text-right">Goals</TableHead></TableRow></TableHeader><TableBody>{rows.map((row, index) => <TableRow key={row.playerId}><TableCell><Link href={`/players/${row.playerId}`} className="font-medium hover:underline">{index + 1}. {name(row.playerId)}</Link></TableCell><TableCell className="text-right font-semibold tabular-nums">{row.goals}</TableCell></TableRow>)}</TableBody></Table> : <EmptyLeaderboard />}</CardContent>
    </Card>
  );
}

function CricketLeaderboard({ title, description, rows, name, metric }: {
  title: string;
  description: string;
  rows: Array<{ playerId: string; runs?: number; wickets?: number; catches?: number }>;
  name: (id: string) => string;
  metric: "runs" | "wickets" | "catches";
}) {
  return (
    <Card className="shadow-none">
      <CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></div><Badge variant="secondary"><Medal /></Badge></div></CardHeader>
      <CardContent>{rows.length ? <div className="flex flex-col gap-2">{rows.slice(0, 10).map((row, index) => <div key={row.playerId} className="flex items-center justify-between gap-4 rounded-md border p-3"><span className="font-medium">{index + 1}. {name(row.playerId)}</span><span className="font-semibold tabular-nums">{row[metric] ?? 0}</span></div>)}</div> : <EmptyLeaderboard />}</CardContent>
    </Card>
  );
}

function EmptyLeaderboard() {
  return <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center text-muted-foreground"><Trophy /><p className="text-sm">Leaders will appear after completed scoring events.</p></div>;
}
