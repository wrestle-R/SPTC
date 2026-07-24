import { describe, expect, it } from "vitest";
import {
  calculateLeagueBonusByTeam,
  isEarlyBirdLocalTime,
  parseLocalDateTimeInput,
  timelyArrivalPointsForPosition,
} from "./bonus-scoring";

describe("bonus scoring", () => {
  it("maps timely arrival positions to the configured points", () => {
    expect(timelyArrivalPointsForPosition(1)).toBe(100);
    expect(timelyArrivalPointsForPosition(2)).toBe(60);
    expect(timelyArrivalPointsForPosition(3)).toBe(40);
    expect(timelyArrivalPointsForPosition(4)).toBe(20);
  });

  it("treats 2:29 PM as eligible and 2:30 PM as late for early bird", () => {
    expect(isEarlyBirdLocalTime("2026-07-23T14:29")).toBe(true);
    expect(isEarlyBirdLocalTime("2026-07-23T14:30")).toBe(false);
  });

  it("converts local datetime input into an ISO timestamp", () => {
    expect(parseLocalDateTimeInput("2026-07-23T14:05").isoString).toBe("2026-07-23T08:35:00.000Z");
  });

  it("builds league win and tie bonus totals from sport standings", () => {
    const totals = calculateLeagueBonusByTeam(
      ["red", "blue"],
      {
        football: [
          { rank: 1, teamId: "red", played: 3, wins: 2, draws: 1, losses: 0, goalsFor: 6, goalsAgainst: 2, goalDifference: 4, points: 7 },
          { rank: 2, teamId: "blue", played: 3, wins: 1, draws: 0, losses: 2, goalsFor: 3, goalsAgainst: 5, goalDifference: -2, points: 3 },
        ],
        handball: [
          { rank: 1, teamId: "red", played: 2, wins: 1, draws: 0, losses: 1, goalsFor: 5, goalsAgainst: 4, goalDifference: 1, points: 3 },
          { rank: 2, teamId: "blue", played: 2, wins: 0, draws: 0, losses: 2, goalsFor: 2, goalsAgainst: 7, goalDifference: -5, points: 0 },
        ],
        cricket: [
          { rank: 1, teamId: "red", played: 2, wins: 1, ties: 1, losses: 0, points: 3, netRunRate: 1.25 },
          { rank: 2, teamId: "blue", played: 2, wins: 1, ties: 0, losses: 1, points: 2, netRunRate: 0.1 },
        ],
        throwball: [
          { rank: 1, teamId: "red", played: 2, wins: 2, losses: 0, setsFor: 2, setsAgainst: 0, setDifference: 2, pointsFor: 22, pointsAgainst: 15, pointDifference: 7, points: 6 },
          { rank: 2, teamId: "blue", played: 2, wins: 1, losses: 1, setsFor: 1, setsAgainst: 1, setDifference: 0, pointsFor: 19, pointsAgainst: 20, pointDifference: -1, points: 3 },
        ],
      },
    );

    expect(totals.red).toEqual({ leagueWin: 17, leagueTie: 2 });
    expect(totals.blue).toEqual({ leagueWin: 8, leagueTie: 0 });
  });
});
