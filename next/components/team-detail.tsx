"use client";

import type { Team } from "@sports-fiesta/domain";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Crown, Star, Users } from "lucide-react";
import { usePublicCollection } from "@/lib/public-data";
import type { PublicPlayer } from "@/lib/web-types";
import { ContentSkeleton } from "@/components/data-state";
import { motion } from "framer-motion";

const TEAM_JERSEYS: Record<string, { front: string; back: string }> = {
  "crimson-warriors": { front: "/Jersey/red-front.png", back: "/Jersey/red-back.png" },
  "gods-gladiators": { front: "/Jersey/blue-front.png", back: "/Jersey/blue-back.png" },
  "karuppu-knights": { front: "/Jersey/black-front.png", back: "/Jersey/black-back.png" },
  "ivory-elites": { front: "/Jersey/ivory-front.png", back: "/Jersey/ivory-back.png" },
};

const TEAM_GRADIENTS: Record<string, string> = {
  "crimson-warriors": "from-red-600 via-red-500 to-orange-500",
  "gods-gladiators": "from-blue-600 via-blue-500 to-cyan-500",
  "karuppu-knights": "from-zinc-700 via-zinc-600 to-slate-500",
  "ivory-elites": "from-amber-100 via-orange-50 to-rose-50",
};

const TEAM_GLOWS: Record<string, string> = {
  "crimson-warriors": "shadow-red-500/30",
  "gods-gladiators": "shadow-blue-500/30",
  "karuppu-knights": "shadow-zinc-500/30",
  "ivory-elites": "shadow-orange-300/30",
};

const TEAM_TEXT_COLORS: Record<string, string> = {
  "crimson-warriors": "text-white",
  "gods-gladiators": "text-white",
  "karuppu-knights": "text-white",
  "ivory-elites": "text-zinc-900",
};

export function TeamDetail({ team }: { team: Team }) {
  const playersState = usePublicCollection<PublicPlayer>("players");
  const jerseys = TEAM_JERSEYS[team.id];
  const roster = playersState.data?.filter(p => p.teamId === team.id && p.active) || [];
  const gradient = TEAM_GRADIENTS[team.id] || "from-zinc-600 to-zinc-400";
  const glow = TEAM_GLOWS[team.id] || "shadow-zinc-500/30";
  const textColor = TEAM_TEXT_COLORS[team.id] || "text-white";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/teams"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        All Teams
      </Link>

      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 sm:p-8 ${textColor} shadow-2xl ${glow}`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/20 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Team Profile</p>
            <h1 className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">{team.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold backdrop-blur-md ${team.id === 'ivory-elites' ? 'bg-black/10 text-zinc-900' : 'bg-white/20 text-white'}`}>
              <Users className="h-4 w-4" />
              {roster.length} Players
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col">
          <div className="relative flex items-center justify-center rounded-3xl border bg-gradient-to-br from-muted/50 to-muted/10 p-8 perspective-1000 min-h-[420px] overflow-hidden shadow-inner">
            <div className="absolute inset-0 opacity-40">
              <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
            </div>
            {jerseys ? (
              <JerseyFlipping front={jerseys.front} back={jerseys.back} alt={team.name} />
            ) : null}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground font-semibold tracking-wide bg-background/50 backdrop-blur-sm px-3 py-1 rounded-full border">
              Hover or tap to flip
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Team Roster</h2>
            <span className="text-sm text-muted-foreground">{roster.length} active</span>
          </div>
          {playersState.loading ? (
            <ContentSkeleton rows={6} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roster.sort((a,b) => a.name.localeCompare(b.name)).map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  className="flex items-center gap-3 rounded-xl border bg-card/50 p-3 text-sm transition-all hover:bg-card hover:shadow-md group"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-muted to-muted/50 text-xs font-bold group-hover:scale-105 transition-transform">
                    {player.jerseyNumber ?? "-"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-sm">{player.name}</p>
                    {player.role !== "unassigned" && (
                      <p className="text-xs text-muted-foreground capitalize">{player.role}</p>
                    )}
                  </div>
                  {team.captainId === player.id && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <Crown className="h-3 w-3" /> C
                    </span>
                  )}
                  {team.viceCaptainId === player.id && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Star className="h-3 w-3" /> VC
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JerseyFlipping({ front, back, alt }: { front: string; back: string; alt: string }) {
  const [flipped, setFlipped] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      if (!hasInteracted) setFlipped(true);
    }, 2000);
    
    const timer2 = setTimeout(() => {
      if (!hasInteracted) setFlipped(false);
    }, 4000);

    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [hasInteracted]);

  return (
    <div 
      className="group relative h-72 w-72 sm:h-80 sm:w-80 cursor-pointer preserve-3d transition-transform duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-105"
      style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      onMouseEnter={() => { setFlipped(true); setHasInteracted(true); }}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => { setFlipped(!flipped); setHasInteracted(true); }}
    >
      <div className="absolute inset-0 backface-hidden drop-shadow-2xl">
        <Image src={front} alt={`${alt} Front`} fill className="object-contain p-2" priority sizes="(max-width: 768px) 100vw, 400px" />
      </div>
      <div className="absolute inset-0 backface-hidden rotate-y-180 drop-shadow-2xl">
        <Image src={back} alt={`${alt} Back`} fill className="object-contain p-2" priority sizes="(max-width: 768px) 100vw, 400px" />
      </div>
    </div>
  );
}
