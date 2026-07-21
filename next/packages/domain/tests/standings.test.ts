import { describe, expect, it } from "vitest";
import { calculateOverallStandings, rankFieldStandings } from "../src/standings";

describe("standings", () => {
  it("ranks field sports by wins, goal difference, then goals for", () => {
    const rows = rankFieldStandings([
      { teamId: "red", played: 3, wins: 2, draws: 0, losses: 1, goalsFor: 5, goalsAgainst: 3 },
      { teamId: "green", played: 3, wins: 2, draws: 0, losses: 1, goalsFor: 7, goalsAgainst: 4 },
    ]);

    expect(rows.map((row) => row.teamId)).toEqual(["green", "red"]);
  });

  it("combines placement awards and discipline adjustments", () => {
    const standings = calculateOverallStandings(
      ["red", "green"],
      [
        { teamId: "red", sport: "football", place: 1 },
        { teamId: "green", sport: "football", place: 2 },
      ],
      { football: [10, 5, 3, 1], cricket: [10, 5, 3, 1], handball: [10, 5, 3, 1] },
      [{ teamId: "green", points: -2 }],
    );

    expect(standings).toEqual([
      expect.objectContaining({ teamId: "red", total: 10 }),
      expect.objectContaining({ teamId: "green", total: 3 }),
    ]);
  });
});
