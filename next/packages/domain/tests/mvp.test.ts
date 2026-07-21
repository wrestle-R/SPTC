import { describe, expect, it } from "vitest";
import { calculateMvpScore } from "../src/mvp";

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
});
