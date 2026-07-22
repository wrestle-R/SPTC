import type { FieldMatchEventInput, FieldMatchState, TeamId } from "./types";

export function createFieldMatch(homeTeamId: TeamId, awayTeamId: TeamId): FieldMatchState;
export function createFieldMatch(teamIds: [TeamId, TeamId]): FieldMatchState;
export function createFieldMatch(
  homeTeamIdOrIds: TeamId | [TeamId, TeamId],
  awayTeamId?: TeamId,
): FieldMatchState {
  const teamIds: [TeamId, TeamId] = Array.isArray(homeTeamIdOrIds)
    ? homeTeamIdOrIds
    : [homeTeamIdOrIds, awayTeamId ?? ""];
  if (teamIds[0] === teamIds[1]) throw new Error("A match needs two different teams.");
  return {
    teamIds,
    score: { [teamIds[0]]: 0, [teamIds[1]]: 0 },
    shootout: { [teamIds[0]]: 0, [teamIds[1]]: 0 },
    events: [],
    shootoutState: null,
  };
}

function projectFieldScore(state: FieldMatchState): FieldMatchState {
  const score = { [state.teamIds[0]]: 0, [state.teamIds[1]]: 0 };
  const shootout = { [state.teamIds[0]]: 0, [state.teamIds[1]]: 0 };
  for (const event of state.events) {
    if (event.type === "goal") score[event.teamId] += 1;
    if (event.type === "own-goal") {
      const opponent = state.teamIds.find((teamId) => teamId !== event.teamId);
      if (opponent) score[opponent] += 1;
    }
    if (event.type === "shootout-goal") shootout[event.teamId] += 1;
  }
  const nextState: FieldMatchState = { ...state, score, shootout };
  if (nextState.shootoutState?.active) {
    const status = getShootoutStatus(nextState);
    nextState.shootoutState = {
      ...nextState.shootoutState,
      currentTeamId: status.nextTeamId,
    };
  }
  return nextState;
}

export function startShootout(
  state: FieldMatchState,
  input: {
    firstTeamId: TeamId;
    initialAttemptsPerTeam: number;
    maxSuddenDeathAttemptsPerTeam: number;
  },
) {
  if (!state.teamIds.includes(input.firstTeamId)) throw new Error("First shooting team is not in this match.");
  if (state.score[state.teamIds[0]] !== state.score[state.teamIds[1]]) {
    throw new Error("Shootouts can begin only when the match is level.");
  }
  if (state.shootoutState?.active) throw new Error("Shootout has already started.");
  if (input.initialAttemptsPerTeam <= 0) throw new Error("Initial shootout attempts must be greater than zero.");
  if (input.maxSuddenDeathAttemptsPerTeam < 0) throw new Error("Sudden-death limit cannot be negative.");
  return {
    ...state,
    shootoutState: {
      active: true,
      firstTeamId: input.firstTeamId,
      currentTeamId: input.firstTeamId,
      initialAttemptsPerTeam: input.initialAttemptsPerTeam,
      maxSuddenDeathAttemptsPerTeam: input.maxSuddenDeathAttemptsPerTeam,
      tossWinnerTeamId: null,
    },
  };
}

function nextShootoutTeam(state: FieldMatchState) {
  const shootoutState = state.shootoutState;
  if (!shootoutState) return null;
  const totalAttempts = state.events.filter(
    (event) => event.type === "shootout-goal" || event.type === "shootout-miss",
  ).length;
  const [firstTeamId, secondTeamId] = state.teamIds;
  const alternateTeamId = shootoutState.firstTeamId === firstTeamId ? secondTeamId : firstTeamId;
  return totalAttempts % 2 === 0 ? shootoutState.firstTeamId : alternateTeamId;
}

function hasUnreachableLead(goals: number, opponentGoals: number, ownAttempts: number, opponentAttempts: number, initialAttemptsPerTeam: number) {
  const ownRemaining = Math.max(0, initialAttemptsPerTeam - ownAttempts);
  const opponentRemaining = Math.max(0, initialAttemptsPerTeam - opponentAttempts);
  if (goals > opponentGoals + opponentRemaining) return true;
  if (opponentGoals > goals + ownRemaining) return true;
  return false;
}

export function recordFieldEvent(state: FieldMatchState, input: FieldMatchEventInput) {
  if (!state.teamIds.includes(input.teamId)) throw new Error("Event team is not in this match.");
  if (input.minute !== undefined && (input.minute < 0 || input.minute > 180)) {
    throw new Error("Match minute is outside the supported range.");
  }
  const isShootoutEvent = input.type === "shootout-goal" || input.type === "shootout-miss";
  if (isShootoutEvent) {
    if (!state.shootoutState?.active) throw new Error("Proceed with shootout before recording attempts.");
    if (state.shootoutState.tossWinnerTeamId) throw new Error("Shootout toss has already been resolved.");
    if (input.teamId !== state.shootoutState.currentTeamId) {
      throw new Error("It is not that team's turn to shoot.");
    }
    if (!input.playerId) throw new Error("Shooter is required.");
  } else if (state.shootoutState?.active) {
    throw new Error("Regular match events are locked while the shootout is active.");
  }

  return projectFieldScore({
    ...state,
    events: [
      ...state.events,
      {
        ...input,
        id: `event-${state.events.length + 1}`,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export function undoFieldEvent(state: FieldMatchState) {
  if (state.events.length === 0) return state;
  return projectFieldScore({
    ...state,
    events: state.events.slice(0, -1),
    shootoutState: state.shootoutState ? { ...state.shootoutState, tossWinnerTeamId: null } : state.shootoutState,
  });
}

export function getShootoutStatus(state: FieldMatchState) {
  if (!state.shootoutState?.active) {
    return {
      active: false,
      phase: "inactive" as const,
      complete: false,
      winnerTeamId: null,
      attempts: { [state.teamIds[0]]: 0, [state.teamIds[1]]: 0 },
      nextTeamId: null,
      initialAttemptsPerTeam: 0,
      maxSuddenDeathAttemptsPerTeam: 0,
      requiresTossWinner: false,
    };
  }
  const attempts = state.events.filter(
    (event) => event.type === "shootout-goal" || event.type === "shootout-miss",
  );
  const [firstTeamId, secondTeamId] = state.teamIds;
  const shootoutState = state.shootoutState;
  const attemptsByTeam = {
    [firstTeamId]: attempts.filter((event) => event.teamId === firstTeamId).length,
    [secondTeamId]: attempts.filter((event) => event.teamId === secondTeamId).length,
  };
  const firstGoals = state.shootout[firstTeamId];
  const secondGoals = state.shootout[secondTeamId];
  const firstSuddenDeathAttempts = Math.max(0, attemptsByTeam[firstTeamId] - shootoutState.initialAttemptsPerTeam);
  const secondSuddenDeathAttempts = Math.max(0, attemptsByTeam[secondTeamId] - shootoutState.initialAttemptsPerTeam);
  let phase: "best-of-three" | "sudden-death" | "toss" | "inactive" = (attemptsByTeam[firstTeamId] >= shootoutState.initialAttemptsPerTeam
    && attemptsByTeam[secondTeamId] >= shootoutState.initialAttemptsPerTeam)
    ? "sudden-death" as const
    : "best-of-three" as const;

  let winnerTeamId: TeamId | null = null;
  let requiresTossWinner = false;
  if (shootoutState.tossWinnerTeamId) {
    phase = "toss";
    winnerTeamId = shootoutState.tossWinnerTeamId;
  } else if (phase === "best-of-three") {
    const decidedEarly = hasUnreachableLead(
      firstGoals,
      secondGoals,
      attemptsByTeam[firstTeamId],
      attemptsByTeam[secondTeamId],
      shootoutState.initialAttemptsPerTeam,
    );
    if (decidedEarly) {
      winnerTeamId = firstGoals > secondGoals ? firstTeamId : secondTeamId;
    }
    if (
      !winnerTeamId
      && attemptsByTeam[firstTeamId] === shootoutState.initialAttemptsPerTeam
      && attemptsByTeam[secondTeamId] === shootoutState.initialAttemptsPerTeam
      && firstGoals !== secondGoals
    ) {
      winnerTeamId = firstGoals > secondGoals ? firstTeamId : secondTeamId;
    }
  } else {
    if (
      firstSuddenDeathAttempts === secondSuddenDeathAttempts
      && firstSuddenDeathAttempts > 0
      && firstGoals !== secondGoals
    ) {
      winnerTeamId = firstGoals > secondGoals ? firstTeamId : secondTeamId;
    } else if (
      firstSuddenDeathAttempts >= shootoutState.maxSuddenDeathAttemptsPerTeam
      && secondSuddenDeathAttempts >= shootoutState.maxSuddenDeathAttemptsPerTeam
      && firstGoals === secondGoals
    ) {
      phase = "toss";
      requiresTossWinner = true;
    }
  }

  return {
    active: true,
    phase,
    complete: winnerTeamId !== null,
    winnerTeamId,
    attempts: attemptsByTeam,
    nextTeamId: winnerTeamId || requiresTossWinner ? null : nextShootoutTeam(state),
    initialAttemptsPerTeam: shootoutState.initialAttemptsPerTeam,
    maxSuddenDeathAttemptsPerTeam: shootoutState.maxSuddenDeathAttemptsPerTeam,
    requiresTossWinner,
  };
}

export function resolveShootoutToss(state: FieldMatchState, winnerTeamId: TeamId) {
  if (!state.shootoutState?.active) throw new Error("No shootout is active.");
  if (!state.teamIds.includes(winnerTeamId)) throw new Error("Toss winner is not in this match.");
  const status = getShootoutStatus(state);
  if (!status.requiresTossWinner) throw new Error("This shootout does not need a toss winner.");
  return {
    ...state,
    shootoutState: {
      ...state.shootoutState,
      currentTeamId: null,
      tossWinnerTeamId: winnerTeamId,
    },
  };
}

export const undoLatestFieldEvent = undoFieldEvent;
