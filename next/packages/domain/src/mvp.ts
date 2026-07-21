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
