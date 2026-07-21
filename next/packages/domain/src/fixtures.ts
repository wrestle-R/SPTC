export type SportKey = "football" | "handball" | "cricket";
export type MatchStatus = "scheduled" | "lineup" | "live" | "innings-break" | "completed";

export interface FixtureInput {
  sport: SportKey;
  homeTeamId: string;
  awayTeamId: string;
  stage?: "league" | "semifinal" | "final";
  maxOvers?: number;
}

const MATCH_PREFIX: Record<SportKey, string> = {
  cricket: "CR",
  football: "FB",
  handball: "HB",
};

export function nextMatchNumber(sport: SportKey, existing: readonly string[]) {
  const prefix = MATCH_PREFIX[sport];
  const highest = existing.reduce((max, value) => {
    const match = new RegExp(`^${prefix}-(\\d{3,})$`).exec(value);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(3, "0")}`;
}

export function validateFixture(input: FixtureInput) {
  if (input.homeTeamId === input.awayTeamId) throw new Error("Choose two different teams.");
  if (input.sport === "cricket" && (input.maxOvers ?? 5) !== 5) {
    throw new Error("Sports Fiesta cricket fixtures use five overs.");
  }
  return {
    ...input,
    stage: input.stage ?? "league",
    maxOvers: input.sport === "cricket" ? 5 : undefined,
    status: "scheduled" as MatchStatus,
  };
}
