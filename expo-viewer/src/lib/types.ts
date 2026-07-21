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
  startsAt: string;
  venue: string;
  revision: number;
  lineups: Record<string, { starters: string[]; substitutes: string[] }>;
  scoreSummary: Record<string, number> & { innings?: { battingTeamId: string; score: number; wickets: number; overs: string }[] };
  fieldState?: { score: Record<string, number>; shootout: Record<string, number>; events: Record<string, string | number>[] };
  cricket?: { innings: { state: CricketInningsState; superOver?: boolean }[]; currentInnings: number };
  winnerTeamId?: string | null;
  resultText?: string;
}

export interface OverallRow { rank: number; teamId: string; football: number; handball: number; cricket: number; discipline: number; total: number }
export interface OverallDocument { id: string; rows: OverallRow[] }
