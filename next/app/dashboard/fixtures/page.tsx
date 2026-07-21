import { CalendarClock, CircleDot, Hand } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getFixturesBySport,
  tournamentFixtures,
  type TournamentFixture,
} from "@/lib/tournament-fixtures";

const sportSections = [
  { name: "Football", icon: CircleDot },
  { name: "Handball", icon: Hand },
] as const;

export default function FixturesPage() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Fixtures"
          description="Every team plays each other once in the Football and Handball group stages."
        />
        <Badge variant="secondary" className="w-fit">{tournamentFixtures.length} fixtures</Badge>
      </div>

      <div className="flex flex-col gap-10">
        {sportSections.map(({ name, icon: Icon }) => {
          const fixtures = getFixturesBySport(name);

          return (
            <section key={name} className="flex flex-col gap-4" aria-labelledby={`${name.toLowerCase()}-fixtures`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon />
                  </span>
                  <div>
                    <h2 id={`${name.toLowerCase()}-fixtures`} className="text-lg font-semibold">{name}</h2>
                    <p className="text-sm text-muted-foreground">Group stage</p>
                  </div>
                </div>
                <Badge variant="outline">{fixtures.length} matches</Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {fixtures.map((fixture) => <FixtureCard key={fixture.id} fixture={fixture} />)}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function FixtureCard({ fixture }: { fixture: TournamentFixture }) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>Match {String(fixture.matchNumber).padStart(2, "0")}</CardDescription>
            <CardTitle className="mt-1">{fixture.teamA.name} vs {fixture.teamB.name}</CardTitle>
          </div>
          <Badge variant="outline">Upcoming</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p className="font-medium">{fixture.teamA.name}</p>
          <span className="text-xs font-medium text-muted-foreground">VS</span>
          <p className="text-right font-medium">{fixture.teamB.name}</p>
        </div>
        <Separator />
        <p className="text-sm text-muted-foreground">{fixture.stage}</p>
      </CardContent>
      <CardFooter className="gap-2 text-xs text-muted-foreground">
        <CalendarClock />
        Date, time, and venue to be confirmed
      </CardFooter>
    </Card>
  );
}
