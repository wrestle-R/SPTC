export type SportId = "football" | "handball" | "cricket";

export interface SportRule {
  maxOvers?: number;
}

export type SportRules = Record<SportId, SportRule>;

export const DEFAULT_SPORT_RULES: SportRules = {
  football: {},
  handball: {},
  cricket: { maxOvers: 5 },
};

export function normalizeSportRules(input?: Partial<Record<string, Partial<SportRule>>> | null): SportRules {
  const maxOvers = Number(input?.cricket?.maxOvers);
  return {
    football: {},
    handball: {},
    cricket: {
      maxOvers: Number.isInteger(maxOvers) && maxOvers > 0 ? maxOvers : DEFAULT_SPORT_RULES.cricket.maxOvers,
    },
  };
}
