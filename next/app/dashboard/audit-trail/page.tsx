import { Card, SectionHeader } from "@/components/ui";
import { auditTrail, disciplineEntries, getTeam } from "@/lib/tournament-data";

export default function AuditTrailPage() {
  return (
    <div>
      <SectionHeader eyebrow="Audit Trail" title="Transparent organizer actions" />
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <h2 className="text-xl font-black text-white">Action history</h2>
          <div className="mt-4 space-y-3">
            {auditTrail.map((item) => (
              <div key={item.id} className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[1fr_auto]">
                <div>
                  <p className="font-black text-white">{item.action}</p>
                  <p className="mt-1 text-sm text-muted">{item.actor} · {item.area}</p>
                </div>
                <p className="text-sm font-bold text-muted-strong">{item.time}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-black text-white">Discipline points</h2>
          <p className="mt-2 text-sm leading-6 text-muted-strong">Reasons are visible to viewers for full transparency.</p>
          <div className="mt-4 space-y-3">
            {disciplineEntries.map((entry) => {
              const team = getTeam(entry.teamId);

              return (
                <div key={entry.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-white">{team.name}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-strong">{entry.reason}</p>
                    </div>
                    <p className={entry.points >= 0 ? "font-mono text-2xl font-black text-green" : "font-mono text-2xl font-black text-red"}>
                      {entry.points > 0 ? "+" : ""}{entry.points}
                    </p>
                  </div>
                  <p className="mt-3 text-xs font-bold text-muted">{entry.organizer} · {entry.time}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
