import { Activity, CalendarDays, ShieldCheck, Trophy } from "lucide-react";
import { FixtureCard } from "@/components/fixture-card";
import { TeamStandings } from "@/components/team-standings";
import { Card, Pill, SectionHeader, StatCard } from "@/components/ui";
import { auditTrail, events, fixtures, liveFixture } from "@/lib/tournament-data";

export default function DashboardPage() {
  return (
    <div>
      <SectionHeader
        eyebrow="Overview"
        title="Live tournament control room"
        action={<Pill tone="live">1 match live</Pill>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Events" value="7" detail="Football, cricket, handball, and placeholders" />
        <StatCard label="Teams" value="4" detail="Rosters seeded from the tournament prompt" />
        <StatCard label="Fixtures" value={String(fixtures.length)} detail="Live, upcoming, and finished match cards" />
        <StatCard label="Audit items" value={String(auditTrail.length)} detail="Organizer actions shown transparently" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <FixtureCard fixture={liveFixture} />
        <TeamStandings />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <Activity className="size-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-black text-white">Event status</h2>
          </div>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="min-w-0">
                  <p className="safe-text font-black text-white">{event.icon} {event.name}</p>
                  <p className="safe-text text-sm text-muted">{event.summary}</p>
                </div>
                <Pill tone={event.status === "Live" ? "live" : event.status === "Ready" ? "ready" : "soon"}>{event.status}</Pill>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-3">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-black text-white">Recent organizer activity</h2>
          </div>
          <div className="space-y-3">
            {auditTrail.slice(0, 4).map((item) => (
              <div key={item.id} className="grid gap-1 rounded-lg border border-white/10 bg-white/[0.035] p-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-black text-white">{item.action}</p>
                  <p className="text-sm text-muted">{item.actor} · {item.area}</p>
                </div>
                <p className="text-sm font-bold text-muted-strong">{item.time}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Card>
          <CalendarDays className="mb-3 size-6 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-black text-white">Next match</h2>
          <p className="mt-2 leading-7 text-muted-strong">Cricket group stage starts at 11:40 AM with Ivory Elites vs Karuppu Knights.</p>
        </Card>
        <Card>
          <Trophy className="mb-3 size-6 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-black text-white">Bracket note</h2>
          <p className="mt-2 leading-7 text-muted-strong">Football decider and handball final are visible in the bracket view as prototype stages.</p>
        </Card>
      </div>
    </div>
  );
}
