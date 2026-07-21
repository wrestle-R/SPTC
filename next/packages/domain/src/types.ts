export type TeamId = string;
export type PlayerId = string;

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  color: string;
  accentColor: string;
  logoUrl: string | null;
  captainId: PlayerId | null;
  viceCaptainId: PlayerId | null;
  createdAt?: string;
  updatedAt?: string;
}

export type PlayerRole = "batter" | "bowler" | "all-rounder" | "wicket-keeper" | "unassigned";

export interface Player {
  id: PlayerId;
  teamId: TeamId;
  name: string;
  jerseyNumber: number | null;
  role: PlayerRole;
  battingStyle: string | null;
  bowlingStyle: string | null;
  active: boolean;
}

export type DismissalType =
  | "bowled"
  | "caught"
  | "lbw"
  | "run-out"
  | "stumped"
  | "hit-wicket"
  | "retired-hurt"
  | "retired-out"
  | "obstructing-field";

export type CricketExtraType =
  | "wide"
  | "no-ball"
  | "bye"
  | "leg-bye"
  | "penalty"
  | "dead-ball";

export interface CricketDismissal {
  type: DismissalType;
  playerOutId: PlayerId;
  fielderId?: PlayerId;
  assistFielderId?: PlayerId;
}

export interface CricketDeliveryInput {
  runsOffBat: number;
  extraType?: CricketExtraType;
  extraRuns?: number;
  dismissal?: CricketDismissal;
  commentary?: string;
  pitchX?: number;
  pitchY?: number;
  wagonX?: number;
  wagonY?: number;
}

export interface CricketDelivery extends CricketDeliveryInput {
  id: string;
  over: number;
  ball: number;
  strikerId: PlayerId;
  nonStrikerId: PlayerId;
  bowlerId: PlayerId;
  legalDelivery: boolean;
  totalRuns: number;
  freeHit: boolean;
  timestamp: string;
}

export interface BatterInnings {
  playerId: PlayerId;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dots: number;
  singles: number;
  twos: number;
  dismissal?: CricketDismissal;
}

export interface BowlerInnings {
  playerId: PlayerId;
  legalBalls: number;
  maidens: number;
  runs: number;
  wickets: number;
  dots: number;
  wides: number;
  noBalls: number;
}

export interface CricketExtras {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  penalty: number;
}

export interface CricketInningsState {
  battingTeamId: TeamId;
  bowlingTeamId: TeamId;
  battingLineup: PlayerId[];
  bowlingLineup: PlayerId[];
  maxOvers: number;
  score: number;
  wickets: number;
  legalBalls: number;
  overs: string;
  strikerId: PlayerId | null;
  nonStrikerId: PlayerId;
  currentBowlerId: PlayerId | null;
  previousOverBowlerId: PlayerId | null;
  freeHit: boolean;
  completed: boolean;
  batters: Record<PlayerId, BatterInnings>;
  bowlers: Record<PlayerId, BowlerInnings>;
  extras: CricketExtras;
  events: CricketDelivery[];
}

export type FieldEventType =
  | "goal"
  | "own-goal"
  | "yellow-card"
  | "red-card"
  | "shootout-goal"
  | "shootout-miss";

export interface FieldMatchEventInput {
  type: FieldEventType;
  teamId: TeamId;
  playerId?: PlayerId;
  assistPlayerId?: PlayerId;
  minute?: number;
}

export interface FieldMatchEvent extends FieldMatchEventInput {
  id: string;
  timestamp: string;
}

export interface FieldMatchState {
  teamIds: [TeamId, TeamId];
  score: Record<TeamId, number>;
  shootout: Record<TeamId, number>;
  events: FieldMatchEvent[];
}

export interface FieldStandingInput {
  teamId: TeamId;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points?: number;
}

export interface FieldStanding extends FieldStandingInput {
  rank: number;
  goalDifference: number;
  points: number;
}

export interface OverallStandingInput {
  teamId: TeamId;
  sportPlacements: Record<string, number | null | undefined>;
}

export interface OverallStanding extends OverallStandingInput {
  rank: number;
  sportPoints: number;
  totalPoints: number;
  segments: Record<string, number>;
}
