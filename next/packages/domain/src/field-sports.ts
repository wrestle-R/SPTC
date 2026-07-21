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
  return { ...state, score, shootout };
}

export function recordFieldEvent(state: FieldMatchState, input: FieldMatchEventInput) {
  if (!state.teamIds.includes(input.teamId)) throw new Error("Event team is not in this match.");
  if (input.minute !== undefined && (input.minute < 0 || input.minute > 180)) {
    throw new Error("Match minute is outside the supported range.");
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
  return projectFieldScore({ ...state, events: state.events.slice(0, -1) });
}

export function getShootoutStatus(state: FieldMatchState) {
  const attempts = state.events.filter(
    (event) => event.type === "shootout-goal" || event.type === "shootout-miss",
  );
  const [firstTeamId, secondTeamId] = state.teamIds;
  const attemptsByTeam = {
    [firstTeamId]: attempts.filter((event) => event.teamId === firstTeamId).length,
    [secondTeamId]: attempts.filter((event) => event.teamId === secondTeamId).length,
  };
  const firstGoals = state.shootout[firstTeamId];
  const secondGoals = state.shootout[secondTeamId];
  const phase = attemptsByTeam[firstTeamId] >= 5 && attemptsByTeam[secondTeamId] >= 5
    ? "sudden-death" as const
    : "best-of-five" as const;

  let winnerTeamId: TeamId | null = null;
  if (phase === "best-of-five") {
    const firstRemaining = Math.max(0, 5 - attemptsByTeam[firstTeamId]);
    const secondRemaining = Math.max(0, 5 - attemptsByTeam[secondTeamId]);
    if (firstGoals > secondGoals + secondRemaining) winnerTeamId = firstTeamId;
    if (secondGoals > firstGoals + firstRemaining) winnerTeamId = secondTeamId;
    if (attemptsByTeam[firstTeamId] === 5 && attemptsByTeam[secondTeamId] === 5 && firstGoals !== secondGoals) {
      winnerTeamId = firstGoals > secondGoals ? firstTeamId : secondTeamId;
    }
  } else if (
    attemptsByTeam[firstTeamId] === attemptsByTeam[secondTeamId]
    && firstGoals !== secondGoals
  ) {
    winnerTeamId = firstGoals > secondGoals ? firstTeamId : secondTeamId;
  }

  return {
    phase,
    complete: winnerTeamId !== null,
    winnerTeamId,
    attempts: attemptsByTeam,
    nextTeamId: attemptsByTeam[firstTeamId] <= attemptsByTeam[secondTeamId]
      ? firstTeamId
      : secondTeamId,
  };
}

export const undoLatestFieldEvent = undoFieldEvent;
