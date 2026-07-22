import { describe, expect, it } from "vitest";
import { DEFAULT_SPORT_RULES, normalizeSportRules, validateLineupSelection } from "../src/sport-rules";

describe("sport lineup rules", () => {
  it("enforces default football and handball starters plus substitutes", () => {
    const activePlayerIds = Array.from({ length: 12 }, (_, index) => `p${index + 1}`);

    expect(validateLineupSelection({
      sport: "football",
      starters: activePlayerIds.slice(0, 7),
      substitutes: activePlayerIds.slice(7, 10),
      activePlayerIds,
    })).toMatchObject({ rule: DEFAULT_SPORT_RULES.football });

    expect(() => validateLineupSelection({
      sport: "handball",
      starters: activePlayerIds.slice(0, 6),
      substitutes: activePlayerIds.slice(7, 10),
      activePlayerIds,
    })).toThrow(/exactly 7 starters/i);
  });

  it("enforces exactly nine cricket players and no substitutes by default", () => {
    const activePlayerIds = Array.from({ length: 12 }, (_, index) => `p${index + 1}`);

    expect(validateLineupSelection({
      sport: "cricket",
      starters: activePlayerIds.slice(0, 9),
      substitutes: [],
      activePlayerIds,
    })).toMatchObject({ rule: DEFAULT_SPORT_RULES.cricket });

    expect(() => validateLineupSelection({
      sport: "cricket",
      starters: activePlayerIds.slice(0, 10),
      substitutes: [],
      activePlayerIds,
    })).toThrow(/exactly 9 starters/i);
  });

  it("uses configured sport rules", () => {
    const rules = normalizeSportRules({ football: { starters: 5, substitutes: 2 } });
    const activePlayerIds = Array.from({ length: 8 }, (_, index) => `p${index + 1}`);

    expect(validateLineupSelection({
      sport: "football",
      starters: activePlayerIds.slice(0, 5),
      substitutes: activePlayerIds.slice(5, 7),
      activePlayerIds,
      rules,
    }).rule).toEqual({ starters: 5, substitutes: 2 });
  });
});
