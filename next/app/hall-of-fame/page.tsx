"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, Medal, ShieldCheck, Sparkles, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const cricketHonours = [
  { title: "Best Batsman", winners: [["S7", "Gladin Daniel"], ["S8", "Daniel Russel"]] },
  { title: "Best Bowler", winners: [["S7", "Robinson Samuel"], ["S8", "Patrick Joshua"]] },
  { title: "Female Cricketer", winners: [["S7", "Anita Ditto"], ["S8", "Suja Jebakumar"]] },
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

export default function HallOfFame() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-background pb-16 text-foreground sm:pb-24">
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
          className="relative mx-auto flex max-w-5xl flex-col items-center pt-8 text-center sm:pt-12"
        >
          <motion.div variants={entrance} className="mb-3 flex items-center gap-2 rounded-full border border-primary/25 bg-background/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" />
            Sports Fiesta honours
          </motion.div>
          <motion.h1 variants={entrance} className="max-w-3xl text-balance text-5xl font-black tracking-[-0.06em] sm:text-7xl lg:text-8xl">
            Hall of <span className="text-primary">Fame</span>
          </motion.h1>
          <motion.p variants={entrance} className="mt-5 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            The players and teams who turned great seasons into tournament history.
          </motion.p>

          <motion.div variants={entrance} className="relative mt-3 h-[17rem] w-full max-w-[22rem] sm:mt-1 sm:h-[23rem] sm:max-w-[30rem]">
            <div className="absolute inset-x-[19%] bottom-5 h-12 rounded-full bg-primary/35 blur-2xl" />
            <motion.div
              animate={{ rotateY: [0, 360] }}
              transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 [transform-style:preserve-3d] motion-reduce:animate-none"
            >
              <Image src="/hall-of-fame/champions-trophy.png" alt="Sports Fiesta championship trophy" fill priority sizes="(max-width: 640px) 352px, 480px" className="object-contain drop-shadow-[0_22px_20px_rgba(126,84,17,0.28)]" />
            </motion.div>
          </motion.div>
        </motion.section>

        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} transition={{ staggerChildren: 0.1 }} className="mx-auto mt-1 grid max-w-5xl gap-3 sm:grid-cols-3 sm:gap-5">
          {[
            ["Team of the Year", "The season's complete squad", "cup"],
            ["Football honours", "Individual excellence on the turf", "star"],
            ["Cricket honours", "Individual brilliance on the pitch", "star"],
          ].map(([title, description, type], index) => (
            <motion.div variants={entrance} key={title}>
              <Card className="group relative h-full overflow-hidden border-border/70 bg-card/85 shadow-lg backdrop-blur transition-transform duration-300 hover:-translate-y-1">
                <CardContent className="relative flex min-h-36 items-center gap-3 p-4 sm:min-h-44 sm:flex-col sm:justify-center sm:text-center sm:p-5">
                  <div className="relative size-24 shrink-0 sm:absolute sm:-right-3 sm:-top-7 sm:size-32 sm:opacity-90">
                    <Image src={type === "cup" ? "/hall-of-fame/champions-trophy.png" : "/hall-of-fame/individual-honours.png"} alt="" fill sizes="128px" className="object-contain transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
                  </div>
                  <div className="relative sm:mt-8">
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">Award 0{index + 1}</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight">{title}</h2>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:mt-16 lg:gap-8">
          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="overflow-hidden border-border/70 bg-card/90 shadow-xl">
              <CardHeader className="border-b bg-muted/40 p-5 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg"><Crown className="size-6" /></div>
                  <div><CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">Football legends</CardTitle><CardDescription className="mt-1">Champions who ruled the turf.</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {footballChampions.map(([season, year, winner]) => (
                  <div key={season} className="grid grid-cols-[4.8rem_1fr] items-center gap-3 border-b border-border/60 px-5 py-4 last:border-0 sm:grid-cols-[6.5rem_1fr] sm:px-7">
                    <div><p className="text-sm font-extrabold">{season.replace("Season ", "S")}</p><p className="text-xs text-muted-foreground">{year}</p></div>
                    <div className="flex items-center gap-3"><Trophy className="size-4 shrink-0 text-primary" /><p className="text-sm font-extrabold uppercase tracking-wide sm:text-base">{winner}</p></div>
                  </div>
                ))}
                <div className="grid grid-cols-[4.8rem_1fr] items-center gap-3 bg-primary/10 px-5 py-4 sm:grid-cols-[6.5rem_1fr] sm:px-7"><div><p className="text-sm font-black text-primary">S9</p><p className="text-xs text-muted-foreground">2026</p></div><div className="flex items-center gap-3"><Sparkles className="size-4 text-primary" /><p className="font-black text-primary">The next legend awaits</p></div></div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-border/70 bg-card/90 shadow-xl">
              <div className="pointer-events-none absolute -right-8 -top-12 size-56 rounded-full bg-primary/15 blur-3xl" />
              <CardHeader className="relative p-5 sm:p-7"><div className="flex items-center gap-3"><Medal className="size-6 text-primary" /><div><CardTitle className="text-2xl font-black tracking-tight">Cricket honours</CardTitle><CardDescription>Masters of their craft.</CardDescription></div></div></CardHeader>
              <CardContent className="relative grid gap-3 px-5 pb-5 sm:px-7 sm:pb-7">
                {cricketHonours.map((honour) => <div key={honour.title} className="rounded-2xl border border-border/70 bg-background/60 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-extrabold">{honour.title}</h3><ShieldCheck className="size-4 text-primary" /></div><div className="mt-3 flex flex-col gap-2">{honour.winners.map(([season, winner]) => <div key={season} className="flex items-center justify-between gap-2 text-sm"><Badge variant="secondary" className="rounded-full px-2 py-0.5 font-bold">{season}</Badge><span className="font-semibold text-muted-foreground">{winner}</span></div>)}</div></div>)}
              </CardContent>
            </Card>
          </section>

          <Card className="overflow-hidden border-border/70 bg-card/90 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b bg-muted/40 p-5 sm:p-7"><div><CardTitle className="text-2xl font-black tracking-tight sm:text-3xl">Team of the Year</CardTitle><CardDescription className="mt-1">The squads that made a season their own.</CardDescription></div><Star className="size-7 shrink-0 fill-primary text-primary" /></CardHeader>
            <CardContent className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7">
              {[{ season: "Season 7", team: "Divine Knights", src: "/TOTY/season7.png" }, { season: "Season 8", team: "Sapphire Strikers", src: "/TOTY/seaasn8.png" }].map((team) => <article key={team.season} className="group overflow-hidden rounded-3xl border border-border bg-background"><div className="relative aspect-[4/3] overflow-hidden"><Image src={team.src} alt={`${team.season} Team of the Year — ${team.team}`} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">{team.season}</p><h3 className="mt-1 text-2xl font-black">{team.team}</h3></div></div></article>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
