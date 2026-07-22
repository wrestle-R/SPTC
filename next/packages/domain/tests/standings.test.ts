import { describe, expect, it } from "vitest";
import { calculateOverallStandings, rankFieldStandings, rankOverallStandings, rankThrowballStandings } from "../src/standings";

describe("standings", () => {
  it("ranks field sports by wins, goal difference, then goals for", () => {
    const rows = rankFieldStandings([
      { teamId: "red", played: 3, wins: 2, draws: 0, losses: 1, goalsFor: 5, goalsAgainst: 3 },
      { teamId: "green", played: 3, wins: 2, draws: 0, losses: 1, goalsFor: 7, goalsAgainst: 4 },
    ]);

    expect(rows.map((row) => row.teamId)).toEqual(["green", "red"]);
  });

  it("combines sport placement awards without discipline adjustments", () => {
    const standings = calculateOverallStandings(
      ["red", "green"],
      [
        { teamId: "red", sport: "football", place: 1 },
        { teamId: "green", sport: "football", place: 2 },
      ],
      { football: [10, 5, 3, 1], cricket: [10, 5, 3, 1], handball: [10, 5, 3, 1] },
    );

    expect(standings).toEqual([
      expect.objectContaining({ teamId: "red", total: 10 }),
      expect.objectContaining({ teamId: "green", total: 5 }),
    ]);
    expect(standings.every((row) => !("disciplinePoints" in row))).toBe(true);
  });

  it("ranks overall standings using sport placements only", () => {
    const standings = rankOverallStandings([
      { teamId: "red", sportPlacements: { football: 2, cricket: 1 } },
      { teamId: "green", sportPlacements: { football: 1, cricket: 3 } },
    ]);

    expect(standings[0]).toMatchObject({ teamId: "red", sportPoints: 15, totalPoints: 15 });
    expect(standings.every((row) => !("disciplineAdjustment" in row))).toBe(true);
  });

  it("ranks throwball standings by wins, then set and point difference", () => {
    const standings = rankThrowballStandings([
      { teamId: "red", played: 2, wins: 1, losses: 1, setsFor: 3, setsAgainst: 2, pointsFor: 33, pointsAgainst: 30 },
      { teamId: "green", played: 2, wins: 1, losses: 1, setsFor: 3, setsAgainst: 2, pointsFor: 35, pointsAgainst: 31 },
    ]);

    expect(standings[0].teamId).toBe("green");
    expect(standings[0].points).toBe(3);
  });
});
