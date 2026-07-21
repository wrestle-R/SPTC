import type {
  BatterInnings,
  BowlerInnings,
  CricketDelivery,
  CricketDeliveryInput,
  CricketInningsState,
  PlayerId,
} from "./types";

export interface CreateInningsInput {
  battingTeamId: string;
  bowlingTeamId: string;
  lineup?: PlayerId[];
  battingLineup?: PlayerId[];
  bowlingLineup?: PlayerId[];
  strikerId: PlayerId;
  nonStrikerId: PlayerId;
  bowlerId: PlayerId;
  maxOvers?: number;
}

const EMPTY_EXTRAS = {
  wides: 0,
  noBalls: 0,
  byes: 0,
  legByes: 0,
  penalty: 0,
};

function oversFromBalls(legalBalls: number) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

function emptyBatter(playerId: PlayerId): BatterInnings {
  return {
    playerId,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    dots: 0,
    singles: 0,
    twos: 0,
  };
}

function emptyBowler(playerId: PlayerId): BowlerInnings {
  return {
    playerId,
    legalBalls: 0,
    maidens: 0,
    runs: 0,
    wickets: 0,
    dots: 0,
    wides: 0,
    noBalls: 0,
  };
}

function assertLineupMember(lineup: PlayerId[], playerId: PlayerId, label: string) {
  if (!lineup.includes(playerId)) {
    throw new Error(`${label} must be selected from the playing lineup.`);
  }
}

export function createCricketInnings(input: CreateInningsInput): CricketInningsState {
  const battingLineup = input.battingLineup ?? input.lineup ?? [];
  const bowlingLineup = input.bowlingLineup ?? [input.bowlerId];
  if (battingLineup.length < 2) {
    throw new Error("A batting lineup needs at least two players.");
  }
  if (input.strikerId === input.nonStrikerId) {
    throw new Error("Striker and non-striker must be different players.");
  }
  assertLineupMember(battingLineup, input.strikerId, "Striker");
  assertLineupMember(battingLineup, input.nonStrikerId, "Non-striker");

  return {
    battingTeamId: input.battingTeamId,
    bowlingTeamId: input.bowlingTeamId,
    battingLineup: [...battingLineup],
    bowlingLineup: [...bowlingLineup],
    maxOvers: input.maxOvers ?? 5,
    score: 0,
    wickets: 0,
    legalBalls: 0,
    overs: "0.0",
    strikerId: input.strikerId,
    nonStrikerId: input.nonStrikerId,
    currentBowlerId: input.bowlerId,
    previousOverBowlerId: null,
    freeHit: false,
    completed: false,
    batters: {
      [input.strikerId]: emptyBatter(input.strikerId),
      [input.nonStrikerId]: emptyBatter(input.nonStrikerId),
    },
    bowlers: { [input.bowlerId]: emptyBowler(input.bowlerId) },
    extras: { ...EMPTY_EXTRAS },
    events: [],
  };
}

function defaultCommentary(input: CricketDeliveryInput) {
  if (input.extraType === "dead-ball") return "Dead ball.";
  if (input.dismissal) return `OUT! ${input.dismissal.type.replaceAll("-", " ")}.`;
  if (input.extraType === "wide") return "Wide ball.";
  if (input.extraType === "no-ball") return "No ball.";
  if (input.runsOffBat === 6) return "SIX! Clean strike over the boundary.";
  if (input.runsOffBat === 4) return "FOUR! Finds the boundary.";
  if (input.runsOffBat === 0) return "Dot ball.";
  return `${input.runsOffBat} run${input.runsOffBat === 1 ? "" : "s"}.`;
}

function isLegalDelivery(input: CricketDeliveryInput) {
  return !["wide", "no-ball", "dead-ball", "penalty"].includes(input.extraType ?? "");
}

function runsForDelivery(input: CricketDeliveryInput) {
  if (input.extraType === "dead-ball") return 0;
  if (input.extraType === "wide") return Math.max(1, input.extraRuns ?? 1);
  if (input.extraType === "no-ball") {
    return input.runsOffBat + Math.max(1, input.extraRuns ?? 1);
  }
  if (["bye", "leg-bye", "penalty"].includes(input.extraType ?? "")) {
    return Math.max(0, input.extraRuns ?? 0);
  }
  return input.runsOffBat;
}

function runsChargedToBowler(input: CricketDeliveryInput) {
  return input.runsOffBat
    + (input.extraType === "wide" || input.extraType === "no-ball"
      ? Math.max(1, input.extraRuns ?? 1)
      : 0);
}

function completedRunsForStrike(input: CricketDeliveryInput) {
  if (input.extraType === "wide" || input.extraType === "no-ball") {
    return Math.max(0, (input.extraRuns ?? 1) - 1) + input.runsOffBat;
  }
  if (input.extraType === "bye" || input.extraType === "leg-bye") {
    return Math.max(0, input.extraRuns ?? 0);
  }
  return input.runsOffBat;
}

function dismissalAllowedOnFreeHit(type: string) {
  return ["run-out", "retired-out", "obstructing-field"].includes(type);
}

export function recordCricketDelivery(
  state: CricketInningsState,
  input: CricketDeliveryInput,
): CricketInningsState {
  if (state.completed) throw new Error("This innings is complete.");
  if (!state.strikerId) throw new Error("Select the next batter before scoring.");
  if (!state.currentBowlerId) throw new Error("Select a bowler for this over.");
  if (!Number.isInteger(input.runsOffBat) || input.runsOffBat < 0 || input.runsOffBat > 6) {
    throw new Error("Runs off the bat must be a whole number from 0 to 6.");
  }
  if (state.freeHit && input.dismissal && !dismissalAllowedOnFreeHit(input.dismissal.type)) {
    throw new Error("That dismissal is not valid on a free hit.");
  }

  const legalDelivery = isLegalDelivery(input);
  const totalRuns = runsForDelivery(input);
  const strikerId = state.strikerId;
  const bowlerId = state.currentBowlerId;
  const delivery: CricketDelivery = {
    ...input,
    id: `delivery-${state.events.length + 1}`,
    over: Math.floor(state.legalBalls / 6),
    ball: (state.legalBalls % 6) + (legalDelivery ? 1 : 0),
    strikerId,
    nonStrikerId: state.nonStrikerId,
    bowlerId,
    legalDelivery,
    totalRuns,
    freeHit: state.freeHit,
    commentary: input.commentary?.trim() || defaultCommentary(input),
    timestamp: new Date().toISOString(),
  };

  const batters = { ...state.batters };
  const batter = { ...(batters[strikerId] ?? emptyBatter(strikerId)) };
  if (legalDelivery) batter.balls += 1;
  batter.runs += input.runsOffBat;
  if (input.runsOffBat === 4) batter.fours += 1;
  if (input.runsOffBat === 6) batter.sixes += 1;
  if (input.runsOffBat === 0 && legalDelivery) batter.dots += 1;
  if (input.runsOffBat === 1) batter.singles += 1;
  if (input.runsOffBat === 2) batter.twos += 1;
  if (input.dismissal) batter.dismissal = input.dismissal;
  batters[strikerId] = batter;

  const bowlers = { ...state.bowlers };
  const bowler = { ...(bowlers[bowlerId] ?? emptyBowler(bowlerId)) };
  if (legalDelivery) bowler.legalBalls += 1;
  const chargedToBowler = runsChargedToBowler(input);
  bowler.runs += chargedToBowler;
  if (legalDelivery && totalRuns === 0 && !input.dismissal) bowler.dots += 1;
  if (input.extraType === "wide") bowler.wides += Math.max(1, input.extraRuns ?? 1);
  if (input.extraType === "no-ball") bowler.noBalls += Math.max(1, input.extraRuns ?? 1);
  const bowlerWicket = input.dismissal
    && !["run-out", "retired-hurt", "retired-out", "obstructing-field"].includes(input.dismissal.type);
  if (bowlerWicket) bowler.wickets += 1;
  bowlers[bowlerId] = bowler;

  const extras = { ...state.extras };
  if (input.extraType === "wide") extras.wides += Math.max(1, input.extraRuns ?? 1);
  if (input.extraType === "no-ball") extras.noBalls += Math.max(1, input.extraRuns ?? 1);
  if (input.extraType === "bye") extras.byes += Math.max(0, input.extraRuns ?? 0);
  if (input.extraType === "leg-bye") extras.legByes += Math.max(0, input.extraRuns ?? 0);
  if (input.extraType === "penalty") extras.penalty += Math.max(0, input.extraRuns ?? 0);

  let nextStriker: PlayerId | null = strikerId;
  let nextNonStriker = state.nonStrikerId;
  if (completedRunsForStrike(input) % 2 === 1) {
    [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
  }

  let wickets = state.wickets;
  if (input.dismissal && input.dismissal.type !== "retired-hurt") {
    wickets += 1;
  }
  if (input.dismissal?.playerOutId === nextStriker) nextStriker = null;
  if (input.dismissal?.playerOutId === nextNonStriker) {
    nextNonStriker = nextStriker ?? strikerId;
    nextStriker = null;
  }

  const legalBalls = state.legalBalls + (legalDelivery ? 1 : 0);
  const overEnded = legalDelivery && legalBalls % 6 === 0;
  if (overEnded) {
    const completedOver = delivery.over;
    const overRuns = [...state.events, delivery]
      .filter((event) => event.over === completedOver && event.bowlerId === bowlerId)
      .reduce((total, event) => total + runsChargedToBowler(event), 0);
    if (overRuns === 0) bowler.maidens += 1;
  }
  let currentBowlerId: PlayerId | null = bowlerId;
  let previousOverBowlerId = state.previousOverBowlerId;
  if (overEnded && nextStriker) {
    [nextStriker, nextNonStriker] = [nextNonStriker, nextStriker];
  }
  if (overEnded) {
    currentBowlerId = null;
    previousOverBowlerId = bowlerId;
  }

  const completed = legalBalls >= state.maxOvers * 6 || wickets >= state.battingLineup.length - 1;
  return {
    ...state,
    score: state.score + totalRuns,
    wickets,
    legalBalls,
    overs: oversFromBalls(legalBalls),
    strikerId: nextStriker,
    nonStrikerId: nextNonStriker,
    currentBowlerId,
    previousOverBowlerId,
    freeHit: input.extraType === "no-ball" ? true : state.freeHit && !legalDelivery,
    completed,
    batters,
    bowlers,
    extras,
    events: [...state.events, delivery],
  };
}

export function setCricketBowler(state: CricketInningsState, bowlerId: PlayerId) {
  if (state.completed) throw new Error("This innings is complete.");
  if (state.currentBowlerId) throw new Error("The current over already has a bowler.");
  if (state.bowlingLineup.length > 1) {
    assertLineupMember(state.bowlingLineup, bowlerId, "Bowler");
  }
  if (bowlerId === state.previousOverBowlerId) {
    throw new Error("A bowler cannot bowl consecutive overs.");
  }
  return {
    ...state,
    currentBowlerId: bowlerId,
    bowlingLineup: state.bowlingLineup.includes(bowlerId)
      ? state.bowlingLineup
      : [...state.bowlingLineup, bowlerId],
    bowlers: {
      ...state.bowlers,
      [bowlerId]: state.bowlers[bowlerId] ?? emptyBowler(bowlerId),
    },
  };
}

export function setNextBatter(state: CricketInningsState, playerId: PlayerId) {
  if (state.strikerId) throw new Error("A striker is already selected.");
  assertLineupMember(state.battingLineup, playerId, "Batter");
  if (playerId === state.nonStrikerId || state.batters[playerId]?.dismissal) {
    throw new Error("That batter is not available.");
  }
  return {
    ...state,
    strikerId: playerId,
    batters: {
      ...state.batters,
      [playerId]: state.batters[playerId] ?? emptyBatter(playerId),
    },
  };
}

export function runRate(state: Pick<CricketInningsState, "score" | "legalBalls">) {
  return state.legalBalls === 0 ? 0 : state.score / (state.legalBalls / 6);
}

function rounded(value: number) {
  return Number(value.toFixed(2));
}

export function cricketInningsMetrics(state: CricketInningsState, target: number | null = null) {
  const ballsRemaining = Math.max(0, state.maxOvers * 6 - state.legalBalls);
  const runsRequired = target === null ? null : Math.max(0, target - state.score);
  return {
    runRate: rounded(runRate(state)),
    target,
    runsRequired,
    ballsRemaining,
    requiredRunRate: runsRequired === null || runsRequired === 0
      ? 0
      : ballsRemaining === 0 ? Number.POSITIVE_INFINITY : rounded(runsRequired / (ballsRemaining / 6)),
  };
}

export function recalculateCricketInnings(
  initial: CreateInningsInput,
  deliveries: CricketDeliveryInput[],
) {
  let state = createCricketInnings(initial);
  for (const delivery of deliveries) {
    const recorded = delivery as CricketDeliveryInput & Partial<CricketDelivery>;
    if (!state.strikerId) {
      const recordedStriker = recorded.strikerId;
      const next = recordedStriker ?? state.battingLineup.find(
        (playerId) => playerId !== state.nonStrikerId && !state.batters[playerId]?.dismissal,
      );
      if (!next) break;
      state = setNextBatter(state, next);
    }
    if (!state.currentBowlerId) {
      const recordedBowler = recorded.bowlerId;
      const next = recordedBowler ?? state.bowlingLineup.find(
        (playerId) => playerId !== state.previousOverBowlerId,
      );
      if (!next) throw new Error("No eligible bowler is available.");
      state = setCricketBowler(state, next);
    }
    state = recordCricketDelivery(state, delivery);
  }
  return state;
}
