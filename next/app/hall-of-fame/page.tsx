"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Medal, ShieldCheck, Sparkles, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const cricketHonours = [
  { title: "Best Batsman", winners: [["S7", "Gladin Daniel"], ["S8", "Daniel Russel"]] },
  { title: "Best Bowler", winners: [["S7", "Robinson Samuel"], ["S8", "Patrick Joshua"]] },
  { title: "Female Cricketer of the Year", winners: [["Season 7", "Anita Ditto"], ["Season 8", "Suja Jebakumar"]] },
];

const individualTrophies = [
  { title: "Best Bowler", detail: "Cricket's wicket-taking specialists", src: "/hall-of-fame/best-bowler.png" },
  { title: "Best Footballer", detail: "Football's finest performers", src: "/hall-of-fame/best-footballer.png" },
  { title: "Best Batsman", detail: "Cricket's run-making masters", src: "/hall-of-fame/best-batsman.png" },
];

const footballChampions = [
  ["Season 3", "2019", "Daniel Russel Paul"],
  ["Season 4", "2021", "Daniel Russel Paul"],
  ["Season 5", "2022", "Patrick Joshua"],
  ["Season 6", "2023", "Sheldon Benson"],
  ["Season 7", "2024", "Glen Gladin"],
  ["Season 8", "2025", "Jagdish"],
];

const entrance = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } };

function AwardBurst({ burstKey }: { burstKey: number }) {
  const glints = ["left-1/2 top-1/2", "left-[24%] top-[30%]", "right-[22%] top-[28%]", "left-[29%] bottom-[23%]", "right-[27%] bottom-[20%]"];

  return (
    <div key={burstKey} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div initial={{ opacity: 0.75, scale: 0.25 }} animate={{ opacity: [0.7, 0.3, 0], scale: [0.25, 1.25, 1.65] }} transition={{ duration: 0.85, ease: "easeOut" }} className="absolute inset-[17%] rounded-full border-2 border-primary/70" />
      {glints.map((position, index) => (
        <motion.div key={position} initial={{ opacity: 0, scale: 0.2, x: 0, y: 0 }} animate={{ opacity: [0, 1, 0], scale: [0.2, 1, 0.3], x: [0, (index - 2) * 13], y: [0, -20 - index * 4] }} transition={{ duration: 0.7, delay: index * 0.035, ease: "easeOut" }} className={`absolute ${position} text-primary`}>
          <Sparkles className="size-4 fill-primary" />
        </motion.div>
      ))}
    </div>
  );
}

export default function HallOfFame() {
  const [celebratingTrophy, setCelebratingTrophy] = useState<string | null>(null);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function celebrate(title: string) {
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    setCelebratingTrophy(title);
    setCelebrationKey((key) => key + 1);
    celebrationTimer.current = setTimeout(() => setCelebratingTrophy(null), 900);
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-background pb-10 text-foreground sm:pb-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[41rem] bg-[radial-gradient(circle_at_50%_12%,color-mix(in_oklch,var(--primary)_21%,transparent),transparent_46%),linear-gradient(180deg,color-mix(in_oklch,var(--muted)_85%,transparent),transparent)]" />
      <div className="pointer-events-none absolute left-[-14rem] top-[30rem] size-[34rem] rounded-full bg-primary/10 blur-[130px]" />
      <div className="pointer-events-none absolute right-[-16rem] top-[50rem] size-[34rem] rounded-full bg-secondary/10 blur-[140px]" />

      <div className="relative mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">
        <Link href="/" className="inline-flex">
          <Button variant="ghost" className="rounded-full px-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft data-icon="inline-start" />
            Back to Sports Fiesta
          </Button>
        </Link>

        <motion.section
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1 }}
          className="relative mx-auto flex max-w-5xl flex-col items-center pt-5 text-center sm:pt-7"
        >
          <motion.div variants={entrance} className="mb-2 flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" />
            Sports Fiesta honours
          </motion.div>
          <motion.h1 variants={entrance} className="max-w-3xl text-balance text-4xl font-black tracking-[-0.06em] sm:text-6xl lg:text-7xl">
            Hall of <span className="text-primary">Fame</span>
          </motion.h1>
          <motion.p variants={entrance} className="mt-3 max-w-xl text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
            The players and teams who turned great seasons into tournament history.
          </motion.p>

          <motion.button type="button" variants={entrance} onClick={() => celebrate("Team of the Year")} whileTap={{ scale: 0.98 }} className="relative mt-1 h-[15rem] w-full max-w-[20rem] cursor-pointer [perspective:1200px] sm:h-[20rem] sm:max-w-[27rem]" aria-label="Celebrate Team of the Year trophy">
            <motion.div animate={{ scale: [0.88, 1.08, 0.88], opacity: [0.35, 0.7, 0.35] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-x-[19%] bottom-7 h-10 rounded-full bg-primary/40 blur-2xl" />
            <motion.div
              key={`team-trophy-${celebrationKey}`}
              animate={celebratingTrophy === "Team of the Year" ? { rotateY: [-18, 22, -12, 0], rotateX: [-4, 7, -3, 0], y: [0, -16, 3, 0], scale: [1, 1.1, 1] } : { rotateY: [-16, 16, -16], rotateX: [-4, 3, -4], y: [0, -7, 0] }}
              transition={celebratingTrophy === "Team of the Year" ? { duration: 0.9, ease: "easeOut" } : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 [transform-style:preserve-3d] motion-reduce:animate-none"
            >
              <Image src="/hall-of-fame/champions-trophy.png" alt="Team of the Year trophy" fill priority sizes="(max-width: 640px) 384px, 544px" className="object-contain drop-shadow-[0_22px_20px_rgba(126,84,17,0.28)]" />
            </motion.div>
            {celebratingTrophy === "Team of the Year" && <AwardBurst burstKey={celebrationKey} />}
          </motion.button>
        </motion.section>

        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} transition={{ staggerChildren: 0.1 }} className="mx-auto mt-2 max-w-5xl">
          <motion.div variants={entrance} className="mx-auto max-w-lg text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">The highest team honour</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Team of the Year</h2>
            <p className="mt-2 text-sm text-muted-foreground">The trophy at the centre of every unforgettable season.</p>
          </motion.div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {individualTrophies.map((trophy, index) => (
              <motion.button type="button" variants={entrance} key={trophy.title} onClick={() => celebrate(trophy.title)} whileTap={{ scale: 0.94, rotate: -2 }} className="group relative block w-full cursor-pointer text-left" aria-label={`Celebrate ${trophy.title} trophy`}>
                <Card className="relative h-full overflow-hidden border-border/70 bg-card/85 shadow-lg backdrop-blur transition-transform duration-300 group-hover:-translate-y-1">
                  <CardContent className="relative flex min-h-44 flex-col items-center p-3 text-center sm:min-h-52 sm:p-4">
                    <motion.div key={`${trophy.title}-${celebrationKey}`} animate={celebratingTrophy === trophy.title ? { scale: [1, 1.16, 0.98, 1], rotateY: [0, -20, 16, 0], y: [0, -13, 2, 0] } : {}} transition={{ duration: 0.78, ease: "easeOut" }} className="relative h-28 w-full [perspective:800px] sm:h-32">
                      <Image src={trophy.src} alt={`${trophy.title} trophy`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-contain transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3" />
                      {celebratingTrophy === trophy.title && <AwardBurst burstKey={celebrationKey} />}
                    </motion.div>
                    <div className="relative mt-auto">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Individual honour 0{index + 1}</p>
                      <h2 className="mt-1 text-xl font-black tracking-tight">{trophy.title}</h2>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">{trophy.detail}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.button>
            ))}
          </div>
        </motion.section>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:mt-10 sm:gap-5">
          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="overflow-hidden border-border/70 bg-card/90 shadow-xl">
              <CardHeader className="border-b bg-muted/40 p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg"><Crown className="size-6" /></div>
                  <div><CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">Best Footballer</CardTitle><CardDescription className="mt-1">The footballers who ruled the turf.</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {footballChampions.map(([season, year, winner]) => (
                  <div key={season} className="grid grid-cols-[4.8rem_1fr] items-center gap-3 border-b border-border/60 px-4 py-3 last:border-0 sm:grid-cols-[6.5rem_1fr] sm:px-5">
                    <div><p className="text-sm font-extrabold">{season.replace("Season ", "S")}</p><p className="text-xs text-muted-foreground">{year}</p></div>
                    <div className="flex items-center gap-3"><Trophy className="size-4 shrink-0 text-primary" /><p className="text-sm font-extrabold uppercase tracking-wide sm:text-base">{winner}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/70 bg-card/90 shadow-xl">
              <div className="pointer-events-none absolute -right-8 -top-12 size-56 rounded-full bg-primary/15 blur-3xl" />
              <CardHeader className="relative p-4 sm:p-5"><div className="flex items-center gap-3"><Medal className="size-6 text-primary" /><div><CardTitle className="text-2xl font-black tracking-tight">Cricket honours</CardTitle><CardDescription>Masters of their craft.</CardDescription></div></div></CardHeader>
              <CardContent className="relative grid gap-2 px-4 pb-4 sm:px-5 sm:pb-5">
                {cricketHonours.map((honour) => <div key={honour.title} className="rounded-2xl border border-border/70 bg-background/60 p-3"><div className="flex items-center justify-between gap-3"><h3 className="font-extrabold">{honour.title}</h3><ShieldCheck className="size-4 text-primary" /></div><div className="mt-2 flex flex-col gap-1.5">{honour.winners.map(([season, winner]) => <div key={season} className="flex items-center justify-between gap-2 text-sm"><Badge variant="secondary" className="rounded-full px-2 py-0.5 font-bold">{season}</Badge><span className="font-semibold text-muted-foreground">{winner}</span></div>)}</div></div>)}
              </CardContent>
            </Card>
          </section>

          <Card className="overflow-hidden border-border/70 bg-card/90 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b bg-muted/40 p-4 sm:p-5"><div><CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">Team of the Year</CardTitle><CardDescription className="mt-1">The squads that made a season their own.</CardDescription></div><Star className="size-7 shrink-0 fill-primary text-primary" /></CardHeader>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
              {[{ season: "Season 7", team: "Divine Knights", src: "/TOTY/season7.png" }, { season: "Season 8", team: "Sapphire Strikers", src: "/TOTY/seaasn8.png" }].map((team) => <article key={team.season} className="group overflow-hidden rounded-3xl border border-border bg-background"><div className="relative aspect-[4/3] overflow-hidden"><Image src={team.src} alt={`${team.season} Team of the Year — ${team.team}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">{team.season}</p><h3 className="mt-1 text-2xl font-black">{team.team}</h3></div></div></article>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
