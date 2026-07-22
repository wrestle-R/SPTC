export interface MvpInput {
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  wickets?: number;
  bowlingRuns?: number;
  bowlingBalls?: number;
  dotBalls?: number;
  maidens?: number;
  catches?: number;
  directRunOuts?: number;
  assistedRunOuts?: number;
  stumpings?: number;
  assists?: number;
  matchImpact?: boolean;
}

export interface FieldMvpCandidate {
  playerId: string;
  teamId: string;
  goals: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  winner?: boolean;
  goalsConceded?: number;
}

export interface CricketMvpCandidate {
  playerId: string;
  teamId: string;
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  wickets?: number;
  bowlingRuns?: number;
  bowlingBalls?: number;
  dotBalls?: number;
  maidens?: number;
  catches?: number;
  directRunOuts?: number;
  assistedRunOuts?: number;
  stumpings?: number;
  winner?: boolean;
}

export interface MvpSuggestion {
  playerId: string;
  teamId: string;
  total: number;
  batting?: number;
  bowling?: number;
  fielding?: number;
  impact?: number;
  reason: string;
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function calculateMvpScore(input: MvpInput) {
  const runs = input.runs ?? 0;
  const balls = input.balls ?? 0;
  const strikeRate = balls > 0 ? (runs / balls) * 100 : 0;
  const batting = runs
    + (input.fours ?? 0)
    + (input.sixes ?? 0) * 2
    + (balls >= 5 ? clamp((strikeRate - 100) / 10, -5, 10) : 0);

  const bowlingBalls = input.bowlingBalls ?? 0;
  const economy = bowlingBalls > 0
    ? ((input.bowlingRuns ?? 0) / bowlingBalls) * 6
    : 0;
  const bowling = (input.wickets ?? 0) * 25
    + (input.dotBalls ?? 0) * 2
    + (input.maidens ?? 0) * 12
    + (bowlingBalls >= 6 ? clamp((8 - economy) * 2, -10, 10) : 0);

  const fielding = (input.catches ?? 0) * 10
    + (input.directRunOuts ?? 0) * 15
    + (input.assistedRunOuts ?? 0) * 8
    + (input.stumpings ?? 0) * 12
    + (input.assists ?? 0) * 5;
  const impact = input.matchImpact ? 10 : 0;

  return {
    batting: Number(batting.toFixed(2)),
    bowling: Number(bowling.toFixed(2)),
    fielding,
    impact,
    total: Number((batting + bowling + fielding + impact).toFixed(2)),
  };
}

export function calculateFieldMvpScore(input: FieldMvpCandidate): MvpSuggestion {
  const total = input.goals * 35;
  const reason = input.goals
    ? `${input.goals} goal${input.goals === 1 ? "" : "s"}`
    : "No goals scored";
  return { playerId: input.playerId, teamId: input.teamId, total, impact: 0, reason };
}

export function rankFieldMvpCandidates(candidates: FieldMvpCandidate[]) {
  return candidates
    .map(calculateFieldMvpScore)
    .sort((a, b) => b.total - a.total || a.playerId.localeCompare(b.playerId));
}

export function rankCricketMvpCandidates(candidates: CricketMvpCandidate[]) {
  return candidates
    .map((candidate) => {
      const score = calculateMvpScore({
        runs: candidate.runs,
        balls: candidate.balls,
        fours: candidate.fours,
        sixes: candidate.sixes,
        wickets: candidate.wickets,
        bowlingRuns: candidate.bowlingRuns,
        bowlingBalls: candidate.bowlingBalls,
        dotBalls: candidate.dotBalls,
        maidens: candidate.maidens,
        catches: candidate.catches,
        directRunOuts: candidate.directRunOuts,
        assistedRunOuts: candidate.assistedRunOuts,
        stumpings: candidate.stumpings,
        matchImpact: candidate.winner,
      });
      const reason = [
        candidate.runs ? `${candidate.runs} run${candidate.runs === 1 ? "" : "s"}` : null,
        candidate.wickets ? `${candidate.wickets} wicket${candidate.wickets === 1 ? "" : "s"}` : null,
        candidate.catches ? `${candidate.catches} catch${candidate.catches === 1 ? "" : "es"}` : null,
        candidate.winner ? "winner impact" : null,
      ].filter(Boolean).join(", ") || "match impact";
      return { playerId: candidate.playerId, teamId: candidate.teamId, ...score, reason };
    })
    .sort((a, b) => b.total - a.total || a.playerId.localeCompare(b.playerId));
}
