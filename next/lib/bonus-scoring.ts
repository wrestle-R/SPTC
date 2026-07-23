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
    bonuses[row.teamId].leagueWin += row.wins * 3;
    bonuses[row.teamId].leagueTie += row.draws;
  }
  for (const row of standings.handball) {
    bonuses[row.teamId].leagueWin += row.wins * 3;
    bonuses[row.teamId].leagueTie += row.draws;
  }
  for (const row of standings.cricket) {
    bonuses[row.teamId].leagueWin += row.wins * 2;
    bonuses[row.teamId].leagueTie += row.ties;
  }
  for (const row of standings.throwball) {
    bonuses[row.teamId].leagueWin += row.wins * 3;
  }

  return bonuses;
}
