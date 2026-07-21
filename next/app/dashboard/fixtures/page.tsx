import { FixtureCard } from "@/components/fixture-card";
import { Card, Pill, SectionHeader } from "@/components/ui";
import { events, fixtures } from "@/lib/tournament-data";

export default function FixturesPage() {
  return (
    <div>
      <SectionHeader eyebrow="Fixtures" title="Schedule and event list" action={<Pill tone="ready">Fixtures locked preview</Pill>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {fixtures.map((fixture) => (
            <FixtureCard key={fixture.id} fixture={fixture} compact />
          ))}
        </div>
        <Card>
          <h2 className="text-xl font-black text-white">Tournament events</h2>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-white">{event.icon} {event.name}</p>
                  <Pill tone={event.status === "Live" ? "live" : event.status === "Ready" ? "ready" : "soon"}>{event.status}</Pill>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">{event.summary}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
