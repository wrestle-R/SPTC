import type { CricketInningsState, FieldMatchState, Player, Team } from "@sports-fiesta/domain";

export type PublicTeam = Team;
export type PublicPlayer = Player;

export interface PublicMatch {
  id: string;
  sport: "football" | "handball" | "cricket";
  stage: "league" | "third-place" | "final";
  status: "scheduled" | "live" | "innings-break" | "super-over" | "completed";
  homeTeamId: string;
  awayTeamId: string;
  matchNumber?: string;
  startsAt?: string;
  venue?: string;
  revision: number;
  scoreSummary: Record<string, number> & {
    innings?: Array<{ battingTeamId: string; score: number; wickets: number; overs: string }>;
  };
  fieldState?: FieldMatchState;
  cricket?: {
    innings: Array<{ state: CricketInningsState; superOver?: boolean }>;
    currentInnings: number;
  };
  winnerTeamId?: string | null;
  resultText?: string;
  manOfTheMatchPlayerId?: string | null;
  manOfTheMatchSuggestedPlayerIds?: string[];
  manOfTheMatchScoreBreakdown?: Record<string, unknown> | null;
}

export interface OverallStandingRow {
  rank: number;
  teamId: string;
  football: number;
  handball: number;
  cricket: number;
  total: number;
}

export interface OverallStandingDocument {
  id: string;
  rows: OverallStandingRow[];
}

export interface FieldSportStandingRow {
  rank: number;
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface CricketStandingRow {
  rank: number;
  teamId: string;
  played: number;
  wins: number;
  ties: number;
  losses: number;
  points: number;
  netRunRate: number;
}

export interface SportStandingDocument {
  id: string;
  rows: Array<FieldSportStandingRow | CricketStandingRow>;
}
