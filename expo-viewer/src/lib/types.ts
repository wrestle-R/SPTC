import type { CricketInningsState, Player, Team } from "@sports-fiesta/domain";

export type PublicTeam = Team;
export type PublicPlayer = Player;
export type Sport = "football" | "handball" | "cricket";

export interface PublicMatch {
  id: string;
  sport: Sport;
  stage: "league" | "decider" | "final";
  status: "scheduled" | "lineup" | "live" | "innings-break" | "super-over" | "completed";
  homeTeamId: string;
  awayTeamId: string;
  matchNumber?: string;
  startsAt?: string;
  venue?: string;
  revision: number;
  lineups: Record<string, { starters: string[]; substitutes: string[] }>;
  scoreSummary: Record<string, number> & { innings?: { battingTeamId: string; score: number; wickets: number; overs: string }[] };
  fieldState?: { score: Record<string, number>; shootout: Record<string, number>; events: Record<string, string | number>[] };
  cricket?: { innings: { state: CricketInningsState; superOver?: boolean }[]; currentInnings: number };
  winnerTeamId?: string | null;
  resultText?: string;
}

export interface OverallRow { rank: number; teamId: string; football: number; handball: number; cricket: number; total: number }
export interface OverallDocument { id: string; rows: OverallRow[] }
export interface SportStandingRow { rank: number; teamId: string; played: number; wins: number; losses: number; draws?: number; ties?: number; points: number; goalDifference?: number; netRunRate?: number }
export interface SportStandingDocument { id: string; rows: SportStandingRow[] }
export interface FieldLeaderboard { id: string; topScorers?: { playerId: string; teamId: string; goals: number }[] }
export interface CricketLeaderboard { id: string; orangeCap?: { playerId: string; runs: number }[]; purpleCap?: { playerId: string; wickets: number }[] }
