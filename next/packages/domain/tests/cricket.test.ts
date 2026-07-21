import { describe, expect, it } from "vitest";
import {
  cricketInningsMetrics,
  createCricketInnings,
  fallOfWickets,
  recalculateCricketInnings,
  recordCricketDelivery,
  setCricketBowler,
  setNextBatter,
} from "../src/cricket";

const lineup = ["a", "b", "c", "d", "e", "f"];

function innings() {
  return createCricketInnings({
    battingTeamId: "red",
    bowlingTeamId: "green",
    lineup,
    strikerId: "a",
    nonStrikerId: "b",
    bowlerId: "g1",
  });
}

describe("five-over cricket scoring", () => {
  it("records runs, boundaries, and a legal delivery", () => {
    const next = recordCricketDelivery(innings(), { runsOffBat: 6 });

    expect(next.score).toBe(6);
    expect(next.legalBalls).toBe(1);
    expect(next.batters.a).toMatchObject({ runs: 6, balls: 1, sixes: 1 });
  });

  it("rotates strike on odd completed runs", () => {
    const next = recordCricketDelivery(innings(), { runsOffBat: 1 });

    expect(next.strikerId).toBe("b");
    expect(next.nonStrikerId).toBe("a");
  });

  it("does not count a wide as a legal ball", () => {
    const next = recordCricketDelivery(innings(), {
      runsOffBat: 0,
      extraType: "wide",
      extraRuns: 1,
    });

    expect(next.score).toBe(1);
    expect(next.legalBalls).toBe(0);
    expect(next.extras.wides).toBe(1);
  });

  it("sets and carries a free hit after a no-ball", () => {
    const noBall = recordCricketDelivery(innings(), {
      runsOffBat: 4,
      extraType: "no-ball",
      extraRuns: 1,
    });
    const wide = recordCricketDelivery(noBall, {
      runsOffBat: 0,
      extraType: "wide",
      extraRuns: 1,
    });
    const legal = recordCricketDelivery(wide, { runsOffBat: 0 });

    expect(noBall.score).toBe(5);
    expect(noBall.freeHit).toBe(true);
    expect(wide.freeHit).toBe(true);
    expect(legal.freeHit).toBe(false);
  });

  it("does not count a no-ball as a ball faced", () => {
    const next = recordCricketDelivery(innings(), {
      runsOffBat: 4,
      extraType: "no-ball",
      extraRuns: 1,
    });

    expect(next.batters.a).toMatchObject({ runs: 4, balls: 0, fours: 1 });
    expect(next.bowlers.g1).toMatchObject({ legalBalls: 0, runs: 5, noBalls: 1 });
  });

  it("finishes an over, swaps ends, and requires a new bowler", () => {
    let state = innings();
    for (let ball = 0; ball < 6; ball += 1) {
      state = recordCricketDelivery(state, { runsOffBat: 0 });
    }

    expect(state.overs).toBe("1.0");
    expect(state.strikerId).toBe("b");
    expect(state.currentBowlerId).toBeNull();
    expect(() => setCricketBowler(state, "g1")).toThrow(/consecutive overs/i);
    expect(setCricketBowler(state, "g2").currentBowlerId).toBe("g2");
  });

  it("credits a maiden when a bowler completes a scoreless over", () => {
    let state = innings();
    for (let ball = 0; ball < 6; ball += 1) {
      state = recordCricketDelivery(state, { runsOffBat: 0 });
    }

    expect(state.bowlers.g1.maidens).toBe(1);
  });

  it("requires a replacement batter after a wicket", () => {
    const wicket = recordCricketDelivery(innings(), {
      runsOffBat: 0,
      dismissal: { type: "bowled", playerOutId: "a" },
    });

    expect(wicket.wickets).toBe(1);
    expect(wicket.strikerId).toBeNull();
    expect(() => recordCricketDelivery(wicket, { runsOffBat: 1 })).toThrow(/next batter/i);
    expect(setNextBatter(wicket, "c").strikerId).toBe("c");
  });

  it("derives fall of wickets with the score and over at dismissal time", () => {
    let state = recordCricketDelivery(innings(), { runsOffBat: 4 });
    state = recordCricketDelivery(state, {
      runsOffBat: 0,
      dismissal: { type: "bowled", playerOutId: "a" },
    });

    expect(fallOfWickets(state)).toEqual([
      { wicket: 1, score: 4, over: "0.2", playerOutId: "a" },
    ]);
  });

  it("ends an innings after five completed overs", () => {
    let state = innings();
    for (let ball = 1; ball <= 30; ball += 1) {
      if (state.currentBowlerId === null) {
        state = setCricketBowler(state, ball % 12 === 7 ? "g2" : "g1");
      }
      state = recordCricketDelivery(state, { runsOffBat: 0 });
    }

    expect(state.legalBalls).toBe(30);
    expect(state.completed).toBe(true);
  });

  it("recalculates a corrected scorecard from stored deliveries", () => {
    const initial = {
      battingTeamId: "red",
      bowlingTeamId: "green",
      lineup,
      strikerId: "a",
      nonStrikerId: "b",
      bowlerId: "g1",
    };
    const corrected = recalculateCricketInnings(initial, [
      { runsOffBat: 4 },
      { runsOffBat: 1 },
      { runsOffBat: 0 },
    ]);

    expect(corrected.score).toBe(5);
    expect(corrected.legalBalls).toBe(3);
    expect(corrected.strikerId).toBe("b");
  });

  it("derives run rate and chase requirements", () => {
    let state = innings();
    state = recordCricketDelivery(state, { runsOffBat: 4 });
    state = recordCricketDelivery(state, { runsOffBat: 2 });

    expect(cricketInningsMetrics(state, 31)).toEqual({
      runRate: 18,
      target: 31,
      runsRequired: 25,
      ballsRemaining: 28,
      requiredRunRate: 5.36,
    });
  });
});
