import Link from "next/link";
import {
  BarChart3,
  ClipboardCheck,
  LockKeyhole,
  Radio,
  Shield,
  Trophy,
} from "lucide-react";
import { events, fixtures, getTeam, sortedStandings, teamTotal, teams } from "@/lib/tournament-data";
import { Card, Pill, RouteButton } from "@/components/ui";

const problemStatement =
  "Church-organized sports tournaments are often managed using paper score sheets, spreadsheets, and messaging apps, making it difficult to track live scores, fixtures, player statistics, and team standings in one place.";

export default function Home() {
  const live = fixtures.find((fixture) => fixture.status === "Live") ?? fixtures[0];
  const teamA = getTeam(live.teamAId);
  const teamB = getTeam(live.teamBId);

  return (
    <main className="min-h-screen text-foreground">
      <nav className="sticky top-0 z-30 border-b border-white/10 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Trophy className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-black text-white">Sports Fiesta S9</span>
              <span className="hidden text-xs font-semibold text-muted sm:block">Church tournament command center</span>
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-bold text-muted-strong md:flex">
            <a href="#problem" className="hover:text-white">Problem</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#teams" className="hover:text-white">Teams</a>
          </div>
          <RouteButton href="/dashboard">Open Dashboard</RouteButton>
        </div>
      </nav>

      <section className="score-grid relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_8%,rgba(240,201,107,0.20),transparent_30rem)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary/35 bg-primary/12 px-3 text-sm font-black text-primary">
              <Radio className="size-4" aria-hidden="true" />
              Live scores for every age group
            </p>
            <h1 className="safe-text text-5xl font-black leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Sports Fiesta S9
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-strong sm:text-xl">
              A centralized real-time tournament website for scores, fixtures, brackets, player stats, standings,
              organizer audit trails, and read-only spectator access.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <RouteButton href="/dashboard">View Live Dashboard</RouteButton>
              <a
                href="#problem"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/12 bg-white/8 px-4 text-sm font-black text-white hover:bg-white/12"
              >
                Read Problem
              </a>
            </div>
          </div>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-sm font-bold text-muted">Live now</p>
                <h2 className="mt-1 text-2xl font-black text-white">{live.sport} {live.stage}</h2>
              </div>
              <Pill tone="live">LIVE</Pill>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-7">
              <LandingScore name={teamA.name} score={live.scoreA} color={teamA.accent} />
              <span className="rounded-md bg-white/8 px-2 py-1 text-xs font-black text-muted">VS</span>
              <LandingScore name={teamB.name} score={live.scoreB} color={teamB.accent} align="right" />
            </div>

            <div className="space-y-3">
              {sortedStandings.map((row) => {
                const team = getTeam(row.teamId);
                const total = teamTotal(row.teamId);

                return (
                  <div key={team.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="safe-text font-black text-white">{team.name}</span>
                      <span className="font-mono text-lg font-black text-white">{total}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/35">
                      <div className="h-full rounded-full" style={{ width: `${total * 3}%`, backgroundColor: team.accent }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      <section id="problem" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Problem Statement</p>
            <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">One shared source of truth for match day.</h2>
          </div>
          <p className="text-lg leading-8 text-muted-strong">
            {problemStatement} Sports Fiesta S9 brings those flows into one reliable prototype: organizers see the
            controls they need, and spectators get clear live progress without confusing edit buttons.
          </p>
        </div>
      </section>

      <section id="features" className="border-y border-white/10 bg-white/[0.025]">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-16 sm:px-6 md:grid-cols-3">
          <FeatureCard icon={LockKeyhole} title="Organizer Access" text="Organizer-only scoring surfaces, Patrick admin preview, and a visible action trail." />
          <FeatureCard icon={BarChart3} title="Sport Rules" text="Football, handball, and cricket views shaped around sport-specific scoring needs." />
          <FeatureCard icon={ClipboardCheck} title="Spectator View" text="Read-only live scores, fixtures, brackets, standings, leaderboards, and discipline reasons." />
        </div>
      </section>

      <section id="teams" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">Tournament</p>
            <h2 className="mt-2 text-3xl font-black text-white">Seven events, four teams</h2>
          </div>
          <RouteButton href="/dashboard" variant="secondary">Dashboard</RouteButton>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <div className="mb-4 h-2 rounded-full" style={{ backgroundColor: team.accent }} />
              <h3 className="safe-text text-xl font-black text-white">{team.name}</h3>
              <p className="mt-2 text-sm text-muted">{team.roster.length} roster players</p>
            </Card>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-lg font-black text-white">{event.icon} {event.name}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{event.summary}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function LandingScore({
  name,
  score,
  color,
  align = "left",
}: {
  name: string;
  score: string;
  color: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <div className="mb-3 h-2 w-16 rounded-full" style={{ backgroundColor: color, marginLeft: align === "right" ? "auto" : undefined }} />
      <p className="safe-text text-sm font-black text-muted-strong">{name}</p>
      <p className="font-mono text-6xl font-black text-white">{score}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Shield;
  title: string;
  text: string;
}) {
  return (
    <Card>
      <Icon className="mb-5 size-8 text-primary" aria-hidden="true" />
      <h3 className="text-xl font-black text-white">{title}</h3>
      <p className="mt-3 leading-7 text-muted-strong">{text}</p>
    </Card>
  );
}
