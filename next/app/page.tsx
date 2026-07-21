import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Radio,
  ScrollText,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: Radio,
    title: "Live scoring",
    description: "One clear view for scores and match events across every supported sport.",
  },
  {
    icon: Trophy,
    title: "Tournament progress",
    description: "Fixtures, standings, brackets, and leaderboards stay connected.",
  },
  {
    icon: ScrollText,
    title: "Clear audit history",
    description: "Organizer actions remain visible and accountable throughout the event.",
  },
] as const;

export default function Home() {
  return (
    <main>
      <nav className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Sports Fiesta S9 home">
            <BrandLogo />
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#about" className="transition-colors hover:text-foreground">About</a>
          </div>
          <Button nativeButton={false} render={<Link href="/dashboard" />}>
            Open dashboard
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </nav>

      <section className="border-b">
        <div className="mx-auto grid min-h-[calc(100svh-8rem)] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex max-w-2xl flex-col items-start gap-6">
            <Badge variant="secondary">
              <ShieldCheck data-icon="inline-start" />
              Built for church tournaments
            </Badge>
            <div className="flex flex-col gap-4">
              <h1 className="text-5xl font-semibold leading-[1.05] tracking-normal text-balance sm:text-6xl lg:text-7xl">
                Sports Fiesta S9
              </h1>
              <p className="max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                A simple tournament workspace for organizers, teams, and spectators to follow every match from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button nativeButton={false} size="lg" render={<Link href="/dashboard" />}>
                View tournament
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button nativeButton={false} size="lg" variant="outline" render={<a href="#features" />}>
                Explore features
              </Button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2"><Check className="text-secondary" /> Live updates</span>
              <span className="inline-flex items-center gap-2"><Check className="text-secondary" /> Read-only spectator view</span>
              <span className="inline-flex items-center gap-2"><Check className="text-secondary" /> Multi-sport ready</span>
            </div>
          </div>

          <Card className="min-h-[430px] justify-center bg-muted/30 shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Tournament overview</CardTitle>
                  <CardDescription>Sports Fiesta S9</CardDescription>
                </div>
                <Badge variant="outline">Not started</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 items-center">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><CalendarDays /></EmptyMedia>
                  <EmptyTitle>The field is ready</EmptyTitle>
                  <EmptyDescription>
                    Fixtures and live scores will appear here when the tournament is configured.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="features" className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-medium text-primary">Everything in one place</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">Clear on match day. Calm behind the scenes.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="shadow-none">
                <CardHeader>
                  <span className="mb-3 grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon />
                  </span>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription className="leading-6">{description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="border-y">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="flex flex-col gap-3">
            <Badge className="w-fit" variant="outline">Why Sports Fiesta</Badge>
            <h2 className="text-3xl font-semibold tracking-normal">A shared source of truth for the whole community.</h2>
          </div>
          <div className="flex flex-col gap-5 text-base leading-7 text-muted-foreground">
            <p>
              Paper sheets, spreadsheets, and message threads make tournament information difficult to keep consistent. Sports Fiesta brings fixtures, scores, standings, player records, and organizer activity into one focused system.
            </p>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <span className="flex items-center gap-3"><Users className="text-secondary" /> Simple for every age group</span>
              <span className="flex items-center gap-3"><ShieldCheck className="text-secondary" /> Clear organizer access</span>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandLogo />
          <p className="text-sm text-muted-foreground">One tournament. One reliable view.</p>
        </div>
      </footer>
    </main>
  );
}
