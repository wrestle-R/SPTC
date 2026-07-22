import { describe, expect, it } from "vitest";
import type { FieldMatchState } from "../src/types";
import {
  createFieldMatch,
  getShootoutStatus,
  recordFieldEvent,
  resolveShootoutToss,
  startShootout,
  undoFieldEvent,
} from "../src/field-sports";

describe("football and handball event scoring", () => {
  it("credits a normal goal to the selected team", () => {
    const state = recordFieldEvent(createFieldMatch("red", "green"), {
      type: "goal",
      teamId: "red",
      playerId: "r1",
    });

    expect(state.score).toEqual({ red: 1, green: 0 });
  });

  it("credits an own goal to the opponent", () => {
    const state = recordFieldEvent(createFieldMatch("red", "green"), {
      type: "own-goal",
      teamId: "red",
      playerId: "r2",
    });

    expect(state.score).toEqual({ red: 0, green: 1 });
  });

  it("undoes only the latest event", () => {
    const first = recordFieldEvent(createFieldMatch("red", "green"), {
      type: "goal",
      teamId: "red",
      playerId: "r1",
    });
    const second = recordFieldEvent(first, {
      type: "yellow-card",
      teamId: "green",
      playerId: "g1",
    });

    expect(undoFieldEvent(second).events).toHaveLength(1);
  });

  it("requires an explicit shootout start before attempts can be recorded", () => {
    expect(() => recordFieldEvent(createFieldMatch("red", "green"), {
      teamId: "red",
      type: "shootout-goal",
      playerId: "r1",
    })).toThrow(/proceed with shootout/i);
  });

  it("ends a best-of-three shootout when the trailing team cannot recover", () => {
    let state: FieldMatchState = startShootout(createFieldMatch("red", "green"), {
      firstTeamId: "red",
      initialAttemptsPerTeam: 3,
      maxSuddenDeathAttemptsPerTeam: 3,
    });
    for (const [teamId, type] of [
      ["red", "shootout-goal"], ["green", "shootout-miss"],
      ["red", "shootout-goal"], ["green", "shootout-miss"],
    ] as const) {
      state = recordFieldEvent(state, { teamId, type, playerId: `${teamId}-${type}` });
    }

    expect(getShootoutStatus(state)).toMatchObject({
      phase: "best-of-three",
      complete: true,
      winnerTeamId: "red",
    });
  });

  it("uses paired sudden-death attempts after three kicks each", () => {
    let state: FieldMatchState = startShootout(createFieldMatch("red", "green"), {
      firstTeamId: "red",
      initialAttemptsPerTeam: 3,
      maxSuddenDeathAttemptsPerTeam: 3,
    });
    for (let round = 0; round < 3; round += 1) {
      state = recordFieldEvent(state, { teamId: "red", type: "shootout-goal", playerId: `r-${round}` });
      state = recordFieldEvent(state, { teamId: "green", type: "shootout-goal", playerId: `g-${round}` });
    }
    state = recordFieldEvent(state, { teamId: "red", type: "shootout-goal", playerId: "r-sd" });
    state = recordFieldEvent(state, { teamId: "green", type: "shootout-miss", playerId: "g-sd" });

    expect(getShootoutStatus(state)).toMatchObject({
      phase: "sudden-death",
      complete: true,
      winnerTeamId: "red",
    });
  });

  it("falls back to a toss winner after the configured sudden-death limit stays level", () => {
    let state: FieldMatchState = startShootout(createFieldMatch("red", "green"), {
      firstTeamId: "red",
      initialAttemptsPerTeam: 3,
      maxSuddenDeathAttemptsPerTeam: 3,
    });
    for (let round = 0; round < 6; round += 1) {
      state = recordFieldEvent(state, { teamId: round % 2 === 0 ? "red" : "green", type: "shootout-goal", playerId: `p-${round}` });
    }
    for (let round = 0; round < 6; round += 1) {
      state = recordFieldEvent(state, { teamId: round % 2 === 0 ? "red" : "green", type: "shootout-miss", playerId: `s-${round}` });
    }

    expect(getShootoutStatus(state)).toMatchObject({
      phase: "toss",
      complete: false,
      requiresTossWinner: true,
    });

    const resolved = resolveShootoutToss(state, "green");
    expect(getShootoutStatus(resolved)).toMatchObject({
      phase: "toss",
      complete: true,
      winnerTeamId: "green",
    });
  });
});
