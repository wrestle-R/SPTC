import type {
  CricketStandingRow,
  FieldSportStandingRow,
  ThrowballStandingRow,
} from "@/lib/web-types";

export type SubmissionType = "timely-arrival" | "early-bird";

export const TIMELY_ARRIVAL_POINTS = {
  1: 100,
  2: 60,
  3: 40,
  4: 20,
} as const satisfies Record<1 | 2 | 3 | 4, number>;

export const EARLY_BIRD_POINTS = 100;

export const EARLY_BIRD_CUTOFF = {
  hour: 14,
  minute: 30,
} as const;

export const DEFAULT_PLACEMENT_POINTS_BY_SPORT = {
  football: [200, 150, 100, 50],
  cricket: [200, 150, 100, 50],
  handball: [150, 100, 50, 30],
  throwball: [120, 80, 30, 30],
} as const satisfies Record<string, readonly number[]>;

export const LEAGUE_BONUS_POINTS_BY_SPORT = {
  football: { win: 20, tie: 10 },
  cricket: { win: 20, tie: 0 },
  handball: { win: 20, tie: 0 },
  throwball: { win: 0, tie: 0 },
} as const;

type RankedLeagueTeam = {
  sport: string;
  teamId: string;
  rank: number;
  played: number;
};

export function deriveSportPlacementsFromLeaderboards(standings: RankedLeagueTeam[]) {
  return standings
    .filter((row): row is RankedLeagueTeam & { rank: 1 | 2 | 3 | 4 } => (
      row.played > 0
      && (row.rank === 1 || row.rank === 2 || row.rank === 3 || row.rank === 4)
    ))
    .map((row) => ({ sport: row.sport, teamId: row.teamId, place: row.rank }));
}

const INDIA_OFFSET_MINUTES = 330;

export function timelyArrivalPointsForPosition(position: number) {
  if (position === 1 || position === 2 || position === 3 || position === 4) {
    return TIMELY_ARRIVAL_POINTS[position];
  }
  throw new Error("Arrival position must be between 1 and 4.");
}

export function submissionId(type: SubmissionType, teamId: string) {
  return `${type}:${teamId}`;
}

export function parseLocalDateTimeInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) throw new Error("Use a valid date and time.");
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const probe = new Date(Date.UTC(year, month - 1, day));

  if (
    probe.getUTCFullYear() !== year
    || probe.getUTCMonth() !== month - 1
    || probe.getUTCDate() !== day
    || hour < 0
    || hour > 23
    || minute < 0
    || minute > 59
  ) {
    throw new Error("Use a real calendar date and time.");
  }

  const utcMs = Date.UTC(year, month - 1, day, hour, minute) - INDIA_OFFSET_MINUTES * 60 * 1000;

  return {
    year,
    month,
    day,
    hour,
    minute,
    isoString: new Date(utcMs).toISOString(),
    localValue: `${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}`,
  };
}

export function isEarlyBirdLocalTime(value: string) {
  const { hour, minute } = parseLocalDateTimeInput(value);
  return hour < EARLY_BIRD_CUTOFF.hour
    || (hour === EARLY_BIRD_CUTOFF.hour && minute < EARLY_BIRD_CUTOFF.minute);
}

export function calculateLeagueBonusByTeam(
  teamIds: string[],
  standings: {
    football: FieldSportStandingRow[];
    handball: FieldSportStandingRow[];
    cricket: CricketStandingRow[];
    throwball: ThrowballStandingRow[];
  },
) {
  const bonuses = Object.fromEntries(
    teamIds.map((teamId) => [teamId, { leagueWin: 0, leagueTie: 0 }]),
  ) as Record<string, { leagueWin: number; leagueTie: number }>;

  for (const row of standings.football) {
    const teamBonus = bonuses[row.teamId];
    if (!teamBonus) continue;
    teamBonus.leagueWin += row.wins * LEAGUE_BONUS_POINTS_BY_SPORT.football.win;
    teamBonus.leagueTie += row.draws * LEAGUE_BONUS_POINTS_BY_SPORT.football.tie;
  }
  for (const row of standings.handball) {
    const teamBonus = bonuses[row.teamId];
    if (!teamBonus) continue;
    teamBonus.leagueWin += row.wins * LEAGUE_BONUS_POINTS_BY_SPORT.handball.win;
    teamBonus.leagueTie += row.draws * LEAGUE_BONUS_POINTS_BY_SPORT.handball.tie;
  }
  for (const row of standings.cricket) {
    const teamBonus = bonuses[row.teamId];
    if (!teamBonus) continue;
    teamBonus.leagueWin += row.wins * LEAGUE_BONUS_POINTS_BY_SPORT.cricket.win;
    teamBonus.leagueTie += row.ties * LEAGUE_BONUS_POINTS_BY_SPORT.cricket.tie;
  }
  for (const row of standings.throwball) {
    const teamBonus = bonuses[row.teamId];
    if (!teamBonus) continue;
    teamBonus.leagueWin += row.wins * LEAGUE_BONUS_POINTS_BY_SPORT.throwball.win;
  }

  return bonuses;
}
