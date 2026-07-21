import { RotateCcw, SquarePen } from "lucide-react";
import { FixtureCard } from "@/components/fixture-card";
import { Card, Pill, SectionHeader } from "@/components/ui";
import { fixtures } from "@/lib/tournament-data";

const controls = ["Goal", "Own Goal", "Yellow Card", "Red Card", "Undo"];
const cricketControls = ["0", "1", "2", "3", "4", "6", "Wide", "No Ball", "Bye", "Wicket"];

export default function LiveScoresPage() {
  return (
    <div>
      <SectionHeader eyebrow="Live Scores" title="Match scoring prototype" action={<Pill tone="live">Read-only demo data</Pill>} />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div className="space-y-5">
          {fixtures.map((fixture) => (
            <FixtureCard key={fixture.id} fixture={fixture} />
          ))}
        </div>
        <div className="space-y-5">
          <Card>
            <SquarePen className="mb-3 size-6 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-black text-white">Football and handball controls</h2>
            <p className="mt-2 leading-7 text-muted-strong">Organizer scoring controls are represented visually for the prototype. They do not persist changes yet.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {controls.map((control) => (
                <button key={control} type="button" className="min-h-12 rounded-lg border border-white/10 bg-white/8 px-3 text-sm font-black text-white">
                  {control}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <RotateCcw className="mb-3 size-6 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-black text-white">Cricket ball-by-ball panel</h2>
            <p className="mt-2 leading-7 text-muted-strong">The full engine is out of scope for this UI prototype, but the scoring surface shows the intended tap targets.</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {cricketControls.map((control) => (
                <button key={control} type="button" className="min-h-12 rounded-lg border border-white/10 bg-white/8 px-2 text-sm font-black text-white">
                  {control}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
