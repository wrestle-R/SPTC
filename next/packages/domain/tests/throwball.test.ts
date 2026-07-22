import { describe, expect, it } from "vitest";
import {
  createThrowballMatch,
  getMatchWinner,
  recalculateThrowballMatch,
  recordThrowballRally,
  throwballResultText,
} from "../src/throwball";

describe("throwball scoring", () => {
  it("creates an empty best-of-three match state", () => {
    const state = createThrowballMatch("red", "green");

    expect(state.teamIds).toEqual(["red", "green"]);
    expect(state.currentSet).toBe(0);
    expect(state.sets).toEqual([{ homeScore: 0, awayScore: 0, completed: false, winnerTeamId: null }]);
  });

  it("credits a successful attack and optional dropped catch", () => {
    const state = recordThrowballRally(createThrowballMatch("red", "green"), {
      type: "successful-attack",
      teamId: "red",
      attackingPlayerId: "r1",
      droppedByPlayerId: "g1",
    });

    expect(state.sets[0]).toMatchObject({ homeScore: 1, awayScore: 0 });
    expect(state.playerStats.r1).toMatchObject({ successfulAttacks: 1, playerScore: 2 });
    expect(state.playerStats.g1).toMatchObject({ droppedCatches: 1, playerScore: -1 });
  });

  it("credits an opponent error to the scoring team", () => {
    const state = recordThrowballRally(createThrowballMatch("red", "green"), {
      type: "opponent-error",
      teamId: "green",
      opponentPlayerId: "r2",
    });

    expect(state.sets[0]).toMatchObject({ homeScore: 0, awayScore: 1 });
    expect(state.playerStats.r2).toMatchObject({ ballsThrownOut: 1, playerScore: -1 });
  });

  it("completes sets at 11 with a two-point lead and opens the deciding set when needed", () => {
    let state = createThrowballMatch("red", "green");
    for (let index = 0; index < 11; index += 1) {
      state = recordThrowballRally(state, { type: "successful-attack", teamId: "red", attackingPlayerId: `r${index}` });
    }
    for (let index = 0; index < 11; index += 1) {
      state = recordThrowballRally(state, { type: "successful-attack", teamId: "green", attackingPlayerId: `g${index}` });
    }

    expect(state.currentSet).toBe(2);
    expect(state.sets[0]).toMatchObject({ completed: true, winnerTeamId: "red", homeScore: 11, awayScore: 0 });
    expect(state.sets[1]).toMatchObject({ completed: true, winnerTeamId: "green", homeScore: 0, awayScore: 11 });
    expect(state.sets[2]).toMatchObject({ completed: false, homeScore: 0, awayScore: 0 });
  });

  it("derives winner and natural result text after two set wins", () => {
    let state = createThrowballMatch("red", "green");
    for (let index = 0; index < 11; index += 1) {
      state = recordThrowballRally(state, { type: "successful-attack", teamId: "red", attackingPlayerId: `r${index}` });
    }
    for (let index = 0; index < 11; index += 1) {
      state = recordThrowballRally(state, { type: "successful-attack", teamId: "red", attackingPlayerId: `r${index + 11}` });
    }

    expect(getMatchWinner(state)).toBe("red");
    expect(throwballResultText(state, (id) => (id === "red" ? "Red" : "Green"))).toBe("Red beat Green 2-0 (11-0, 11-0)");
  });

  it("replays saved rally history back into the same scoreboard state", () => {
    const events = [
      { type: "successful-attack", teamId: "red", attackingPlayerId: "r1" },
      { type: "opponent-error", teamId: "green", opponentPlayerId: "r2" },
      { type: "successful-attack", teamId: "red", attackingPlayerId: "r3", droppedByPlayerId: "g4" },
    ] as const;

    const replayed = recalculateThrowballMatch(["red", "green"], events);

    expect(replayed.sets[0]).toMatchObject({ homeScore: 2, awayScore: 1 });
    expect(replayed.playerStats.r1.playerScore).toBe(2);
    expect(replayed.playerStats.r2.playerScore).toBe(-1);
    expect(replayed.playerStats.g4.playerScore).toBe(-1);
  });
});
