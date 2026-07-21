import type { CricketInningsState, Player, Team } from "@sports-fiesta/domain";

export type PublicTeam = Team;
export type PublicPlayer = Player;

export interface PublicMatch {
  id: string;
  sport: "football" | "handball" | "cricket";
  stage: "league" | "decider" | "final";
  status: "scheduled" | "lineup" | "live" | "innings-break" | "super-over" | "completed";
  homeTeamId: string;
  awayTeamId: string;
  matchNumber?: string;
  startsAt?: string;
  venue?: string;
  revision: number;
  lineups: Record<string, { starters: string[]; substitutes: string[] }>;
  scoreSummary: Record<string, number> & {
    innings?: Array<{ battingTeamId: string; score: number; wickets: number; overs: string }>;
  };
  fieldState?: {
    score: Record<string, number>;
    shootout: Record<string, number>;
    events: Array<Record<string, string | number>>;
  };
  cricket?: {
    innings: Array<{ state: CricketInningsState; superOver?: boolean }>;
    currentInnings: number;
  };
  winnerTeamId?: string | null;
  resultText?: string;
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
