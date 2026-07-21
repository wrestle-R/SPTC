import { KeyRound, ShieldCheck } from "lucide-react";
import { Card, Pill, SectionHeader } from "@/components/ui";
import { organizerAccess } from "@/lib/tournament-data";

export default function AccessPage() {
  return (
    <div>
      <SectionHeader eyebrow="Access" title="Organizer and viewer access preview" action={<Pill tone="ready">Prototype only</Pill>} />
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <ShieldCheck className="mb-3 size-6 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-black text-white">Access model</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-muted-strong">
            <p>Viewers get read-only screens with no visible edit controls.</p>
            <p>Organizers claim one seeded PIN once and every action is tagged to their name.</p>
            <p>Patrick is the admin organizer and can reset claimed organizer codes in the full backend version.</p>
          </div>
        </Card>
        <Card>
          <div className="mb-4 flex items-center gap-3">
            <KeyRound className="size-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-black text-white">Seeded organizer codes</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {organizerAccess.map((organizer) => (
              <div key={organizer.pin} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{organizer.name}</p>
                    <p className="text-sm text-muted">{organizer.role}</p>
                  </div>
                  <Pill tone={organizer.claimed ? "good" : "soon"}>{organizer.claimed ? "Claimed" : "Open"}</Pill>
                </div>
                <p className="mt-3 font-mono text-sm font-bold text-muted-strong">{organizer.pin}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
