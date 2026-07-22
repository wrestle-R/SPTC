"use client";

import { S9_PLAYERS, type Team } from "@sports-fiesta/domain";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Crown, Rotate3D, Sparkles, Star, Users } from "lucide-react";
import { usePublicCollection } from "@/lib/public-data";
import type { PublicPlayer } from "@/lib/web-types";
import { ContentSkeleton } from "@/components/data-state";
import { motion } from "framer-motion";

const TEAM_JERSEYS: Record<string, { front: string; back: string }> = {
  "crimson-warriors": { front: "/Jersey/red-front-v2.png", back: "/Jersey/red-back-v2.png" },
  "gods-gladiators": { front: "/Jersey/blue-front-v2.png", back: "/Jersey/blue-back-v2.png" },
  "karuppu-knights": { front: "/Jersey/black-front-v2.png", back: "/Jersey/black-back-v2.png" },
  "ivory-elites": { front: "/Jersey/ivory-front-v2.png", back: "/Jersey/ivory-back-v2.png" },
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
  const roster = S9_PLAYERS
    .filter((player) => player.teamId === team.id)
    .map((seededPlayer) => {
      const storedPlayer = playersState.data.find((player) => player.id === seededPlayer.id);
      return { ...seededPlayer, ...storedPlayer, jerseyNumber: seededPlayer.jerseyNumber };
    })
    .filter((player) => player.active);
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
        <div className="flex flex-col">
          <div className="perspective-1000 relative flex min-h-[480px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_48%),linear-gradient(145deg,var(--color-card),var(--color-muted))] p-5 shadow-xl sm:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-background/80 px-3 py-1.5 text-xs font-bold shadow-sm backdrop-blur-xl">
              <Sparkles className="size-3.5 text-primary" /> Official kit
            </div>
            {jerseys ? (
              <JerseyFlipping front={jerseys.front} back={jerseys.back} alt={team.name} />
            ) : null}
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
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-xs font-black tabular-nums text-primary transition-transform group-hover:scale-105">
                    {player.jerseyNumber === null ? "TBD" : `#${player.jerseyNumber}`}
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

  return (
    <button
      type="button"
      aria-label={`Show ${flipped ? "front" : "back"} of ${alt} jersey`}
      aria-pressed={flipped}
      className="group relative z-10 aspect-[4/5] h-[390px] max-h-[72vh] max-w-full cursor-pointer outline-none transition-transform duration-300 hover:scale-[1.025] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:h-[430px]"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped(!flipped)}
    >
      <span className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] bg-primary/15 opacity-50 blur-2xl transition-opacity group-hover:opacity-80" />
      <span
        className="preserve-3d absolute inset-0 rounded-2xl transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
      <span className="backface-hidden absolute inset-0 overflow-hidden rounded-2xl border border-black/10 bg-stone-100 shadow-2xl">
        <Image src={front} alt={`${alt} jersey front`} fill className="object-cover" priority sizes="(max-width: 640px) 82vw, 344px" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/15 via-transparent to-white/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </span>
      <span className="backface-hidden rotate-y-180 absolute inset-0 overflow-hidden rounded-2xl border border-black/10 bg-stone-100 shadow-2xl">
        <Image src={back} alt={`${alt} jersey back`} fill className="object-cover" priority sizes="(max-width: 640px) 82vw, 344px" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/15 via-transparent to-white/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </span>
      </span>
      <span className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border bg-background/90 px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur-xl">
        <Rotate3D className="size-3.5 text-primary transition-transform duration-500 group-hover:rotate-180" />
        {flipped ? "Showing back" : "Tap or hover to flip"}
      </span>
    </button>
  );
}
