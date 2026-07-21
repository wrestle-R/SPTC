import { Trophy } from "lucide-react";
import { Card, Pill, SectionHeader } from "@/components/ui";

const stages = [
  { title: "Group Stage", detail: "All four teams play round-robin fixtures", status: "Live" },
  { title: "Decider Match", detail: "Shown only when 2nd and 3rd are tied on wins", status: "Upcoming" },
  { title: "Final", detail: "Top qualifier vs decider winner", status: "Upcoming" },
  { title: "Champion", detail: "Trophy badge appears after final result", status: "Pending" },
];

export default function BracketsPage() {
  return (
    <div>
      <SectionHeader eyebrow="Brackets" title="Progression map" />
      <Card>
        <div className="grid gap-4 lg:grid-cols-4">
          {stages.map((stage, index) => (
            <div key={stage.title} className="relative rounded-lg border border-white/10 bg-white/[0.035] p-4">
              {index < stages.length - 1 ? <div className="absolute right-[-1rem] top-1/2 hidden h-px w-4 bg-primary/60 lg:block" /> : null}
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/15 text-primary">
                  {index === stages.length - 1 ? <Trophy className="size-5" aria-hidden="true" /> : index + 1}
                </span>
                <Pill tone={stage.status === "Live" ? "live" : stage.status === "Upcoming" ? "ready" : "soon"}>{stage.status}</Pill>
              </div>
              <h2 className="text-xl font-black text-white">{stage.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-strong">{stage.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black text-white">Football route</h2>
          <p className="mt-3 leading-7 text-muted-strong">God&apos;s Gladiators currently lead the live group match. Karuppu Knights and Ivory Elites are shown in a decider preview.</p>
        </Card>
        <Card>
          <h2 className="text-xl font-black text-white">Handball route</h2>
          <p className="mt-3 leading-7 text-muted-strong">God&apos;s Gladiators and Crimson Warriors are staged for the final in this prototype bracket.</p>
        </Card>
      </div>
    </div>
  );
}
