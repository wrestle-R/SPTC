import { describe, expect, it } from "vitest";
import {
  createFieldMatch,
  getShootoutStatus,
  recordFieldEvent,
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

  it("ends a best-of-five shootout when the trailing team cannot recover", () => {
    let state = createFieldMatch("red", "green");
    for (const [teamId, type] of [
      ["red", "shootout-goal"], ["green", "shootout-miss"],
      ["red", "shootout-goal"], ["green", "shootout-miss"],
      ["red", "shootout-goal"], ["green", "shootout-miss"],
    ] as const) {
      state = recordFieldEvent(state, { teamId, type });
    }

    expect(getShootoutStatus(state)).toMatchObject({
      phase: "best-of-five",
      complete: true,
      winnerTeamId: "red",
    });
  });

  it("uses paired sudden-death attempts after five kicks each", () => {
    let state = createFieldMatch("red", "green");
    for (let round = 0; round < 5; round += 1) {
      state = recordFieldEvent(state, { teamId: "red", type: "shootout-goal" });
      state = recordFieldEvent(state, { teamId: "green", type: "shootout-goal" });
    }
    state = recordFieldEvent(state, { teamId: "red", type: "shootout-goal" });
    state = recordFieldEvent(state, { teamId: "green", type: "shootout-miss" });

    expect(getShootoutStatus(state)).toMatchObject({
      phase: "sudden-death",
      complete: true,
      winnerTeamId: "red",
    });
  });
});
