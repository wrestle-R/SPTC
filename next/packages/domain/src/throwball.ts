import type {
  PlayerId,
  TeamId,
  ThrowballMatchState,
  ThrowballPlayerStats,
  ThrowballRally,
  ThrowballRallyInput,
  ThrowballSetState,
} from "./types";

type RallySource = ThrowballRallyInput | ThrowballRally;

function createEmptySet(): ThrowballSetState {
  return {
    homeScore: 0,
    awayScore: 0,
    completed: false,
    winnerTeamId: null,
  };
}

export function createThrowballMatch(homeTeamId: TeamId, awayTeamId: TeamId): ThrowballMatchState;
export function createThrowballMatch(teamIds: [TeamId, TeamId]): ThrowballMatchState;
export function createThrowballMatch(
  homeTeamIdOrIds: TeamId | [TeamId, TeamId],
  awayTeamId?: TeamId,
): ThrowballMatchState {
  const teamIds: [TeamId, TeamId] = Array.isArray(homeTeamIdOrIds)
    ? homeTeamIdOrIds
    : [homeTeamIdOrIds, awayTeamId ?? ""];
  if (teamIds[0] === teamIds[1]) throw new Error("A match needs two different teams.");
  return {
    teamIds,
    sets: [createEmptySet()],
    currentSet: 0,
    events: [],
    playerStats: {},
  };
}

export function calculateThrowballPlayerScore(stats: ThrowballPlayerStats) {
  return (stats.successfulAttacks * 2) - stats.ballsThrownOut - stats.droppedCatches;
}

function ensurePlayerStats(
  stats: Record<PlayerId, ThrowballPlayerStats>,
  playerId: PlayerId,
): ThrowballPlayerStats {
  if (!stats[playerId]) {
    stats[playerId] = {
      playerId,
      successfulAttacks: 0,
      ballsThrownOut: 0,
      droppedCatches: 0,
      playerScore: 0,
    };
  }
  return stats[playerId];
}

export function checkThrowballSetComplete(
  homeScore: number,
  awayScore: number,
  teamIds: [TeamId, TeamId],
): { completed: boolean; winnerTeamId: TeamId | null } {
  const maxScore = Math.max(homeScore, awayScore);
  const lead = Math.abs(homeScore - awayScore);
  if (maxScore >= 11 && lead >= 2) {
    return {
      completed: true,
      winnerTeamId: homeScore > awayScore ? teamIds[0] : teamIds[1],
    };
  }
  return { completed: false, winnerTeamId: null };
}

export function getMatchWinner(state: ThrowballMatchState): TeamId | null {
  return state.sets[0]?.winnerTeamId ?? null;
}

function applyRallyToState(
  current: ThrowballMatchState,
  input: RallySource,
  eventIndex: number,
): ThrowballMatchState {
  if (!current.teamIds.includes(input.teamId)) {
    throw new Error("Scoring team is not in this match.");
  }
  if (getMatchWinner(current)) {
    throw new Error("This throwball match is already complete.");
  }

  const [homeTeamId, awayTeamId] = current.teamIds;
  const scoringTeamId = input.teamId;
  const defendingTeamId = scoringTeamId === homeTeamId ? awayTeamId : homeTeamId;

  if (input.type === "successful-attack") {
    if (!input.attackingPlayerId) throw new Error("Attacking player is required.");
    const attacker = ensurePlayerStats(current.playerStats, input.attackingPlayerId);
    attacker.successfulAttacks += 1;
    attacker.playerScore = calculateThrowballPlayerScore(attacker);
    if (input.droppedByPlayerId) {
      const defender = ensurePlayerStats(current.playerStats, input.droppedByPlayerId);
      defender.droppedCatches += 1;
      defender.playerScore = calculateThrowballPlayerScore(defender);
    }
  } else {
    if (!input.opponentPlayerId) throw new Error("Opponent player is required.");
    const opponent = ensurePlayerStats(current.playerStats, input.opponentPlayerId);
    opponent.ballsThrownOut += 1;
    opponent.playerScore = calculateThrowballPlayerScore(opponent);
  }

  const currentSet = current.sets[current.currentSet] ?? createEmptySet();
  const nextSet = {
    ...currentSet,
    homeScore: currentSet.homeScore + (scoringTeamId === homeTeamId ? 1 : 0),
    awayScore: currentSet.awayScore + (scoringTeamId === awayTeamId ? 1 : 0),
  };
  const completion = checkThrowballSetComplete(nextSet.homeScore, nextSet.awayScore, current.teamIds);
  if (completion.completed) {
    nextSet.completed = true;
    nextSet.winnerTeamId = completion.winnerTeamId;
  }

  const sets = current.sets.map((set, index) => (index === current.currentSet ? nextSet : set));
  const event: ThrowballRally = {
    ...input,
    id: "id" in input && input.id ? input.id : `rally-${eventIndex + 1}`,
    scoringTeamId,
    timestamp: "timestamp" in input && input.timestamp ? input.timestamp : new Date().toISOString(),
  };
  const nextState: ThrowballMatchState = {
    ...current,
    sets,
    events: [...current.events, event],
    playerStats: { ...current.playerStats },
  };

  return nextState;
}

export function recordThrowballRally(
  state: ThrowballMatchState,
  input: ThrowballRallyInput,
): ThrowballMatchState {
  const current: ThrowballMatchState = {
    ...state,
    sets: state.sets.map((set) => ({ ...set })),
    events: [...state.events],
    playerStats: Object.fromEntries(
      Object.entries(state.playerStats).map(([playerId, stats]) => [playerId, { ...stats }]),
    ),
  };
  return applyRallyToState(current, input, current.events.length);
}

export function recalculateThrowballMatch(
  teamIds: [TeamId, TeamId],
  events: readonly RallySource[],
): ThrowballMatchState {
  return events.reduce(
    (state, event, index) => applyRallyToState(state, event, index),
    createThrowballMatch(teamIds),
  );
}

export function getSetScoreString(set: { homeScore: number; awayScore: number }) {
  return `${set.homeScore}-${set.awayScore}`;
}

export function throwballResultText(
  state: ThrowballMatchState,
  teamName: (id: TeamId) => string,
) {
  const winnerTeamId = getMatchWinner(state);
  if (!winnerTeamId) return null;
  const loserTeamId = state.teamIds.find((teamId) => teamId !== winnerTeamId) ?? state.teamIds[1];
  const finalSet = state.sets[0];
  return `${teamName(winnerTeamId)} beat ${teamName(loserTeamId)} ${getSetScoreString(finalSet)}`;
}
