"use client";

import { calculateMvpScore, type Player, type Team } from "@sports-fiesta/domain";
import { Activity, ArrowRight, CalendarDays, CircleDot, Crown, Medal, ShieldCheck, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { ContentSkeleton, DataError } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePrivateCollection } from "@/lib/organizer-data";
import type { PublicMatch } from "@/lib/web-types";

type FieldLeaders = { id: string; topScorers?: Array<{ playerId: string; teamId: string; goals: number }> };
type CricketLeaders = {
  id: string;
  orangeCap?: Array<{ playerId: string; teamId?: string; runs: number; innings: number; strikeRate: number }>;
  purpleCap?: Array<{ playerId: string; teamId?: string; wickets: number; economy: number }>;
};

const metrics = [
  { key: "live", label: "Live matches", icon: Activity, tint: "text-rose-500", surface: "bg-rose-500/10" },
  { key: "fixtures", label: "All matches", icon: CalendarDays, tint: "text-sky-500", surface: "bg-sky-500/10" },
  { key: "teams", label: "Teams", icon: ShieldCheck, tint: "text-violet-500", surface: "bg-violet-500/10" },
  { key: "players", label: "Players", icon: Users, tint: "text-amber-500", surface: "bg-amber-500/10" },
] as const;

export function OrganizerOverview() {
  const matches = usePrivateCollection<PublicMatch>("matches");
  const teams = usePrivateCollection<Team>("teams");
  const players = usePrivateCollection<Player>("players");
  const leaderboards = usePrivateCollection<FieldLeaders | CricketLeaders>("leaderboards");
  const loading = matches.loading || teams.loading || players.loading || leaderboards.loading;
  const error = matches.error || teams.error || players.error || leaderboards.error;

  if (loading) return <ContentSkeleton />;
  if (error) return <DataError message={error} retry={matches.retry} />;

  const footballLeaders = (leaderboards.data.find((row) => row.id === "football") as FieldLeaders | undefined)?.topScorers ?? [];
  const cricketLeaders = leaderboards.data.find((row) => row.id === "cricket") as CricketLeaders | undefined;
  const liveMatches = matches.data.filter((match) => ["live", "innings-break", "super-over"].includes(match.status));
  const values = { live: liveMatches.length, fixtures: matches.data.length, teams: teams.data.length, players: players.data.length };
  const player = (id?: string | null) => players.data.find((entry) => entry.id === id);
  const team = (id: string) => teams.data.find((entry) => entry.id === id);
  const overallLeaders = crossSportLeaders(matches.data);
  const overall = overallLeaders[0];

  const stars = [
    { key: "football", title: "Best football player", subtitle: "Top scorer", playerId: footballLeaders[0]?.playerId, value: footballLeaders[0] ? `${footballLeaders[0].goals} goals` : "No goals yet", icon: Trophy, accent: "from-sky-500 to-cyan-400" },
    { key: "batter", title: "Best cricketer", subtitle: "Orange Cap leader", playerId: cricketLeaders?.orangeCap?.[0]?.playerId, value: cricketLeaders?.orangeCap?.[0] ? `${cricketLeaders.orangeCap[0].runs} runs` : "No runs yet", icon: Medal, accent: "from-orange-500 to-amber-400" },
    { key: "bowler", title: "Best bowler", subtitle: "Purple Cap leader", playerId: cricketLeaders?.purpleCap?.[0]?.playerId, value: cricketLeaders?.purpleCap?.[0] ? `${cricketLeaders.purpleCap[0].wickets} wickets` : "No wickets yet", icon: CircleDot, accent: "from-violet-500 to-fuchsia-400" },
    { key: "overall", title: "Overall best player", subtitle: "Cross-sport performance index", playerId: overall?.playerId, value: overall ? `${overall.score.toFixed(0)} pts` : "Awaiting scores", icon: Crown, accent: "from-emerald-500 to-lime-400" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-xl sm:px-8 sm:py-8">
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"><span className="size-2 animate-pulse rounded-full bg-cyan-300" />Tournament command centre</div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Organizer home</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Create fixtures and monitor the live tournament state.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="border-rose-300/20 bg-rose-400/15 px-3 py-1.5 text-rose-100 hover:bg-rose-400/15"><span className="mr-2 size-2 animate-pulse rounded-full bg-rose-400" />{values.live} live</Badge>
            <Button render={<Link href="/organizer/matches" />} className="bg-white text-slate-950 hover:bg-slate-100">Manage fixtures <ArrowRight data-icon="inline-end" /></Button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ key, label, icon: Icon, tint, surface }) => (
          <Card key={key} className="overflow-hidden border-border/70 shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-2 text-4xl font-bold tracking-tight tabular-nums">{values[key]}</p></div>
              <span className={`grid size-11 place-items-center rounded-2xl ${surface} ${tint}`}><Icon className="size-5" /></span>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div>
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Live tournament state</h2><p className="text-sm text-muted-foreground">Matches that need your attention.</p></div><Link href="/organizer/matches" className="text-sm font-medium text-primary hover:underline">View all</Link></div>
          {liveMatches.length ? <div className="grid gap-3">{liveMatches.slice(0, 3).map((match) => <LiveMatchCard key={match.id} match={match} team={team} />)}</div> : <Card className="border-dashed"><CardContent className="flex min-h-48 flex-col items-center justify-center text-center"><span className="mb-3 grid size-11 place-items-center rounded-full bg-muted"><Activity className="size-5 text-muted-foreground" /></span><p className="font-semibold">No live matches right now</p><p className="mt-1 max-w-sm text-sm text-muted-foreground">Start a fixture when teams are ready and it will appear here in real time.</p></CardContent></Card>}
        </div>
        <div>
          <div className="mb-3"><h2 className="text-lg font-semibold">Tournament honours</h2><p className="text-sm text-muted-foreground">Leaders calculated from recorded results.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{stars.map(({ key, ...star }) => <StarCard key={key} {...star} player={player(star.playerId)} team={star.playerId ? team(player(star.playerId)?.teamId ?? "") : undefined} />)}</div>
        </div>
      </section>
    </div>
  );
}

function LiveMatchCard({ match, team }: { match: PublicMatch; team: (id: string) => Team | undefined }) {
  const home = team(match.homeTeamId); const away = team(match.awayTeamId);
  const score = match.sport === "cricket" ? match.cricket?.innings.at(-1)?.state : null;
  const homeScore = match.scoreSummary[match.homeTeamId] ?? 0; const awayScore = match.scoreSummary[match.awayTeamId] ?? 0;
  return <Link href={`/organizer/matches/${match.id}`} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Card className="group border-border/70 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><CardContent className="p-5"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{match.sport} · {match.stage}</span><Badge variant="destructive"><span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-current" />{match.status.replace("-", " ")}</Badge></div><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="min-w-0"><p className="truncate font-semibold">{home?.name ?? "Home team"}</p><p className="mt-1 text-2xl font-bold tabular-nums">{score?.battingTeamId === match.homeTeamId ? `${score.score}/${score.wickets}` : homeScore}</p></div><span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">VS</span><div className="min-w-0 text-right"><p className="truncate font-semibold">{away?.name ?? "Away team"}</p><p className="mt-1 text-2xl font-bold tabular-nums">{score?.battingTeamId === match.awayTeamId ? `${score.score}/${score.wickets}` : awayScore}</p></div></div><div className="mt-4 flex items-center justify-between border-t pt-3 text-sm text-muted-foreground"><span>{score ? `${score.overs} overs` : "Scoring in progress"}</span><span className="font-medium text-primary">Open console <ArrowRight className="ml-1 inline size-3.5 transition-transform group-hover:translate-x-1" /></span></div></CardContent></Card></Link>;
}

function StarCard({ title, subtitle, player, team, value, icon: Icon, accent }: { title: string; subtitle: string; player?: Player; team?: Team; value: string; icon: typeof Trophy; accent: string }) {
  const initials = player?.name.split(" ").map((part) => part[0]).join("").slice(0, 2) ?? "—";
  return <Card className="group relative isolate min-h-44 overflow-hidden border-0 bg-slate-950 text-white shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl">
    <div className={`absolute -right-10 -top-12 size-40 rounded-full bg-gradient-to-br ${accent} opacity-40 blur-3xl transition-opacity duration-300 group-hover:opacity-70`} />
    <div className={`absolute -bottom-16 left-8 size-32 rounded-full bg-gradient-to-br ${accent} opacity-25 blur-3xl`} />
    <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.08)_20.5%,transparent_21%)] opacity-60" />
    <CardContent className="relative flex h-full min-h-44 flex-col justify-between p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">Tournament honour</p><h3 className="mt-1 text-lg font-bold leading-tight tracking-tight">{title}</h3></div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${accent} shadow-lg ring-1 ring-white/30`}><Icon className="size-5 text-white" /></span>
      </div>
      <div className="flex items-end gap-3">
        <span className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-xl ring-2 ring-white/25`}><span className="text-lg font-black">{player ? initials : <Icon className="size-6" />}</span></span>
        <div className="min-w-0 flex-1 pb-0.5"><p className="truncate text-base font-bold">{player?.name ?? "To be decided"}</p><p className="truncate text-xs font-medium text-white/60">{player && team ? team.name : subtitle}</p></div>
        <div className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-right backdrop-blur-sm"><p className="text-sm font-extrabold tabular-nums">{value}</p><p className="mt-0.5 text-[10px] font-medium text-white/55">{subtitle}</p></div>
      </div>
    </CardContent>
  </Card>;
}

function crossSportLeaders(matches: PublicMatch[]) {
  const totals = new Map<string, number>();
  for (const match of matches) {
    const scores = matchPerformanceScores(match);
    const highest = Math.max(0, ...scores.values());
    if (!highest) continue;
    for (const [playerId, score] of scores) totals.set(playerId, (totals.get(playerId) ?? 0) + (score / highest) * 100);
  }
  return [...totals.entries()]
    .map(([playerId, score]) => ({ playerId, score }))
    .sort((a, b) => b.score - a.score || a.playerId.localeCompare(b.playerId));
}

function matchPerformanceScores(match: PublicMatch) {
  const scores = new Map<string, number>();
  const add = (playerId: string | undefined, amount: number) => {
    if (playerId && amount) scores.set(playerId, (scores.get(playerId) ?? 0) + amount);
  };

  if (match.sport === "cricket") {
    const rows = new Map<string, { runs: number; balls: number; fours: number; sixes: number; wickets: number; bowlingRuns: number; bowlingBalls: number; dotBalls: number; maidens: number; catches: number; directRunOuts: number; stumpings: number }>();
    const row = (id: string) => rows.get(id) ?? (rows.set(id, { runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, bowlingRuns: 0, bowlingBalls: 0, dotBalls: 0, maidens: 0, catches: 0, directRunOuts: 0, stumpings: 0 }), rows.get(id)!);
    for (const entry of match.cricket?.innings ?? []) {
      for (const batter of Object.values(entry.state.batters)) {
        const value = row(batter.playerId); value.runs += batter.runs; value.balls += batter.balls; value.fours += batter.fours; value.sixes += batter.sixes;
      }
      for (const bowler of Object.values(entry.state.bowlers)) {
        const value = row(bowler.playerId); value.wickets += bowler.wickets; value.bowlingRuns += bowler.runs; value.bowlingBalls += bowler.legalBalls; value.dotBalls += bowler.dots; value.maidens += bowler.maidens;
      }
      for (const event of entry.state.events) {
        if (!event.dismissal?.fielderId) continue;
        const value = row(event.dismissal.fielderId);
        if (event.dismissal.type === "caught") value.catches += 1;
        if (event.dismissal.type === "run-out") value.directRunOuts += 1;
        if (event.dismissal.type === "stumped") value.stumpings += 1;
      }
    }
    for (const [playerId, value] of rows) add(playerId, calculateMvpScore(value).total);
    return scores;
  }

  if (match.sport === "throwball") {
    for (const [playerId, stats] of Object.entries(match.throwball?.playerStats ?? {})) add(playerId, Math.max(0, stats.playerScore));
    return scores;
  }

  for (const event of match.fieldState?.events ?? []) {
    if (event.type === "goal") add(event.playerId, 35);
    if (event.assistPlayerId) add(event.assistPlayerId, 5);
  }
  return scores;
}
