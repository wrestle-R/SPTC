export type SportKey = "football" | "handball" | "cricket";
export type MatchStatus = "scheduled" | "lineup" | "live" | "innings-break" | "completed";

export interface FixtureInput {
  sport: SportKey;
  homeTeamId: string;
  awayTeamId: string;
  startsAt: string;
  venue: string;
  stage?: "league" | "semifinal" | "final";
  maxOvers?: number;
}

export function validateFixture(input: FixtureInput) {
  if (input.homeTeamId === input.awayTeamId) throw new Error("Choose two different teams.");
  if (!input.venue.trim()) throw new Error("Venue is required.");
  if (Number.isNaN(Date.parse(input.startsAt))) throw new Error("A valid fixture date is required.");
  if (input.sport === "cricket" && (input.maxOvers ?? 5) !== 5) {
    throw new Error("Sports Fiesta S9 cricket fixtures use five overs.");
  }
  return {
    ...input,
    stage: input.stage ?? "league",
    maxOvers: input.sport === "cricket" ? 5 : undefined,
    status: "scheduled" as MatchStatus,
  };
}
