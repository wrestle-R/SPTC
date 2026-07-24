import {
  cricketResultText,
  createCricketInnings,
  createFieldMatch,
  createThrowballMatch,
  DEFAULT_SPORT_RULES,
  getMatchWinner,
  getShootoutStatus,
  nextMatchNumber,
  normalizeSportRules,
  rankCricketMvpCandidates,
  rankFieldMvpCandidates,
  rankThrowballMvpCandidates,
  rankThrowballStandings,
  recalculateCricketInnings,
  recalculateThrowballMatch,
  recordCricketDelivery as applyCricketDelivery,
  recordFieldEvent,
  recordThrowballRally,
  rankFieldStandings,
  resolveShootoutToss as applyShootoutToss,
  S9_PLAYERS,
  S9_SPORTS,
  S9_TEAMS,
  startShootout as applyStartShootout,
  setCricketBowler as applyCricketBowler,
  setNextBatter as applyNextBatter,
  throwballResultText,
  validateFixture,
  type CricketDeliveryInput,
  type CricketInningsState,
  type CreateInningsInput,
  type FieldMatchEventInput,
  type FieldMatchState,
  type Player,
  type SportRules,
  type Team,
  type ThrowballMatchState,
  type ThrowballRallyInput,
  type ThrowballStandingInput,
} from "@sports-fiesta/domain";
import { activityFixtureId, getActivityEvent, type ActivityFixture, type ActivityResult, type ActivitySportId } from "@/lib/activity-events";
import {
  CommandError,
  deleteDocument,
  getDocument,
  listDocuments,
  newId,
  nowIso,
  supabaseAdmin,
  updateMatchByRevision,
  upsertDocument,
  type JsonDocument,
} from "./supabase-admin";

type CallableData = Record<string, unknown>;
type MatchDocument = JsonDocument & {
  id: string;
  sport: "football" | "handball" | "cricket" | "throwball";
  stage: string;
  status: "scheduled" | "live" | "innings-break" | "super-over" | "completed";
  homeTeamId: string;
  awayTeamId: string;
  matchNumber?: string;
  startsAt?: string;
  venue?: string;
  revision: number;
  scoreSummary?: Record<string, unknown>;
  fieldState?: FieldMatchState;
  cricket?: { innings: Array<{ initial: unknown; state: CricketInningsState; superOver?: boolean }>; currentInnings: number };
  throwball?: ThrowballMatchState;
  winnerTeamId?: string | null;
  resultText?: string | null;
  manOfTheMatchPlayerId?: string | null;
  manOfTheMatchSuggestedPlayerIds?: string[];
  manOfTheMatchScoreBreakdown?: Record<string, unknown> | null;
};

interface MatchMutationResult {
  match: MatchDocument;
}

type CricketEntry = NonNullable<MatchDocument["cricket"]>["innings"][number];
type CricketStatusPatch = Partial<Pick<MatchDocument, "status" | "winnerTeamId" | "resultText">>;

function asString(value: unknown, label: string, max = 160) {
  const result = String(value ?? "").trim();
  if (!result || result.length > max) throw new CommandError(400, "INVALID_ARGUMENT", `${label} is required.`);
  return result;
}

function teamName(teamId: string) {
  return S9_TEAMS.find((team) => team.id === teamId)?.name ?? "Team";
}

async function getSportRules() {
  const settings = await getDocument<{ sportRules?: Partial<SportRules> }>("tournament_settings", "sports-fiesta-s9");
  return normalizeSportRules(settings?.sportRules ?? DEFAULT_SPORT_RULES);
}

async function getTeamRoster(teamId: string) {
  const players = await listDocuments<Player & JsonDocument>("players");
  return players.filter((player) => player.teamId === teamId);
}

async function getMatchRoster(match: MatchDocument) {
  const players = await listDocuments<Player & JsonDocument>("players");
  return players.filter((player) => [match.homeTeamId, match.awayTeamId].includes(player.teamId));
}

function assertMatchTeam(match: MatchDocument, teamId: string) {
  if (![match.homeTeamId, match.awayTeamId].includes(teamId)) {
    throw new CommandError(400, "INVALID_ARGUMENT", "That team is not in this match.");
  }
}

async function assertRosterPlayer(match: MatchDocument, teamId: string, playerId: string | null | undefined, label = "Player") {
  if (!playerId) throw new CommandError(400, "INVALID_ARGUMENT", `${label} is required.`);
  assertMatchTeam(match, teamId);
  const roster = await getTeamRoster(teamId);
  if (!roster.some((player) => player.id === playerId)) {
    throw new CommandError(400, "INVALID_ARGUMENT", `${label} must be selected from this match team's roster.`);
  }
}

function fieldResultText(match: MatchDocument) {
  const score = match.fieldState?.score ?? {};
  const homeScore = Number(score[match.homeTeamId] ?? 0);
  const awayScore = Number(score[match.awayTeamId] ?? 0);

  if (homeScore !== awayScore) {
    const winnerTeamId = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
    const loserTeamId = winnerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    return {
      winnerTeamId,
      resultText: `${teamName(winnerTeamId)} beat ${teamName(loserTeamId)} ${Math.max(homeScore, awayScore)}-${Math.min(homeScore, awayScore)}`,
    };
  }

  const isKnockout = match.stage === "third-place" || match.stage === "final";
  const shootoutRequired = match.sport === "handball" || (match.sport === "football" && isKnockout);
  if (shootoutRequired) {
    const shootoutStatus = match.fieldState ? getShootoutStatus(match.fieldState) : null;
    const shootout = match.fieldState?.shootout ?? {};
    const homeShootout = Number(shootout[match.homeTeamId] ?? 0);
    const awayShootout = Number(shootout[match.awayTeamId] ?? 0);
    if (shootoutStatus?.complete && shootoutStatus.winnerTeamId) {
      const winnerTeamId = shootoutStatus.winnerTeamId;
      const loserTeamId = winnerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
      return {
        winnerTeamId,
        resultText: shootoutStatus.phase === "toss"
          ? `${teamName(winnerTeamId)} beat ${teamName(loserTeamId)} ${homeScore}-${awayScore} (${homeShootout}-${awayShootout} shootout, won toss)`
          : `${teamName(winnerTeamId)} beat ${teamName(loserTeamId)} ${homeScore}-${awayScore} (${homeShootout}-${awayShootout} shootout)`,
      };
    }
    if (shootoutStatus?.requiresTossWinner) {
      return { winnerTeamId: null, resultText: "Shootout toss winner required before the match can end." };
    }
    if (shootoutStatus?.active) {
      return { winnerTeamId: null, resultText: "Shootout is still in progress." };
    }
    return {
      winnerTeamId: null,
      resultText: match.sport === "handball"
        ? "Shootout required — handball match cannot end in a draw."
        : "Penalty shootout required — knockout football match cannot end in a draw.",
    };
  }
  return {
    winnerTeamId: null,
    resultText: `${teamName(match.homeTeamId)} and ${teamName(match.awayTeamId)} drew ${homeScore}-${awayScore}`,
  };
}

function getShootoutConfig(match: MatchDocument) {
  if (match.sport === "handball") {
    return { initialAttemptsPerTeam: 3, maxSuddenDeathAttemptsPerTeam: 3 };
  }
  if (match.sport === "football" && ["third-place", "final"].includes(match.stage)) {
    return { initialAttemptsPerTeam: 3, maxSuddenDeathAttemptsPerTeam: 4 };
  }
  return null;
}

function inningsSummary(innings: NonNullable<MatchDocument["cricket"]>["innings"]) {
  return {
    innings: innings.map((entry) => ({
      battingTeamId: entry.state.battingTeamId,
      score: entry.state.score,
      wickets: entry.state.wickets,
      overs: entry.state.overs,
    })),
  };
}

function throwballScoreSummary(match: Pick<MatchDocument, "homeTeamId" | "awayTeamId">, state: ThrowballMatchState) {
  const currentSet = state.sets[0];
  return {
    [match.homeTeamId]: currentSet?.homeScore ?? 0,
    [match.awayTeamId]: currentSet?.awayScore ?? 0,
  };
}

function cricketStatus(match: MatchDocument, state: CricketInningsState): CricketStatusPatch {
  if (!state.completed) return {};
  const innings = match.cricket?.innings ?? [];
  const first = innings.find((entry) => !entry.superOver)?.state;
  const second = innings.filter((entry) => !entry.superOver)[1]?.state;
  if (!first || !second) return { status: "innings-break" };
  const resultText = cricketResultText(first, second, teamName);
  if (!resultText && first.score === second.score) {
    const superOvers = innings.filter((entry) => entry.superOver && entry.state.completed);
    if (superOvers.length % 2 === 1) return { status: "super-over", winnerTeamId: null, resultText: "Super Over innings complete — start the reply." };
    if (superOvers.length >= 2) {
      const [firstSuperOver, secondSuperOver] = superOvers.slice(-2).map((entry) => entry.state);
      if (firstSuperOver.score !== secondSuperOver.score) {
        const winner = firstSuperOver.score > secondSuperOver.score ? firstSuperOver.battingTeamId : secondSuperOver.battingTeamId;
        const margin = Math.abs(firstSuperOver.score - secondSuperOver.score);
        return { winnerTeamId: winner, resultText: `${teamName(winner)} won the Super Over by ${margin} run${margin === 1 ? "" : "s"}` };
      }
    }
    return { status: "super-over", winnerTeamId: null, resultText: "Super Over tied — start another Super Over." };
  }
  const winnerTeamId = second.score > first.score ? second.battingTeamId : first.battingTeamId;
  return { winnerTeamId, resultText };
}

function currentCricketInnings(match: MatchDocument) {
  const index = match.cricket?.currentInnings;
  const innings = [...(match.cricket?.innings ?? [])];
  if (typeof index !== "number" || !innings[index]) {
    throw new CommandError(400, "FAILED_PRECONDITION", "Start an innings first.");
  }
  return { index, innings, entry: innings[index] };
}

function cricketMatch(match: MatchDocument, innings: CricketEntry[], currentInnings: number, patch: CricketStatusPatch = {}): MatchDocument {
  return {
    ...match,
    ...patch,
    cricket: { innings, currentInnings },
    scoreSummary: inningsSummary(innings),
  };
}

async function suggestManOfTheMatch(match: MatchDocument) {
  const roster = await getMatchRoster(match);
  if (match.sport === "cricket") {
    const rows = new Map<string, {
      playerId: string; teamId: string; runs: number; balls: number; fours: number; sixes: number;
      wickets: number; bowlingRuns: number; bowlingBalls: number; dotBalls: number; maidens: number;
      catches: number; directRunOuts: number; assistedRunOuts: number; stumpings: number; winner: boolean;
    }>();
    for (const player of roster) {
      rows.set(player.id, { playerId: player.id, teamId: player.teamId, runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, bowlingRuns: 0, bowlingBalls: 0, dotBalls: 0, maidens: 0, catches: 0, directRunOuts: 0, assistedRunOuts: 0, stumpings: 0, winner: match.winnerTeamId === player.teamId });
    }
    for (const entry of match.cricket?.innings ?? []) {
      for (const batter of Object.values(entry.state.batters)) {
        const row = rows.get(String(batter.playerId));
        if (!row) continue;
        row.runs += Number(batter.runs ?? 0);
        row.balls += Number(batter.balls ?? 0);
        row.fours += Number(batter.fours ?? 0);
        row.sixes += Number(batter.sixes ?? 0);
      }
      for (const bowler of Object.values(entry.state.bowlers)) {
        const row = rows.get(String(bowler.playerId));
        if (!row) continue;
        row.wickets += Number(bowler.wickets ?? 0);
        row.bowlingRuns += Number(bowler.runs ?? 0);
        row.bowlingBalls += Number(bowler.legalBalls ?? 0);
        row.dotBalls += Number(bowler.dots ?? 0);
        row.maidens += Number(bowler.maidens ?? 0);
      }
      for (const event of entry.state.events ?? []) {
        if (!event.dismissal?.fielderId) continue;
        const row = rows.get(String(event.dismissal.fielderId));
        if (!row) continue;
        if (event.dismissal.type === "caught") row.catches += 1;
        if (event.dismissal.type === "run-out") row.directRunOuts += 1;
        if (event.dismissal.type === "stumped") row.stumpings += 1;
      }
    }
    return rankCricketMvpCandidates([...rows.values()]).slice(0, 5);
  }
  if (match.sport === "throwball") {
    const candidates = roster.map((player) => {
      const stats = match.throwball?.playerStats[player.id];
      return {
        playerId: player.id,
        teamId: player.teamId,
        successfulAttacks: stats?.successfulAttacks ?? 0,
        ballsThrownOut: stats?.ballsThrownOut ?? 0,
        droppedCatches: stats?.droppedCatches ?? 0,
        playerScore: stats?.playerScore ?? 0,
        winner: match.winnerTeamId === player.teamId,
      };
    });
    return rankThrowballMvpCandidates(candidates).slice(0, 5);
  }

  const score = match.fieldState?.score ?? {};
  const rows = new Map<string, { playerId: string; teamId: string; goals: number; assists: number; yellowCards: number; redCards: number; winner: boolean; goalsConceded: number }>();
  for (const player of roster) {
    const opponentId = player.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    rows.set(player.id, { playerId: player.id, teamId: player.teamId, goals: 0, assists: 0, yellowCards: 0, redCards: 0, winner: match.winnerTeamId === player.teamId, goalsConceded: Number(score[opponentId] ?? 0) });
  }
  for (const event of match.fieldState?.events ?? []) {
    if (event.playerId && rows.has(String(event.playerId))) {
      const row = rows.get(String(event.playerId))!;
      if (event.type === "goal") row.goals += 1;
      if (event.type === "yellow-card") row.yellowCards += 1;
      if (event.type === "red-card") row.redCards += 1;
    }
    if (event.assistPlayerId && rows.has(String(event.assistPlayerId))) rows.get(String(event.assistPlayerId))!.assists += 1;
  }
  return rankFieldMvpCandidates([...rows.values()]).slice(0, 5);
}

async function mutateMatch(data: CallableData, mutate: (match: MatchDocument) => Promise<MatchMutationResult> | MatchMutationResult) {
  const matchId = asString(data.matchId, "Match");
  const commandId = asString(data.commandId, "Command ID");
  const expectedRevision = Number(data.expectedRevision);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    throw new CommandError(400, "INVALID_ARGUMENT", "Expected revision is required.");
  }
  const existingReceipt = await getDocument<{ response?: unknown }>("command_receipts", commandId);
  if (existingReceipt?.response) return existingReceipt.response;

  const current = await getDocument<MatchDocument>("matches", matchId);
  if (!current) throw new CommandError(404, "NOT_FOUND", "Match not found.");
  if (current.revision !== expectedRevision) {
    throw new CommandError(409, "ABORTED", "Data is out of sync. Please refresh the page and try again.");
  }
  const result = await mutate(current);
  const next: MatchDocument = {
    ...result.match,
    revision: current.revision + 1,
    updatedAt: nowIso(),
  };
  const updated = await updateMatchByRevision(matchId, expectedRevision, next);
  if (!updated) throw new CommandError(409, "ABORTED", "Data is out of sync. Please refresh the page and try again.");
  const response = { revision: next.revision, match: next };
  await upsertDocument("command_receipts", commandId, { id: commandId, commandId, matchId, createdAt: nowIso(), response });
  return response;
}

export async function handleSaveTournamentSettings(data: CallableData) {
  const current = await getDocument<JsonDocument>("tournament_settings", "sports-fiesta-s9");
  const sportRules = data.sportRules && typeof data.sportRules === "object"
    ? normalizeSportRules(data.sportRules as Partial<SportRules>)
    : undefined;
  await upsertDocument("tournament_settings", "sports-fiesta-s9", {
    ...(current ?? {}),
    id: "sports-fiesta-s9",
    name: data.name ? asString(data.name, "Tournament name") : current?.name ?? "Sports Fiesta",
    organizer: data.organizer ? asString(data.organizer, "Organizer") : current?.organizer ?? "SPTC",
    startDate: data.startDate ?? current?.startDate ?? null,
    endDate: data.endDate ?? current?.endDate ?? null,
    venues: Array.isArray(data.venues) ? data.venues.map((value) => String(value).trim()).filter(Boolean) : current?.venues ?? [],
    sportRules: sportRules ?? current?.sportRules ?? DEFAULT_SPORT_RULES,
    updatedAt: nowIso(),
  });
  return { ok: true };
}

export async function handleSaveTeam(data: CallableData) {
  const id = asString(data.id, "Team ID");
  const current = await getDocument<JsonDocument>("teams", id);
  if (!current) throw new CommandError(404, "NOT_FOUND", "Team not found.");
  const next = {
    ...current,
    name: data.name ? asString(data.name, "Team name") : current.name,
    shortName: data.shortName ? asString(data.shortName, "Short name", 30) : current.shortName,
    color: data.color ? asString(data.color, "Team color", 20) : current.color,
    accentColor: data.accentColor ? asString(data.accentColor, "Accent color", 20) : current.accentColor,
    logoUrl: data.logoUrl === null ? null : data.logoUrl ? asString(data.logoUrl, "Logo URL", 500) : current.logoUrl,
    captainId: data.captainId === null ? null : data.captainId ? asString(data.captainId, "Captain") : current.captainId,
    viceCaptainId: data.viceCaptainId === null ? null : data.viceCaptainId ? asString(data.viceCaptainId, "Vice captain") : current.viceCaptainId,
    updatedAt: nowIso(),
  };
  await upsertDocument("teams", id, next);
  return { id };
}

export async function handleSavePlayer(data: CallableData) {
  const id = data.id ? asString(data.id, "Player ID") : newId();
  const teamId = asString(data.teamId, "Team");
  const team = await getDocument<JsonDocument>("teams", teamId);
  if (!team) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid team.");
  const player: Player & JsonDocument = {
    id,
    teamId,
    name: asString(data.name, "Player name"),
    jerseyNumber: data.jerseyNumber === null || data.jerseyNumber === undefined ? null : Number(data.jerseyNumber),
    role: (data.role ?? "unassigned") as Player["role"],
    battingStyle: data.battingStyle ? asString(data.battingStyle, "Batting style") : null,
    bowlingStyle: data.bowlingStyle ? asString(data.bowlingStyle, "Bowling style") : null,
    active: data.active !== false,
  };
  await upsertDocument("players", id, player);
  return { id };
}

export async function handleCreateMatch(data: CallableData) {
  const fixture = validateFixture({
    sport: asString(data.sport, "Sport") as "football" | "handball" | "cricket" | "throwball",
    homeTeamId: asString(data.homeTeamId, "Home team"),
    awayTeamId: asString(data.awayTeamId, "Away team"),
    stage: (data.stage ?? "league") as "league" | "third-place" | "final",
    maxOvers: data.sport === "cricket" ? 5 : undefined,
  });
  const matches = await listDocuments<MatchDocument>("matches");
  if (matches.some((match) => match.sport === fixture.sport && match.stage === fixture.stage && [match.homeTeamId, match.awayTeamId].sort().join(":") === [fixture.homeTeamId, fixture.awayTeamId].sort().join(":"))) {
    throw new CommandError(409, "ALREADY_EXISTS", "This matchup already exists for the stage.");
  }
  const id = newId();
  const match: MatchDocument = {
    id,
    ...fixture,
    matchNumber: nextMatchNumber(fixture.sport, matches.filter((match) => match.sport === fixture.sport).map((match) => String(match.matchNumber ?? ""))),
    scoreSummary: fixture.sport === "cricket" ? { innings: [] } : { [fixture.homeTeamId]: 0, [fixture.awayTeamId]: 0 },
    revision: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await upsertDocument("matches", id, match);
  return { id, revision: 0 };
}

export async function handleUpdateMatch(data: CallableData) {
  const id = asString(data.matchId, "Match");
  const match = await getDocument<MatchDocument>("matches", id);
  if (!match) throw new CommandError(404, "NOT_FOUND", "Match not found.");
  if (match.status !== "scheduled") throw new CommandError(400, "FAILED_PRECONDITION", "Only scheduled fixtures can be edited.");
  const fixture = validateFixture({
    sport: (data.sport ?? match.sport) as "football" | "handball" | "cricket" | "throwball",
    homeTeamId: data.homeTeamId ? asString(data.homeTeamId, "Home team") : match.homeTeamId,
    awayTeamId: data.awayTeamId ? asString(data.awayTeamId, "Away team") : match.awayTeamId,
    stage: (data.stage ?? match.stage) as "league" | "third-place" | "final",
    maxOvers: data.sport === "cricket" || (!data.sport && match.sport === "cricket") ? 5 : undefined,
  });
  const matches = await listDocuments<MatchDocument>("matches");
  if (matches.some((entry) => entry.id !== id && entry.sport === fixture.sport && entry.stage === fixture.stage && [entry.homeTeamId, entry.awayTeamId].sort().join(":") === [fixture.homeTeamId, fixture.awayTeamId].sort().join(":"))) {
    throw new CommandError(409, "ALREADY_EXISTS", "This matchup already exists for the stage.");
  }
  await upsertDocument("matches", id, {
    ...match,
    ...fixture,
    scoreSummary: fixture.sport === "cricket" ? { innings: [] } : { [fixture.homeTeamId]: 0, [fixture.awayTeamId]: 0 },
    startsAt: data.startsAt ? asString(data.startsAt, "Start date") : match.startsAt,
    venue: data.venue ? asString(data.venue, "Venue") : match.venue,
    updatedAt: nowIso(),
  });
  return { id };
}

export async function handleDeleteMatch(data: CallableData) {
  const id = asString(data.matchId, "Match");
  const match = await getDocument<MatchDocument>("matches", id);
  if (!match) throw new CommandError(404, "NOT_FOUND", "Match not found.");
  
  const { error } = await supabaseAdmin.from("matches").delete().eq("id", id);
  if (error) throw new CommandError(500, "INTERNAL", error.message);
  
  if (match.status === "completed") {
    await handleRefreshProjections();
  }
  
  return { id, deleted: true };
}

export async function handleConfirmFixtures(data: CallableData) {
  const sport = asString(data.sport, "Sport");
  const current = await getDocument<JsonDocument>("sports", sport);
  await upsertDocument("sports", sport, { ...(current ?? {}), id: sport, fixturesConfirmed: data.confirmed !== false, updatedAt: nowIso() });
  return { sport, confirmed: data.confirmed !== false };
}

export async function handleSetToss(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport !== "cricket") throw new CommandError(400, "FAILED_PRECONDITION", "Toss applies only to cricket.");
    const winnerTeamId = asString(data.winnerTeamId, "Toss winner");
    if (![match.homeTeamId, match.awayTeamId].includes(winnerTeamId)) throw new CommandError(400, "INVALID_ARGUMENT", "Toss winner must be in this match.");
    return { match: { ...match, toss: { winnerTeamId, decision: data.decision === "bowl" ? "bowl" : "bat" } } };
  });
}

export async function handleStartMatch(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.status !== "scheduled") throw new CommandError(400, "FAILED_PRECONDITION", "This match cannot be started.");
    if (match.sport === "cricket") return { match: { ...match, status: "innings-break" } };
    if (match.sport === "throwball") {
      const throwball = createThrowballMatch(match.homeTeamId, match.awayTeamId);
      return { match: { ...match, status: "live", throwball, scoreSummary: throwballScoreSummary(match, throwball) } };
    }
    const fieldState = createFieldMatch(match.homeTeamId, match.awayTeamId);
    return { match: { ...match, status: "live", fieldState, scoreSummary: fieldState.score } };
  });
}

export async function handleStartShootout(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (!["football", "handball"].includes(match.sport) || match.status !== "live") {
      throw new CommandError(400, "FAILED_PRECONDITION", "Only a live football or handball match can start a shootout.");
    }
    const config = getShootoutConfig(match);
    if (!config) throw new CommandError(400, "FAILED_PRECONDITION", "This match is not eligible for a shootout.");
    const fieldState = match.fieldState ?? createFieldMatch(match.homeTeamId, match.awayTeamId);
    if ((fieldState.score[match.homeTeamId] ?? 0) !== (fieldState.score[match.awayTeamId] ?? 0)) {
      throw new CommandError(400, "FAILED_PRECONDITION", "Shootout can start only when the scores are level.");
    }
    const firstTeamId = asString(data.firstTeamId, "First shooting team");
    let nextFieldState: FieldMatchState;
    try {
      nextFieldState = applyStartShootout(fieldState, { firstTeamId, ...config });
    } catch (error) {
      throw new CommandError(400, "INVALID_ARGUMENT", (error as Error).message);
    }
    return { match: { ...match, fieldState: nextFieldState, scoreSummary: nextFieldState.score } };
  });
}

export async function handleStartInnings(data: CallableData) {
  const rules = await getSportRules();
  return mutateMatch(data, async (match) => {
    if (match.sport !== "cricket") throw new CommandError(400, "FAILED_PRECONDITION", "This is not a cricket match.");
    if (!["scheduled", "innings-break", "super-over"].includes(match.status)) throw new CommandError(400, "FAILED_PRECONDITION", "This cricket innings cannot be started now.");
    const isSuperOver = data.superOver === true;
    const battingTeamId = asString(data.battingTeamId, "Batting team");
    const bowlingTeamId = asString(data.bowlingTeamId, "Bowling team");
    if (battingTeamId === bowlingTeamId || ![match.homeTeamId, match.awayTeamId].includes(battingTeamId) || ![match.homeTeamId, match.awayTeamId].includes(bowlingTeamId)) {
      throw new CommandError(400, "INVALID_ARGUMENT", "Choose the two teams in this fixture.");
    }
    const battingRoster = await getTeamRoster(battingTeamId);
    const bowlingRoster = await getTeamRoster(bowlingTeamId);
    const battingLineup = battingRoster.map((player) => player.id);
    const bowlingLineup = bowlingRoster.map((player) => player.id);
    await assertRosterPlayer(match, battingTeamId, asString(data.strikerId, "Striker"), "Striker");
    await assertRosterPlayer(match, battingTeamId, asString(data.nonStrikerId, "Non-striker"), "Non-striker");
    await assertRosterPlayer(match, bowlingTeamId, asString(data.bowlerId, "Bowler"), "Bowler");
    const previousInnings = match.cricket?.innings?.at(-1);
    if (isSuperOver && previousInnings?.superOver && battingTeamId !== previousInnings.state.bowlingTeamId) {
      throw new CommandError(400, "INVALID_ARGUMENT", "The other team must bat in the Super Over reply.");
    }
    const firstInnings = match.cricket?.innings?.find((entry) => !entry.superOver)?.state;
    const targetScore = isSuperOver
      ? previousInnings?.superOver && previousInnings.state.completed ? previousInnings.state.score + 1 : undefined
      : firstInnings?.completed ? firstInnings.score + 1 : undefined;
    const initial = {
      battingTeamId,
      bowlingTeamId,
      battingLineup,
      bowlingLineup,
      strikerId: asString(data.strikerId, "Striker"),
      nonStrikerId: asString(data.nonStrikerId, "Non-striker"),
      bowlerId: asString(data.bowlerId, "Bowler"),
      maxOvers: isSuperOver ? 1 : rules.cricket.maxOvers ?? 5,
      targetScore,
      isSuperOver,
    };
    let state: CricketInningsState;
    try { state = createCricketInnings(initial); } catch (error) { throw new CommandError(400, "INVALID_ARGUMENT", (error as Error).message); }
    const innings = [...(match.cricket?.innings ?? []), { initial, state, superOver: isSuperOver }];
    return { match: { ...match, status: "live", cricket: { innings, currentInnings: innings.length - 1 }, scoreSummary: inningsSummary(innings) } };
  });
}

export async function handleRecordCricketDelivery(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport !== "cricket" || match.status !== "live") throw new CommandError(400, "FAILED_PRECONDITION", "The cricket match is not live.");
    const { index, innings } = currentCricketInnings(match);
    let state: CricketInningsState;
    try { state = applyCricketDelivery(innings[index].state, data.delivery as CricketDeliveryInput); } catch (error) { throw new CommandError(400, "FAILED_PRECONDITION", (error as Error).message); }
    innings[index] = { ...innings[index], state };
    return {
      match: cricketMatch(match, innings, index, cricketStatus(cricketMatch(match, innings, index), state)),
    };
  });
}

export async function handleSelectNextBatter(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport !== "cricket" || match.status !== "live") throw new CommandError(400, "FAILED_PRECONDITION", "The cricket match is not live.");
    const { index, innings } = currentCricketInnings(match);
    try { innings[index] = { ...innings[index], state: applyNextBatter(innings[index].state, asString(data.playerId, "Next batter")) }; } catch (error) { throw new CommandError(400, "FAILED_PRECONDITION", (error as Error).message); }
    return { match: cricketMatch(match, innings, index) };
  });
}

export async function handleSelectCricketBowler(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport !== "cricket" || match.status !== "live") throw new CommandError(400, "FAILED_PRECONDITION", "The cricket match is not live.");
    const { index, innings } = currentCricketInnings(match);
    const bowlerId = asString(data.playerId, "Bowler");
    const current = innings[index].state;
    if (current.isSuperOver) {
      const eligibleBowlers = current.bowlingLineup;
      const previousSuperOverBowlers = innings
        .filter((candidate, candidateIndex) => candidateIndex !== index && candidate.superOver && candidate.state.bowlingTeamId === current.bowlingTeamId && candidate.state.events.length)
        .map((candidate) => candidate.state.events[0]?.bowlerId)
        .filter((id): id is string => Boolean(id));
      const usedInCycle = new Set(previousSuperOverBowlers);
      if (usedInCycle.size < eligibleBowlers.length && usedInCycle.has(bowlerId)) {
        throw new CommandError(400, "FAILED_PRECONDITION", "That bowler has already bowled a Super Over. Choose another eligible bowler until the rotation resets.");
      }
    }
    try { innings[index] = { ...innings[index], state: applyCricketBowler(current, bowlerId) }; } catch (error) { throw new CommandError(400, "FAILED_PRECONDITION", (error as Error).message); }
    return { match: cricketMatch(match, innings, index) };
  });
}

export async function handleRecordFieldSportEvent(data: CallableData) {
  return mutateMatch(data, async (match) => {
    if (!["football", "handball"].includes(match.sport) || match.status !== "live") throw new CommandError(400, "FAILED_PRECONDITION", "The field-sport match is not live.");
    const event = data.event as FieldMatchEventInput;
    if (!event || typeof event !== "object") throw new CommandError(400, "INVALID_ARGUMENT", "Event is required.");
    await assertRosterPlayer(match, event.teamId, event.playerId, event.type === "shootout-goal" || event.type === "shootout-miss" ? "Shooter" : "Player");
    if (event.assistPlayerId) await assertRosterPlayer(match, event.teamId, event.assistPlayerId, "Assist player");
    let fieldState: FieldMatchState;
    try { fieldState = recordFieldEvent(match.fieldState ?? createFieldMatch(match.homeTeamId, match.awayTeamId), event); } catch (error) { throw new CommandError(400, "INVALID_ARGUMENT", (error as Error).message); }
    return { match: { ...match, fieldState, scoreSummary: fieldState.score } };
  });
}

export async function handleResolveShootoutToss(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (!["football", "handball"].includes(match.sport) || match.status !== "live") {
      throw new CommandError(400, "FAILED_PRECONDITION", "Only a live football or handball match can resolve a shootout toss.");
    }
    const winnerTeamId = asString(data.winnerTeamId, "Toss winner");
    let fieldState: FieldMatchState;
    try {
      fieldState = applyShootoutToss(match.fieldState ?? createFieldMatch(match.homeTeamId, match.awayTeamId), winnerTeamId);
    } catch (error) {
      throw new CommandError(400, "INVALID_ARGUMENT", (error as Error).message);
    }
    return { match: { ...match, fieldState, scoreSummary: fieldState.score } };
  });
}

export async function handleRecordThrowballRally(data: CallableData) {
  return mutateMatch(data, async (match) => {
    if (match.sport !== "throwball" || match.status !== "live") {
      throw new CommandError(400, "FAILED_PRECONDITION", "The throwball match is not live.");
    }
    const rally = data.rally as ThrowballRallyInput | undefined;
    if (!rally || typeof rally !== "object") {
      throw new CommandError(400, "INVALID_ARGUMENT", "Rally is required.");
    }
    assertMatchTeam(match, rally.teamId);
    const opponentTeamId = rally.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    if (rally.type === "successful-attack") {
      await assertRosterPlayer(match, rally.teamId, rally.attackingPlayerId, "Attacking player");
      if (rally.droppedByPlayerId) {
        await assertRosterPlayer(match, opponentTeamId, rally.droppedByPlayerId, "Dropped-by player");
      }
    } else if (rally.type === "opponent-error") {
      await assertRosterPlayer(match, opponentTeamId, rally.opponentPlayerId, "Opponent player");
    }
    let throwball: ThrowballMatchState;
    try {
      throwball = recordThrowballRally(
        match.throwball ?? createThrowballMatch(match.homeTeamId, match.awayTeamId),
        rally,
      );
    } catch (error) {
      throw new CommandError(400, "INVALID_ARGUMENT", (error as Error).message);
    }
    return {
      match: {
        ...match,
        throwball,
        scoreSummary: throwballScoreSummary(match, throwball),
      },
    };
  });
}

function replayField(match: MatchDocument, events: FieldMatchEventInput[]) {
  return events.reduce((state, event) => recordFieldEvent(state, event), createFieldMatch(match.homeTeamId, match.awayTeamId));
}

export async function handleEditMatchEvent(data: CallableData) {
  return mutateMatch(data, (match) => {
    const eventId = asString(data.eventId, "Event");
    if (match.sport === "cricket") {
      const { index, innings, entry } = currentCricketInnings(match);
      const eventIndex = entry?.state.events.findIndex((event) => event.id === eventId) ?? -1;
      if (eventIndex < 0) throw new CommandError(404, "NOT_FOUND", "Event not found in the current innings.");
      const events = [...entry.state.events];
      events[eventIndex] = { ...events[eventIndex], ...(data.event as CricketDeliveryInput), id: eventId };
      innings[index] = { ...entry, state: recalculateCricketInnings(entry.initial as CreateInningsInput, events) };
      return { match: cricketMatch(match, innings, index) };
    }
    if (match.sport === "throwball") {
      const events = [...(match.throwball?.events ?? [])];
      const eventIndex = events.findIndex((event) => event.id === eventId);
      if (eventIndex < 0) throw new CommandError(404, "NOT_FOUND", "Event not found.");
      events[eventIndex] = { ...events[eventIndex], ...(data.event as Partial<ThrowballRallyInput>), id: eventId };
      let throwball: ThrowballMatchState;
      try {
        throwball = recalculateThrowballMatch(
          [match.homeTeamId, match.awayTeamId],
          events,
        );
      } catch (error) {
        throw new CommandError(400, "INVALID_ARGUMENT", (error as Error).message);
      }
      return { match: { ...match, throwball, scoreSummary: throwballScoreSummary(match, throwball) } };
    }
    const events = [...(match.fieldState?.events ?? [])];
    const eventIndex = events.findIndex((event) => event.id === eventId);
    if (eventIndex < 0) throw new CommandError(404, "NOT_FOUND", "Event not found.");
    events[eventIndex] = { ...events[eventIndex], ...(data.event as FieldMatchEventInput), id: eventId };
    const fieldState = replayField(match, events);
    return { match: { ...match, fieldState, scoreSummary: fieldState.score } };
  });
}

export async function handleUndoLastEvent(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport === "cricket") {
      const { index, innings, entry } = currentCricketInnings(match);
      if (!entry?.state.events.length) throw new CommandError(400, "FAILED_PRECONDITION", "There is no delivery to undo.");
      innings[index] = { ...entry, state: recalculateCricketInnings(entry.initial as CreateInningsInput, entry.state.events.slice(0, -1)) };
      return { match: cricketMatch(match, innings, index, { status: "live", winnerTeamId: null, resultText: null }) };
    }
    if (match.sport === "throwball") {
      const events = match.throwball?.events ?? [];
      if (!events.length) throw new CommandError(400, "FAILED_PRECONDITION", "There is no rally to undo.");
      const throwball = recalculateThrowballMatch(
        [match.homeTeamId, match.awayTeamId],
        events.slice(0, -1),
      );
      return {
        match: {
          ...match,
          throwball,
          winnerTeamId: null,
          resultText: null,
          scoreSummary: throwballScoreSummary(match, throwball),
        },
      };
    }
    const events = match.fieldState?.events ?? [];
    if (!events.length) throw new CommandError(400, "FAILED_PRECONDITION", "There is no event to undo.");
    const fieldState = replayField(match, events.slice(0, -1));
    return { match: { ...match, fieldState, scoreSummary: fieldState.score } };
  });
}

export async function handleEndInnings(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport !== "cricket" || !match.cricket?.innings?.length) throw new CommandError(400, "FAILED_PRECONDITION", "No cricket innings is active.");
    const { index, innings } = currentCricketInnings(match);
    const state = { ...innings[index].state, completed: true } as CricketInningsState;
    innings[index] = { ...innings[index], state };
    return { match: cricketMatch(match, innings, index, cricketStatus(cricketMatch(match, innings, index), state)) };
  });
}

export async function handleEndMatch(data: CallableData) {
  const response = await mutateMatch(data, async (match) => {
    if (!["live", "innings-break", "super-over"].includes(match.status)) {
      throw new CommandError(400, "FAILED_PRECONDITION", "Only an active match can be completed.");
    }
    let completed = { ...match };
    if (["football", "handball"].includes(match.sport)) {
      completed = { ...completed, ...fieldResultText(match) };
      const homeScore = Number(match.fieldState?.score?.[match.homeTeamId] ?? 0);
      const awayScore = Number(match.fieldState?.score?.[match.awayTeamId] ?? 0);
      const isKnockout = match.stage === "third-place" || match.stage === "final";
      if (homeScore === awayScore && !completed.winnerTeamId) {
        if (match.sport === "handball") {
          throw new CommandError(400, "FAILED_PRECONDITION", "Shootout required — handball match cannot end in a draw.");
        }
        if (match.sport === "football" && isKnockout) {
          throw new CommandError(400, "FAILED_PRECONDITION", "Penalty shootout required — knockout match cannot end in a draw.");
        }
      }
    } else if (match.sport === "throwball") {
      if (!match.throwball) throw new CommandError(400, "FAILED_PRECONDITION", "Throwball match has no state.");
      const winnerTeamId = getMatchWinner(match.throwball);
      if (!winnerTeamId) throw new CommandError(400, "FAILED_PRECONDITION", "Throwball match has no winner yet.");
      completed = {
        ...completed,
        winnerTeamId,
        resultText: throwballResultText(match.throwball, teamName),
      };
    } else if (match.sport === "cricket" && !match.resultText) throw new CommandError(400, "FAILED_PRECONDITION", "Cricket result is not ready yet.");
    const suggestions = await suggestManOfTheMatch(completed);
    const manOfTheMatchPlayerId = data.manOfTheMatchPlayerId ? asString(data.manOfTheMatchPlayerId, "Man of the match") : "";
    if (!manOfTheMatchPlayerId) {
      throw new CommandError(400, "FAILED_PRECONDITION", JSON.stringify({
        reason: "MOTM_REQUIRED",
        message: "Select Man of the Match before completing this match.",
        suggestions,
      }));
    }
    const roster = await getMatchRoster(completed);
    const selected = roster.find((player) => player.id === manOfTheMatchPlayerId);
    if (!selected) throw new CommandError(400, "INVALID_ARGUMENT", "Man of the Match must be selected from one of the match team rosters.");
    const breakdown = suggestions.find((row) => row.playerId === manOfTheMatchPlayerId) ?? null;
    return {
      match: {
        ...completed,
        status: "completed",
        manOfTheMatchPlayerId,
        manOfTheMatchSuggestedPlayerIds: suggestions.map((row) => row.playerId),
        manOfTheMatchScoreBreakdown: breakdown ? { ...breakdown } : null,
      },
    };
  });
  await handleRefreshProjections();
  return response;
}

export async function handleConfirmAward(data: CallableData) {
  const id = data.id ? asString(data.id, "Award ID") : newId();
  await upsertDocument("awards", id, {
    id,
    type: asString(data.type, "Award type"),
    sport: asString(data.sport, "Sport"),
    playerId: data.playerId ? asString(data.playerId, "Player") : null,
    teamId: data.teamId ? asString(data.teamId, "Team") : null,
    matchId: data.matchId ? asString(data.matchId, "Match") : null,
    place: data.place === undefined ? null : Number(data.place),
    confirmed: true,
    updatedAt: nowIso(),
  });
  return { id };
}

export async function handleSaveActivityResult(data: CallableData) {
  const sport = asString(data.sport, "Activity sport") as ActivitySportId;
  const eventId = asString(data.eventId, "Activity event");
  const event = getActivityEvent(sport, eventId);
  if (!event) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid activity event.");
  const fixtureId = activityFixtureId(sport, eventId);
  const fixture = await getDocument<ActivityFixture & JsonDocument>("awards", fixtureId);
  if (!fixture) throw new CommandError(400, "FAILED_PRECONDITION", "Create this event fixture before recording results.");
  if (fixture.status !== "live" && fixture.status !== "completed") throw new CommandError(400, "FAILED_PRECONDITION", "Start this event before recording results.");
  if (!data.placements || typeof data.placements !== "object" || Array.isArray(data.placements)) {
    throw new CommandError(400, "INVALID_ARGUMENT", "Record the finishing order first.");
  }
  const placements = Object.fromEntries(Object.entries(data.placements as Record<string, unknown>).map(([place, value]) => [place, String(value ?? "").trim()]));
  const winners = event.points.map((_, index) => placements[String(index + 1)]);
  if (winners.some((value) => !value) || new Set(winners).size !== winners.length) {
    throw new CommandError(400, "INVALID_ARGUMENT", "Each finishing place must have a different selection.");
  }

  const [teams, players] = await Promise.all([
    listDocuments<JsonDocument>("teams"),
    listDocuments<Player & JsonDocument>("players"),
  ]);
  let lineups: Record<string, string[]> | undefined;
  if (event.kind === "individual") {
    if (winners.some((playerId) => !players.some((player) => player.id === playerId && player.active))) {
      throw new CommandError(400, "INVALID_ARGUMENT", "Every winner must be an active player.");
    }
  } else {
    if (winners.some((teamId) => !teams.some((team) => team.id === teamId))) {
      throw new CommandError(400, "INVALID_ARGUMENT", "Every relay result must be a valid team.");
    }
    const rawLineups = data.lineups && typeof data.lineups === "object" && !Array.isArray(data.lineups) ? data.lineups as Record<string, unknown> : {};
    lineups = {};
    for (const teamId of winners) {
      const lineup = Array.isArray(rawLineups[teamId]) ? rawLineups[teamId].map(String) : [];
      if (!lineup.length || new Set(lineup).size !== lineup.length) {
        throw new CommandError(400, "INVALID_ARGUMENT", "Each placed relay team needs a valid lineup.");
      }
      if (lineup.some((playerId) => !players.some((player) => player.id === playerId && player.teamId === teamId && player.active))) {
        throw new CommandError(400, "INVALID_ARGUMENT", "A relay lineup can only contain active players from that team.");
      }
      lineups[teamId] = lineup;
    }
  }

  const id = `activity-result:${sport}:${eventId}`;
  const result: ActivityResult & JsonDocument = { id, type: "activity-result", confirmed: true, sport, eventId, kind: event.kind, placements, ...(lineups ? { lineups } : {}), updatedAt: nowIso() };
  await upsertDocument("awards", id, result);
  await upsertDocument("awards", fixtureId, { ...fixture, status: "completed", updatedAt: nowIso() });
  await handleRefreshProjections();
  return { id };
}

export async function handleDeleteActivityResult(data: CallableData) {
  const sport = asString(data.sport, "Activity sport") as ActivitySportId;
  const eventId = asString(data.eventId, "Activity event");
  if (!getActivityEvent(sport, eventId)) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid activity event.");
  const fixtureId = activityFixtureId(sport, eventId);
  const fixture = await getDocument<ActivityFixture & JsonDocument>("awards", fixtureId);
  if (!fixture) throw new CommandError(404, "NOT_FOUND", "Event fixture not found.");
  const resultId = `activity-result:${sport}:${eventId}`;
  if (!await getDocument<JsonDocument>("awards", resultId)) throw new CommandError(404, "NOT_FOUND", "Event result not found.");
  await deleteDocument("awards", resultId);
  await upsertDocument("awards", fixtureId, { ...fixture, status: "live", updatedAt: nowIso() });
  await handleRefreshProjections();
  return { id: resultId, deleted: true };
}

export async function handleDeleteActivityFixture(data: CallableData) {
  const sport = asString(data.sport, "Activity sport") as ActivitySportId;
  const eventId = asString(data.eventId, "Activity event");
  if (!getActivityEvent(sport, eventId)) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid activity event.");
  const fixtureId = activityFixtureId(sport, eventId);
  if (!await getDocument<JsonDocument>("awards", fixtureId)) throw new CommandError(404, "NOT_FOUND", "Event fixture not found.");
  await Promise.all([
    deleteDocument("awards", `activity-result:${sport}:${eventId}`),
    deleteDocument("awards", fixtureId),
  ]);
  await handleRefreshProjections();
  return { id: fixtureId, deleted: true };
}

export async function handleCreateActivityFixture(data: CallableData) {
  const sport = asString(data.sport, "Activity sport") as ActivitySportId;
  const eventId = asString(data.eventId, "Activity event");
  const event = getActivityEvent(sport, eventId);
  if (!event) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid activity event.");
  const id = activityFixtureId(sport, eventId);
  if (await getDocument<JsonDocument>("awards", id)) throw new CommandError(409, "ALREADY_EXISTS", "This event fixture has already been created.");
  let lineups: Record<string, string[]> | undefined;
  if (event.kind === "relay") {
    const rawLineups = data.lineups && typeof data.lineups === "object" && !Array.isArray(data.lineups) ? data.lineups as Record<string, unknown> : null;
    if (!rawLineups) throw new CommandError(400, "INVALID_ARGUMENT", "Build every relay team lineup before creating the fixture.");
    const [teams, players] = await Promise.all([listDocuments<Team & JsonDocument>("teams"), listDocuments<Player & JsonDocument>("players")]);
    lineups = {};
    for (const team of teams) {
      const rawLineup = rawLineups[team.id];
      const lineup: string[] = Array.isArray(rawLineup) ? rawLineup.map((playerId: unknown) => String(playerId)) : [];
      if (!lineup.length || new Set(lineup).size !== lineup.length) throw new CommandError(400, "INVALID_ARGUMENT", "Every relay team needs at least one unique player in its lineup.");
      if (lineup.some((playerId) => !players.some((player) => player.id === playerId && player.teamId === team.id && player.active))) throw new CommandError(400, "INVALID_ARGUMENT", "A relay lineup can only contain active players from that team.");
      lineups[team.id] = lineup;
    }
  }
  const timestamp = nowIso();
  const fixture: ActivityFixture & JsonDocument = { id, type: "activity-fixture", sport, eventId, status: "scheduled", ...(lineups ? { lineups } : {}), createdAt: timestamp, updatedAt: timestamp };
  await upsertDocument("awards", id, fixture);
  return { id };
}

export async function handleStartActivityFixture(data: CallableData) {
  const sport = asString(data.sport, "Activity sport") as ActivitySportId;
  const eventId = asString(data.eventId, "Activity event");
  const id = activityFixtureId(sport, eventId);
  const fixture = await getDocument<ActivityFixture & JsonDocument>("awards", id);
  if (!fixture) throw new CommandError(404, "NOT_FOUND", "Create this event fixture first.");
  if (fixture.status !== "scheduled") throw new CommandError(400, "FAILED_PRECONDITION", "This event cannot be started again.");
  await upsertDocument("awards", id, { ...fixture, status: "live", updatedAt: nowIso() });
  return { id };
}

export async function handleSaveTeamBonus(data: CallableData) {
  const kind = asString(data.kind, "Bonus type");
  if (!["timely-arrival", "early-bird-bonus", "combined-team-game"].includes(kind)) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid bonus type.");
  const teamId = asString(data.teamId, "Team");
  const teams = await listDocuments<JsonDocument>("teams");
  if (!teams.some((team) => team.id === teamId)) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid team.");
  const points = kind === "early-bird-bonus" ? [100] : kind === "timely-arrival" ? [100, 60, 40, 20] : [100, 75, 50, 25];
  const place = kind === "early-bird-bonus" ? 1 : Number(data.place);
  if (!Number.isInteger(place) || place < 1 || place > points.length) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid finishing place.");
  if (kind !== "early-bird-bonus") {
    const awards = await listDocuments<JsonDocument>("awards");
    if (awards.some((award) => award.type === "team-bonus" && award.sport === kind && Number(award.place) === place && award.teamId !== teamId)) {
      throw new CommandError(409, "ALREADY_EXISTS", "That place has already been awarded to another team.");
    }
  }
  const id = `team-bonus:${kind}:${teamId}`;
  await upsertDocument("awards", id, { id, type: "team-bonus", confirmed: true, sport: kind, teamId, place, points: points[place - 1], updatedAt: nowIso() });
  await handleRefreshProjections();
  return { id };
}

export async function handleSaveManualPointsAdjustment(data: CallableData) {
  const teamId = asString(data.teamId, "Team");
  const reason = asString(data.reason, "Reason", 500);
  const points = Number(data.points);
  if (!Number.isInteger(points) || points === 0 || Math.abs(points) > 1000) {
    throw new CommandError(400, "INVALID_ARGUMENT", "Points must be a whole number from -1000 to 1000, excluding zero.");
  }
  const teams = await listDocuments<JsonDocument>("teams");
  if (!teams.some((team) => team.id === teamId)) {
    throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid team.");
  }
  const id = newId();
  const timestamp = nowIso();
  await upsertDocument("awards", id, {
    id,
    type: "manual-points-adjustment",
    confirmed: true,
    teamId,
    points,
    reason,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  await handleRefreshProjections();
  return { id };
}

export async function handleDeleteManualPointsAdjustment(data: CallableData) {
  const id = asString(data.id, "Adjustment");
  const adjustment = await getDocument<JsonDocument>("awards", id);
  if (!adjustment || adjustment.type !== "manual-points-adjustment") {
    throw new CommandError(404, "NOT_FOUND", "Point adjustment not found.");
  }
  await deleteDocument("awards", id);
  await handleRefreshProjections();
  return { id, deleted: true };
}

export async function handleSaveSportPlacement(data: CallableData) {
  const sport = asString(data.sport, "Sport");
  if (!["football", "handball", "cricket", "throwball"].includes(sport)) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid sport.");
  const teamId = asString(data.teamId, "Team");
  const place = Number(data.place);
  if (!Number.isInteger(place) || place < 1 || place > 4) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a place from first to fourth.");
  const [teams, awards] = await Promise.all([listDocuments<JsonDocument>("teams"), listDocuments<JsonDocument>("awards")]);
  if (!teams.some((team) => team.id === teamId)) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid team.");
  if (awards.some((award) => award.type === "sport-placement" && award.sport === sport && Number(award.place) === place && award.teamId !== teamId)) {
    throw new CommandError(409, "ALREADY_EXISTS", "That place has already been awarded to another team.");
  }
  const id = `sport-placement:${sport}:${teamId}`;
  await upsertDocument("awards", id, { id, type: "sport-placement", sport, teamId, place, confirmed: true, updatedAt: nowIso() });
  await handleRefreshProjections();
  return { id };
}

export async function handleSetPlacementPoints(data: CallableData) {
  const sport = asString(data.sport, "Sport");
  const points = Array.isArray(data.points) ? data.points.map(Number) : [];
  if (points.length !== 4 || points.some((value) => !Number.isFinite(value))) throw new CommandError(400, "INVALID_ARGUMENT", "Provide points for first through fourth place.");
  const current = await getDocument<JsonDocument>("tournament_settings", "sports-fiesta-s9");
  await upsertDocument("tournament_settings", "sports-fiesta-s9", {
    ...(current ?? {}),
    id: "sports-fiesta-s9",
    placementPoints: { ...((current?.placementPoints as Record<string, number[]> | undefined) ?? {}), [sport]: points },
    updatedAt: nowIso(),
  });
  return { sport, points };
}

type MatchRow = MatchDocument;

function emptyFieldRows() {
  return S9_TEAMS.map((team) => ({ teamId: team.id, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }));
}

function fieldStandings(matches: MatchRow[], sport: "football" | "handball") {
  const rows = emptyFieldRows();
  const byTeam = new Map(rows.map((row) => [row.teamId, row]));
  for (const match of matches.filter((row) => row.sport === sport && row.status === "completed" && row.resultText && row.stage === "league")) {
    const home = byTeam.get(match.homeTeamId)!;
    const away = byTeam.get(match.awayTeamId)!;
    const homeScore = match.fieldState?.score?.[match.homeTeamId] ?? 0;
    const awayScore = match.fieldState?.score?.[match.awayTeamId] ?? 0;
    home.played += 1; away.played += 1;
    home.goalsFor += homeScore; home.goalsAgainst += awayScore;
    away.goalsFor += awayScore; away.goalsAgainst += homeScore;
    if (match.winnerTeamId === match.homeTeamId || homeScore > awayScore) { home.wins += 1; home.points += 3; away.losses += 1; }
    else if (match.winnerTeamId === match.awayTeamId || awayScore > homeScore) { away.wins += 1; away.points += 3; home.losses += 1; }
    else if (sport === "football") { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
  }
  return rankFieldStandings(rows);
}

function cricketStandings(matches: MatchRow[]) {
  const rows = S9_TEAMS.map((team) => ({ teamId: team.id, played: 0, wins: 0, ties: 0, losses: 0, points: 0, runsFor: 0, runsAgainst: 0, ballsFaced: 0, ballsBowled: 0, netRunRate: 0 }));
  const byTeam = new Map(rows.map((row) => [row.teamId, row]));
  for (const match of matches.filter((row) => row.sport === "cricket" && row.status === "completed" && row.resultText && row.stage === "league")) {
    const innings = (match.cricket?.innings ?? []).filter((entry) => !entry.superOver).slice(0, 2);
    if (innings.length < 2) continue;
    const [first, second] = innings.map((entry) => entry.state);
    for (const state of [first, second]) {
      const batting = byTeam.get(state.battingTeamId)!;
      const bowling = byTeam.get(state.bowlingTeamId)!;
      batting.runsFor += state.score; batting.ballsFaced += state.wickets >= state.battingLineup.length - 1 ? state.maxOvers * 6 : state.legalBalls;
      bowling.runsAgainst += state.score; bowling.ballsBowled += state.wickets >= state.battingLineup.length - 1 ? state.maxOvers * 6 : state.legalBalls;
    }
    const home = byTeam.get(match.homeTeamId)!; const away = byTeam.get(match.awayTeamId)!;
    home.played += 1; away.played += 1;
    if (match.winnerTeamId === home.teamId) { home.wins += 1; home.points += 2; away.losses += 1; }
    else if (match.winnerTeamId === away.teamId) { away.wins += 1; away.points += 2; home.losses += 1; }
    else { home.ties += 1; away.ties += 1; home.points += 1; away.points += 1; }
  }
  for (const row of rows) {
    const forRate = row.ballsFaced ? row.runsFor / (row.ballsFaced / 6) : 0;
    const againstRate = row.ballsBowled ? row.runsAgainst / (row.ballsBowled / 6) : 0;
    row.netRunRate = Number((forRate - againstRate).toFixed(3));
  }
  return rows.sort((a, b) => b.points - a.points || b.netRunRate - a.netRunRate || b.wins - a.wins || a.teamId.localeCompare(b.teamId)).map((row, index) => ({ ...row, rank: index + 1 }));
}

function throwballStandings(matches: MatchRow[]) {
  const rows = S9_TEAMS.map<ThrowballStandingInput>((team) => ({
    teamId: team.id,
    played: 0,
    wins: 0,
    losses: 0,
    setsFor: 0,
    setsAgainst: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  }));
  const byTeam = new Map(rows.map((row) => [row.teamId, row]));
  for (const match of matches.filter((row) => row.sport === "throwball" && row.status === "completed" && row.resultText && row.stage === "league")) {
    const state = match.throwball;
    if (!state) continue;
    const home = byTeam.get(match.homeTeamId)!;
    const away = byTeam.get(match.awayTeamId)!;
    const homeSets = state.sets.filter((set) => set.winnerTeamId === match.homeTeamId).length;
    const awaySets = state.sets.filter((set) => set.winnerTeamId === match.awayTeamId).length;
    home.played += 1;
    away.played += 1;
    home.setsFor += homeSets;
    home.setsAgainst += awaySets;
    away.setsFor += awaySets;
    away.setsAgainst += homeSets;
    for (const set of state.sets.filter((entry) => entry.completed)) {
      home.pointsFor += set.homeScore;
      home.pointsAgainst += set.awayScore;
      away.pointsFor += set.awayScore;
      away.pointsAgainst += set.homeScore;
    }
    if (match.winnerTeamId === match.homeTeamId) {
      home.wins += 1;
      away.losses += 1;
    } else if (match.winnerTeamId === match.awayTeamId) {
      away.wins += 1;
      home.losses += 1;
    }
  }
  return rankThrowballStandings(rows);
}

function fieldLeaders(matches: MatchRow[], sport: "football" | "handball") {
  const scorers = new Map<string, { playerId: string; teamId: string; goals: number }>();
  for (const match of matches.filter((row) => row.sport === sport)) {
    for (const event of match.fieldState?.events ?? []) {
      if (event.type !== "goal" || typeof event.playerId !== "string" || typeof event.teamId !== "string") continue;
      const row = scorers.get(event.playerId) ?? { playerId: event.playerId, teamId: event.teamId, goals: 0 };
      row.goals += 1; scorers.set(event.playerId, row);
    }
  }
  return [...scorers.values()].sort((a, b) => b.goals - a.goals || a.playerId.localeCompare(b.playerId));
}

function cricketLeaders(matches: MatchRow[]) {
  const players = new Map<string, { playerId: string; runs: number; innings: number; balls: number; wickets: number; bowlingRuns: number; bowlingBalls: number; catches: number }>();
  for (const match of matches.filter((row) => row.sport === "cricket")) {
    for (const entry of match.cricket?.innings ?? []) {
      for (const batter of Object.values(entry.state.batters)) {
        const row = players.get(batter.playerId) ?? { playerId: batter.playerId, runs: 0, innings: 0, balls: 0, wickets: 0, bowlingRuns: 0, bowlingBalls: 0, catches: 0 };
        row.runs += batter.runs; row.balls += batter.balls; row.innings += 1; players.set(batter.playerId, row);
      }
      for (const bowler of Object.values(entry.state.bowlers)) {
        const row = players.get(bowler.playerId) ?? { playerId: bowler.playerId, runs: 0, innings: 0, balls: 0, wickets: 0, bowlingRuns: 0, bowlingBalls: 0, catches: 0 };
        row.wickets += bowler.wickets; row.bowlingRuns += bowler.runs; row.bowlingBalls += bowler.legalBalls; players.set(bowler.playerId, row);
      }
      for (const event of entry.state.events ?? []) {
        if (event.dismissal?.type !== "caught" || !event.dismissal.fielderId) continue;
        const playerId = event.dismissal.fielderId;
        const row = players.get(playerId) ?? { playerId, runs: 0, innings: 0, balls: 0, wickets: 0, bowlingRuns: 0, bowlingBalls: 0, catches: 0 };
        row.catches += 1; players.set(playerId, row);
      }
    }
  }
  const values = [...players.values()].map((row) => ({ ...row, strikeRate: row.balls ? Number(((row.runs / row.balls) * 100).toFixed(2)) : 0, economy: row.bowlingBalls ? Number(((row.bowlingRuns / row.bowlingBalls) * 6).toFixed(2)) : 0, bowlingStrikeRate: row.wickets ? Number((row.bowlingBalls / row.wickets).toFixed(2)) : null }));
  return {
    orangeCap: [...values].sort((a, b) => b.runs - a.runs || a.innings - b.innings || b.strikeRate - a.strikeRate),
    purpleCap: [...values].sort((a, b) => b.wickets - a.wickets || a.economy - b.economy || (a.bowlingStrikeRate ?? Infinity) - (b.bowlingStrikeRate ?? Infinity)),
    mostCatches: [...values].sort((a, b) => b.catches - a.catches || a.playerId.localeCompare(b.playerId)),
  };
}

function throwballLeaders(matches: MatchRow[]) {
  const players = new Map<string, {
    playerId: string;
    teamId: string;
    successfulAttacks: number;
    ballsThrownOut: number;
    droppedCatches: number;
    playerScore: number;
  }>();
  for (const match of matches.filter((row) => row.sport === "throwball")) {
    for (const stats of Object.values(match.throwball?.playerStats ?? {})) {
      const row = players.get(stats.playerId) ?? {
        playerId: stats.playerId,
        teamId: S9_PLAYERS.find((player) => player.id === stats.playerId)?.teamId ?? "",
        successfulAttacks: 0,
        ballsThrownOut: 0,
        droppedCatches: 0,
        playerScore: 0,
      };
      row.successfulAttacks += stats.successfulAttacks;
      row.ballsThrownOut += stats.ballsThrownOut;
      row.droppedCatches += stats.droppedCatches;
      row.playerScore += stats.playerScore;
      players.set(stats.playerId, row);
    }
  }
  const values = [...players.values()];
  return {
    bestPlayers: [...values].sort((a, b) => b.playerScore - a.playerScore || a.playerId.localeCompare(b.playerId)),
    mostAttacks: [...values].sort((a, b) => b.successfulAttacks - a.successfulAttacks || a.playerId.localeCompare(b.playerId)),
  };
}

export async function handleRefreshProjections() {
  const [matches, awards, players] = await Promise.all([
    listDocuments<MatchRow>("matches"),
    listDocuments<JsonDocument>("awards"),
    listDocuments<Player & JsonDocument>("players"),
  ]);
  const football = fieldStandings(matches, "football");
  const handball = fieldStandings(matches, "handball");
  const cricket = cricketStandings(matches);
  const throwball = throwballStandings(matches);
  const placementPoints = { football: [200, 150, 100, 50], handball: [150, 100, 50, 30], cricket: [200, 150, 100, 50], throwball: [120, 80, 30, 30] };
  const coreSports = ["football", "handball", "cricket", "throwball"] as const;
  const placements = awards.filter((award) => award.type === "sport-placement" && award.confirmed && award.teamId && award.sport && award.place);
  const leagueBonus = new Map(S9_TEAMS.map((team) => [team.id, { football: 0, handball: 0, cricket: 0, throwball: 0 }]));
  for (const match of matches.filter((match) => match.status === "completed" && match.stage === "league")) {
    const home = leagueBonus.get(match.homeTeamId); const away = leagueBonus.get(match.awayTeamId);
    if (!home || !away) continue;
    if (match.sport === "football") {
      if (match.winnerTeamId === match.homeTeamId) home.football += 20;
      else if (match.winnerTeamId === match.awayTeamId) away.football += 20;
      else { home.football += 10; away.football += 10; }
    }
    if (match.sport === "handball" && match.winnerTeamId) { const winner = leagueBonus.get(match.winnerTeamId); if (winner) winner.handball += 20; }
    if (match.sport === "cricket" && match.winnerTeamId) { const winner = leagueBonus.get(match.winnerTeamId); if (winner) winner.cricket += 20; }
  }
  const activityResults = awards.filter((award) => award.type === "activity-result" && award.confirmed) as unknown as ActivityResult[];
  const activitySportIds = ["womens-games", "senior-kids", "junior-kids", "relay"] as const;
  const activityScores = new Map(S9_TEAMS.map((team) => [team.id, Object.fromEntries(activitySportIds.map((sport) => [sport, 0])) as Record<string, number>]));
  const bonusScores = new Map(S9_TEAMS.map((team) => [team.id, 0]));
  const adjustmentScores = new Map(S9_TEAMS.map((team) => [team.id, 0]));
  for (const award of awards.filter((item) => item.type === "team-bonus" && item.confirmed && item.teamId)) {
    const points = Number(award.points);
    if (Number.isFinite(points) && bonusScores.has(String(award.teamId))) bonusScores.set(String(award.teamId), bonusScores.get(String(award.teamId))! + points);
  }
  for (const adjustment of awards.filter((item) => item.type === "manual-points-adjustment" && item.confirmed && item.teamId)) {
    const points = Number(adjustment.points);
    if (Number.isFinite(points) && adjustmentScores.has(String(adjustment.teamId))) {
      adjustmentScores.set(String(adjustment.teamId), adjustmentScores.get(String(adjustment.teamId))! + points);
    }
  }
  for (const result of activityResults) {
    const event = getActivityEvent(result.sport, result.eventId);
    if (!event) continue;
    for (const [index, points] of event.points.entries()) {
      const winnerId = result.placements[String(index + 1)];
      const teamId = result.kind === "relay" ? winnerId : players.find((player) => player.id === winnerId)?.teamId;
      if (teamId && activityScores.has(teamId)) activityScores.get(teamId)![result.sport] += points;
    }
  }
  const overall = S9_TEAMS.map((team) => {
    const sportScores = Object.fromEntries(coreSports.map((sport) => {
      const place = placements.find((row) => row.teamId === team.id && row.sport === sport)?.place;
      return [sport, (place ? placementPoints[sport]?.[Number(place) - 1] ?? 0 : 0) + (leagueBonus.get(team.id)?.[sport] ?? 0)];
    })) as Record<string, number>;
    const extraScores = activityScores.get(team.id) ?? {};
    const bonus = bonusScores.get(team.id) ?? 0;
    const adjustments = adjustmentScores.get(team.id) ?? 0;
    return { teamId: team.id, ...sportScores, ...extraScores, bonus, adjustments, total: [...Object.values(sportScores), ...Object.values(extraScores), bonus, adjustments].reduce((sum, value) => sum + value, 0) };
  }).sort((a, b) => b.total - a.total || a.teamId.localeCompare(b.teamId)).map((row, index) => ({ ...row, rank: index + 1 }));

  await Promise.all([
    upsertDocument("standings", "football", { id: "football", rows: football }),
    upsertDocument("standings", "handball", { id: "handball", rows: handball }),
    upsertDocument("standings", "cricket", { id: "cricket", rows: cricket }),
    upsertDocument("standings", "throwball", { id: "throwball", rows: throwball }),
    upsertDocument("standings", "overall", { id: "overall", rows: overall }),
    upsertDocument("leaderboards", "football", { id: "football", topScorers: fieldLeaders(matches, "football") }),
    upsertDocument("leaderboards", "handball", { id: "handball", topScorers: fieldLeaders(matches, "handball") }),
    upsertDocument("leaderboards", "cricket", { id: "cricket", ...cricketLeaders(matches) }),
    upsertDocument("leaderboards", "throwball", { id: "throwball", ...throwballLeaders(matches) }),
  ]);

  for (const sport of ["football", "handball"] as const) {
    const rows = sport === "football" ? football : handball;
    const second = rows[1]; const third = rows[2];
    const needsDecider = Boolean(second && third && second.wins === third.wins && second.goalDifference === third.goalDifference && second.goalsFor === third.goalsFor);
    await upsertDocument("brackets", sport, { id: sport, finalists: needsDecider ? [rows[0]?.teamId].filter(Boolean) : rows.slice(0, 2).map((row) => row.teamId), decider: needsDecider ? [second.teamId, third.teamId] : null });
  }
  await upsertDocument("brackets", "cricket", { id: "cricket", finalists: cricket.slice(0, 2).map((row) => row.teamId) });
  await upsertDocument("brackets", "throwball", { id: "throwball", finalists: throwball.slice(0, 2).map((row) => row.teamId) });
  return { ok: true };
}

export async function seedBaseTournamentData() {
  const timestamp = nowIso();
  await Promise.all([
    upsertDocument("tournament_settings", "sports-fiesta-s9", {
      id: "sports-fiesta-s9",
      name: "Sports Fiesta S9",
      season: "S9",
      organizer: "SPTC",
      startDate: null,
      endDate: null,
      venues: [],
      cricketOvers: 5,
      sportRules: DEFAULT_SPORT_RULES,
      placementPoints: { football: [200, 150, 100, 50], handball: [150, 100, 50, 30], cricket: [200, 150, 100, 50], throwball: [120, 80, 30, 30] },
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
    ...S9_TEAMS.map((team) => upsertDocument("teams", team.id, team)),
    ...S9_PLAYERS.map((player) => upsertDocument("players", player.id, player)),
    ...S9_SPORTS.map((sport) => upsertDocument("sports", sport.id, { ...sport, fixturesConfirmed: false })),
  ]);
  const [matchesResult, awardsResult, receiptsResult] = await Promise.all([
    supabaseAdmin.from("matches").delete().neq("id", "__never__"),
    supabaseAdmin.from("awards").delete().neq("id", "__never__"),
    supabaseAdmin.from("command_receipts").delete().neq("id", "__never__"),
  ]);
  for (const result of [matchesResult, awardsResult, receiptsResult]) {
    if (result.error) throw result.error;
  }
  await Promise.all([
    upsertDocument("standings", "football", { id: "football", rows: fieldStandings([], "football") }),
    upsertDocument("standings", "handball", { id: "handball", rows: fieldStandings([], "handball") }),
    upsertDocument("standings", "cricket", { id: "cricket", rows: cricketStandings([]) }),
    upsertDocument("standings", "throwball", { id: "throwball", rows: throwballStandings([]) }),
    upsertDocument("standings", "overall", { id: "overall", rows: S9_TEAMS.map((team, index) => ({ rank: index + 1, teamId: team.id, football: 0, handball: 0, cricket: 0, throwball: 0, total: 0 })) }),
    upsertDocument("leaderboards", "football", { id: "football", topScorers: [] }),
    upsertDocument("leaderboards", "handball", { id: "handball", topScorers: [] }),
    upsertDocument("leaderboards", "cricket", { id: "cricket", orangeCap: [], purpleCap: [], mostCatches: [] }),
    upsertDocument("leaderboards", "throwball", { id: "throwball", bestPlayers: [], mostAttacks: [] }),
    upsertDocument("brackets", "football", { id: "football", finalists: [], decider: null }),
    upsertDocument("brackets", "handball", { id: "handball", finalists: [], decider: null }),
    upsertDocument("brackets", "cricket", { id: "cricket", finalists: [] }),
    upsertDocument("brackets", "throwball", { id: "throwball", finalists: [] }),
  ]);
  return { ok: true, teams: S9_TEAMS.length, players: S9_PLAYERS.length, matches: 0 };
}
