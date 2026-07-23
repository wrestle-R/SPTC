import { describe, expect, it } from "vitest";
import {
  cricketChaseText,
  cricketInningsMetrics,
  cricketResultText,
  createCricketInnings,
  fallOfWickets,
  recalculateCricketInnings,
  recordCricketDelivery,
  setCricketBowler,
  setNextBatter,
} from "../src/cricket";

const battingOrder = ["a", "b", "c", "d", "e", "f"];

function innings() {
  return createCricketInnings({
    battingTeamId: "red",
    bowlingTeamId: "green",
    battingLineup: battingOrder,
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

  it("puts the surviving non-striker on strike after a wicket on the last ball of the over", () => {
    let state = innings();
    for (let ball = 0; ball < 5; ball += 1) {
      state = recordCricketDelivery(state, { runsOffBat: 0 });
    }
    state = recordCricketDelivery(state, {
      runsOffBat: 0,
      dismissal: { type: "bowled", playerOutId: state.strikerId },
    });

    expect(state.legalBalls).toBe(6);
    expect(state.strikerId).toBeNull();
    expect(state.nonStrikerId).toBe("b");

    const next = setNextBatter(state, "c");
    expect(next.strikerId).toBe("b");
    expect(next.nonStrikerId).toBe("c");
  });

  it("records a no-ball run-out without counting a ball", () => {
    const next = recordCricketDelivery(innings(), {
      runsOffBat: 1,
      extraType: "no-ball",
      extraRuns: 1,
      dismissal: { type: "run-out", playerOutId: "b", fielderId: "g2" },
    });

    expect(next.score).toBe(2);
    expect(next.legalBalls).toBe(0);
    expect(next.wickets).toBe(1);
    expect(next.extras.noBalls).toBe(1);
    expect(next.batters.a).toMatchObject({ runs: 1, balls: 0 });
    expect(next.batters.b.dismissal).toMatchObject({ type: "run-out", playerOutId: "b" });
    expect(next.bowlers.g1).toMatchObject({ legalBalls: 0, runs: 2, wickets: 0, noBalls: 1 });
  });

  it("records completed runs and a run-out on the same legal ball", () => {
    const next = recordCricketDelivery(innings(), {
      runsOffBat: 1,
      dismissal: { type: "run-out", playerOutId: "b", fielderId: "g2" },
    });

    expect(next.score).toBe(1);
    expect(next.legalBalls).toBe(1);
    expect(next.wickets).toBe(1);
    expect(next.batters.a).toMatchObject({ runs: 1, balls: 1, singles: 1 });
    expect(next.batters.b.dismissal).toMatchObject({ type: "run-out", playerOutId: "b" });
    expect(next.bowlers.g1).toMatchObject({ legalBalls: 1, runs: 1, wickets: 0 });
  });

  it("lets the surviving non-striker face next ball after the striker is run out short", () => {
    const next = recordCricketDelivery(innings(), {
      runsOffBat: 0,
      dismissal: { type: "run-out", playerOutId: "a", fielderId: "g2" },
      nextStrikerId: "b",
      replacementBatterId: "c",
    });

    expect(next.legalBalls).toBe(1);
    expect(next.score).toBe(0);
    expect(next.strikerId).toBe("b");
    expect(next.nonStrikerId).toBe("c");
    expect(next.batters.c).toMatchObject({ runs: 0, balls: 0 });
  });

  it("lets the incoming batter face next ball after an odd-run striker run-out", () => {
    const next = recordCricketDelivery(innings(), {
      runsOffBat: 1,
      dismissal: { type: "run-out", playerOutId: "a", fielderId: "g2" },
      nextStrikerId: "c",
      replacementBatterId: "c",
    });

    expect(next.score).toBe(1);
    expect(next.legalBalls).toBe(1);
    expect(next.strikerId).toBe("c");
    expect(next.nonStrikerId).toBe("b");
  });

  it("resolves a non-striker run-out with the replacement batter in the same delivery", () => {
    const next = recordCricketDelivery(innings(), {
      runsOffBat: 2,
      dismissal: { type: "run-out", playerOutId: "b", fielderId: "g2" },
      nextStrikerId: "c",
      replacementBatterId: "c",
    });

    expect(next.score).toBe(2);
    expect(next.legalBalls).toBe(1);
    expect(next.strikerId).toBe("c");
    expect(next.nonStrikerId).toBe("a");
  });

  it("records a no-ball run-out with an explicit next striker without counting a ball", () => {
    const next = recordCricketDelivery(innings(), {
      runsOffBat: 1,
      extraType: "no-ball",
      extraRuns: 1,
      dismissal: { type: "run-out", playerOutId: "a", fielderId: "g2" },
      nextStrikerId: "c",
      replacementBatterId: "c",
    });

    expect(next.score).toBe(2);
    expect(next.legalBalls).toBe(0);
    expect(next.strikerId).toBe("c");
    expect(next.nonStrikerId).toBe("b");
  });

  it("rejects inconsistent explicit run-out resolution data", () => {
    expect(() => recordCricketDelivery(innings(), {
      runsOffBat: 0,
      dismissal: { type: "run-out", playerOutId: "a", fielderId: "g2" },
      nextStrikerId: "c",
    })).toThrow(/incoming batter/i);

    expect(() => recordCricketDelivery(innings(), {
      runsOffBat: 0,
      dismissal: { type: "run-out", playerOutId: "a", fielderId: "g2" },
      nextStrikerId: "d",
      replacementBatterId: "c",
    })).toThrow(/next striker/i);
  });

  it("auto-completes the innings when the chasing team passes the target", () => {
    const second = createCricketInnings({
      battingTeamId: "green",
      bowlingTeamId: "red",
      battingLineup: battingOrder,
      strikerId: "a",
      nonStrikerId: "b",
      bowlerId: "g2",
      maxOvers: 5,
      targetScore: 31,
    });

    let state = recordCricketDelivery(second, { runsOffBat: 4 });
    expect(state.completed).toBe(false);

    state = recordCricketDelivery(state, { runsOffBat: 6 });
    expect(state.completed).toBe(false);

    state = recordCricketDelivery(state, { runsOffBat: 22 });
    expect(state.completed).toBe(true);
    expect(state.score).toBe(32);
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

  it("marks a nine-player cricket roster snapshot all out after eight wickets", () => {
    const nine = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];
    let state = createCricketInnings({
      battingTeamId: "red",
      bowlingTeamId: "green",
      battingLineup: nine,
      bowlingLineup: ["g1", "g2"],
      strikerId: "a",
      nonStrikerId: "b",
      bowlerId: "g1",
    });

    for (const playerId of ["a", "c", "d", "e", "f", "g", "h", "i"]) {
      if (!state.currentBowlerId) state = setCricketBowler(state, "g2");
      state = recordCricketDelivery(state, { runsOffBat: 0, dismissal: { type: "bowled", playerOutId: state.strikerId ?? playerId } });
      if (!state.completed) state = setNextBatter(state, playerId === "a" ? "c" : nine[nine.indexOf(playerId) + 1]);
    }

    expect(state.wickets).toBe(8);
    expect(state.completed).toBe(true);
  });

  it("hard-caps all out at 8 wickets even for an 11-player lineup", () => {
    const eleven = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"];
    let state = createCricketInnings({
      battingTeamId: "red",
      bowlingTeamId: "green",
      battingLineup: eleven,
      bowlingLineup: ["bowler1", "bowler2"],
      strikerId: "a",
      nonStrikerId: "b",
      bowlerId: "bowler1",
    });

    const order = ["a", "c", "d", "e", "f", "g", "h", "i"];
    for (const playerId of order) {
      if (!state.currentBowlerId) state = setCricketBowler(state, "bowler2");
      state = recordCricketDelivery(state, { runsOffBat: 0, dismissal: { type: "bowled", playerOutId: state.strikerId! } });
      if (!state.completed) state = setNextBatter(state, playerId === "a" ? "c" : eleven[eleven.indexOf(playerId) + 1]);
    }

    expect(state.wickets).toBe(8);
    expect(state.completed).toBe(true);
  });

  it("recalculates a corrected scorecard from stored deliveries", () => {
    const initial = {
      battingTeamId: "red",
      bowlingTeamId: "green",
      battingLineup: battingOrder,
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
    expect(cricketChaseText(state, 31)).toBe("Need 25 to win from 28 balls");
  });

  it("writes natural cricket result text for chases and defended totals", () => {
    const first = { ...innings(), battingTeamId: "green", bowlingTeamId: "red", score: 40 };
    const chase = { ...innings(), battingTeamId: "red", bowlingTeamId: "green", score: 41, wickets: 1, battingLineup: ["a", "b", "c", "d", "e", "f", "h", "i"] };
    const defended = { ...innings(), battingTeamId: "red", bowlingTeamId: "green", score: 32 };
    const names = (teamId: string) => teamId === "red" ? "Crimson Warriors" : "God's Gladiators";

    expect(cricketResultText(first, chase, names)).toBe("Crimson Warriors beat God's Gladiators by 6 wickets");
    expect(cricketResultText(first, defended, names)).toBe("God's Gladiators beat Crimson Warriors by 8 runs");
  });
});
