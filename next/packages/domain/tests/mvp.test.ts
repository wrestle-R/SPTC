import { describe, expect, it } from "vitest";
import { calculateMvpScore, rankCricketMvpCandidates, rankFieldMvpCandidates, rankThrowballMvpCandidates } from "../src/mvp";

describe("MVP scoring", () => {
  it("uses the published fielding weights and winner impact bonus", () => {
    const result = calculateMvpScore({
      catches: 1,
      directRunOuts: 1,
      assistedRunOuts: 1,
      stumpings: 1,
      assists: 1,
      matchImpact: true,
    });

    expect(result.fielding).toBe(50);
    expect(result.impact).toBe(10);
    expect(result.total).toBe(60);
  });

  it("ranks field-sport MOTM by goals only", () => {
    const [leader, second] = rankFieldMvpCandidates([
      { playerId: "p1", teamId: "red", goals: 2, winner: true, goalsConceded: 1 },
      { playerId: "p2", teamId: "red", goals: 0, winner: true, goalsConceded: 0 },
    ]);

    expect(leader.playerId).toBe("p1");
    expect(leader.total).toBe(70);
    expect(leader.reason).toBe("2 goals");
    expect(second.total).toBe(0);
    expect(second.reason).toBe("No goals scored");
  });

  it("ranks cricket all-round impact above one-dimensional efforts", () => {
    const [leader] = rankCricketMvpCandidates([
      { playerId: "p1", teamId: "red", runs: 20, balls: 12, winner: true },
      { playerId: "p2", teamId: "red", runs: 12, balls: 8, wickets: 2, bowlingBalls: 12, bowlingRuns: 9, catches: 1, winner: true },
    ]);

    expect(leader.playerId).toBe("p2");
  });

  it("ranks throwball players by player score with winner impact", () => {
    const [leader] = rankThrowballMvpCandidates([
      { playerId: "p1", teamId: "red", successfulAttacks: 3, ballsThrownOut: 1, droppedCatches: 0, playerScore: 5, winner: false },
      { playerId: "p2", teamId: "green", successfulAttacks: 2, ballsThrownOut: 0, droppedCatches: 0, playerScore: 4, winner: true },
    ]);

    expect(leader.playerId).toBe("p2");
    expect(leader.total).toBe(9);
  });
});
