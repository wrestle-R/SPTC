import { describe, expect, it } from "vitest";
import { nextMatchNumber, validateFixture } from "../src/fixtures";

describe("fixtures", () => {
  it.each([
    ["cricket", "CR-003"],
    ["football", "FB-003"],
    ["handball", "HB-003"],
  ] as const)("generates the next %s match number", (sport, expected) => {
    expect(nextMatchNumber(sport, [`${expected.slice(0, 3)}001`, `${expected.slice(0, 3)}002`])).toBe(expected);
  });

  it("ignores unrelated or malformed match numbers", () => {
    expect(nextMatchNumber("cricket", ["FB-100", "CR-bad", "CR-009"])).toBe("CR-010");
  });

  it("creates a scheduled fixture without date, time, or venue", () => {
    expect(validateFixture({ sport: "football", homeTeamId: "red", awayTeamId: "green", stage: "semifinal" })).toEqual({
      sport: "football",
      homeTeamId: "red",
      awayTeamId: "green",
      stage: "semifinal",
      maxOvers: undefined,
      status: "scheduled",
    });
  });
});
