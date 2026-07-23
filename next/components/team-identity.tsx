"use client";

import type { Team } from "@sports-fiesta/domain";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { TEAM_JERSEYS, teamInitials } from "@/lib/team-assets";

export function TeamIdentity({
  team,
  subtitle,
  compact = false,
  className,
}: {
  team: Team;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}) {
  const jersey = TEAM_JERSEYS[team.id];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative overflow-hidden rounded-2xl border border-white/10 bg-background/80 shadow-sm", compact ? "size-12" : "size-16")}>
        {team.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.logoUrl} alt={`${team.name} logo`} className="h-full w-full object-cover" />
        ) : jersey ? (
          <Image src={jersey.front} alt={`${team.name} jersey`} fill className="object-contain p-1.5" sizes={compact ? "48px" : "64px"} />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-sm font-black text-white"
            style={{ backgroundColor: team.accentColor }}
          >
            {teamInitials(team.shortName || team.name)}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className={cn("truncate font-semibold tracking-tight", compact ? "text-sm" : "text-base")}>{team.name}</p>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}
