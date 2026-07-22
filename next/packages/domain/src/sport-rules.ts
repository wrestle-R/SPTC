export type SportId = "football" | "handball" | "cricket";

export interface SportRule {
  starters: number;
  substitutes: number;
  maxOvers?: number;
}

export type SportRules = Record<SportId, SportRule>;

export const DEFAULT_SPORT_RULES: SportRules = {
  football: { starters: 7, substitutes: 3 },
  handball: { starters: 7, substitutes: 3 },
  cricket: { starters: 9, substitutes: 0, maxOvers: 5 },
};

export function normalizeSportRules(input?: Partial<Record<string, Partial<SportRule>>> | null): SportRules {
  const next: SportRules = {
    football: { ...DEFAULT_SPORT_RULES.football },
    handball: { ...DEFAULT_SPORT_RULES.handball },
    cricket: { ...DEFAULT_SPORT_RULES.cricket },
  };
  for (const sport of Object.keys(next) as SportId[]) {
    const source = input?.[sport];
    if (!source) continue;
    const starters = Number(source.starters);
    const substitutes = Number(source.substitutes);
    const maxOvers = Number(source.maxOvers);
    next[sport] = {
      starters: Number.isInteger(starters) && starters > 0 ? starters : next[sport].starters,
      substitutes: Number.isInteger(substitutes) && substitutes >= 0 ? substitutes : next[sport].substitutes,
      ...(sport === "cricket" ? { maxOvers: Number.isInteger(maxOvers) && maxOvers > 0 ? maxOvers : next.cricket.maxOvers } : {}),
    };
  }
  return next;
}

export function validateLineupSelection(input: {
  sport: SportId;
  starters: string[];
  substitutes: string[];
  activePlayerIds: string[];
  rules?: Partial<Record<string, Partial<SportRule>>> | null;
}) {
  const rules = normalizeSportRules(input.rules);
  const rule = rules[input.sport];
  const starters = [...new Set(input.starters)];
  const substitutes = [...new Set(input.substitutes)];
  const active = new Set(input.activePlayerIds);
  const allSelected = [...starters, ...substitutes];
  if (allSelected.length !== new Set(allSelected).size) {
    throw new Error("A player cannot be both a starter and substitute.");
  }
  const invalid = allSelected.find((playerId) => !active.has(playerId));
  if (invalid) throw new Error("Lineup can include only active players from this team.");
  if (starters.length !== rule.starters) {
    throw new Error(`${input.sport} needs exactly ${rule.starters} starters.`);
  }
  if (substitutes.length !== rule.substitutes) {
    throw new Error(`${input.sport} needs exactly ${rule.substitutes} substitutes.`);
  }
  return { starters, substitutes, rule };
}

export function isConfirmedLineupPlayer(
  lineups: Record<string, { starters: string[]; substitutes: string[] }> | null | undefined,
  teamId: string,
  playerId: string | null | undefined,
) {
  if (!playerId) return false;
  const lineup = lineups?.[teamId];
  return Boolean(lineup && [...lineup.starters, ...lineup.substitutes].includes(playerId));
}

export function confirmedLineupPlayerIds(lineups: Record<string, { starters: string[]; substitutes: string[] }> | null | undefined) {
  return Object.values(lineups ?? {}).flatMap((lineup) => [...lineup.starters, ...lineup.substitutes]);
}
