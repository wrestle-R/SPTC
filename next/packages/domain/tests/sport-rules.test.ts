import { describe, expect, it } from "vitest";
import { DEFAULT_SPORT_RULES, normalizeSportRules } from "../src/sport-rules";

describe("sport settings", () => {
  it("keeps cricket at five overs by default", () => {
    expect(normalizeSportRules().cricket.maxOvers).toBe(5);
    expect(DEFAULT_SPORT_RULES.cricket.maxOvers).toBe(5);
  });

  it("accepts a configured cricket over count", () => {
    expect(normalizeSportRules({ cricket: { maxOvers: 7 } }).cricket.maxOvers).toBe(7);
  });

  it("falls back to defaults for invalid cricket over counts", () => {
    expect(normalizeSportRules({ cricket: { maxOvers: 0 } }).cricket.maxOvers).toBe(5);
    expect(normalizeSportRules({ cricket: { maxOvers: Number.NaN } }).cricket.maxOvers).toBe(5);
  });

  it("keeps throwball available in normalized sport rules", () => {
    expect(normalizeSportRules().throwball).toEqual({});
    expect(DEFAULT_SPORT_RULES.throwball).toEqual({});
  });
});
