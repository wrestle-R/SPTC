import type { CricketInningsState, FieldMatchState, Player, Team, ThrowballMatchState } from "@sports-fiesta/domain";

export type PublicTeam = Team;
export type PublicPlayer = Player;

export interface PublicMatch {
  id: string;
  sport: "football" | "handball" | "cricket" | "throwball";
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
  throwball?: ThrowballMatchState;
  lineups?: Record<string, string[]>;
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
  throwball: number;
  "womens-games"?: number;
  "senior-kids"?: number;
  "junior-kids"?: number;
  relay?: number;
  bonus?: number;
  adjustments?: number;
  timelyArrival: number;
  earlyBird: number;
  leagueWin: number;
  leagueTie: number;
  total: number;
}

export interface OverallStandingDocument {
  id: string;
  rows: OverallStandingRow[];
}

export interface ImageSubmission {
  id: string;
  teamId: string;
  type: "timely-arrival" | "early-bird";
  imageUrl: string;
  groupPostedAt: string;
  groupPostedAtLocal: string;
  pointsAwarded: number;
  status: "verified";
  memberCountConfirmed: true;
  arrivalPosition?: number;
  verifiedAt: string;
  updatedAt?: string;
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

export interface ThrowballStandingRow {
  rank: number;
  teamId: string;
  played: number;
  wins: number;
  losses: number;
  setsFor: number;
  setsAgainst: number;
  setDifference: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  points: number;
}

export interface ThrowballLeaders {
  id: string;
  bestPlayers: Array<{
    playerId: string;
    teamId: string;
    successfulAttacks: number;
    ballsThrownOut: number;
    droppedCatches: number;
    playerScore: number;
  }>;
  mostAttacks: Array<{
    playerId: string;
    teamId: string;
    successfulAttacks: number;
    ballsThrownOut: number;
    droppedCatches: number;
    playerScore: number;
  }>;
}

export interface SportStandingDocument {
  id: string;
  rows: Array<FieldSportStandingRow | CricketStandingRow | ThrowballStandingRow>;
}
