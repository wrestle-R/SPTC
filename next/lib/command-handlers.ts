import {
  cricketResultText,
  createCricketInnings,
  createFieldMatch,
  DEFAULT_SPORT_RULES,
  isConfirmedLineupPlayer,
  nextMatchNumber,
  normalizeSportRules,
  rankCricketMvpCandidates,
  rankFieldMvpCandidates,
  recalculateCricketInnings,
  recordCricketDelivery as applyCricketDelivery,
  recordFieldEvent,
  rankFieldStandings,
  S9_PLAYERS,
  S9_SEEDED_MATCHES,
  S9_SPORTS,
  S9_TEAMS,
  setCricketBowler as applyCricketBowler,
  setNextBatter as applyNextBatter,
  validateLineupSelection,
  validateFixture,
  type CricketDeliveryInput,
  type CricketInningsState,
  type FieldMatchEventInput,
  type FieldMatchState,
  type Player,
  type SportRules,
} from "@sports-fiesta/domain";
import type { DocumentData } from "firebase-admin/firestore";
import { CommandError, getRefs, FieldValue } from "./firebase-admin";

const ACTOR = { uid: "organizer", name: "Organizer" };
const _r = () => getRefs();
type CallableData = Record<string, unknown>;

type Lineups = Record<string, { starters: string[]; substitutes: string[] }>;

function asString(value: unknown, label: string, max = 160) {
  const result = String(value ?? "").trim();
  if (!result || result.length > max) throw new CommandError(400, "INVALID_ARGUMENT", `${label} is required.`);
  return result;
}

function asStringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new CommandError(400, "INVALID_ARGUMENT", `${label} must be a list of player IDs.`);
  }
  return [...new Set(value as string[])];
}

function publicMatch(match: DocumentData) {
  const projection = { ...match };
  delete projection.createdBy;
  delete projection.updatedBy;
  return projection;
}

async function writeMirrored(collection: string, id: string, value: DocumentData, merge = true) {
  const batch = _r().db.batch();
  batch.set(_r().privateCollection(collection).doc(id), value, { merge });
  batch.set(_r().publicCollection(collection).doc(id), value, { merge });
  await batch.commit();
}

function seededTeamName(teamId: string) {
  return S9_TEAMS.find((team) => team.id === teamId)?.name ?? "Team";
}

async function getSportRules() {
  const snapshot = await _r().privateRoot.get();
  return normalizeSportRules(snapshot.data()?.sportRules as Partial<SportRules> | undefined);
}

async function getActivePlayerIds(teamId: string) {
  const snapshot = await _r().privateCollection("players").where("teamId", "==", teamId).where("active", "==", true).get();
  return snapshot.docs.map((doc) => doc.id);
}

function teamLineup(match: DocumentData, teamId: string) {
  return (match.lineups as Lineups | undefined)?.[teamId] ?? { starters: [], substitutes: [] };
}

function matchLineupIds(match: DocumentData, teamId: string) {
  const lineup = teamLineup(match, teamId);
  return [...lineup.starters, ...lineup.substitutes];
}

function ensureConfiguredLineups(match: DocumentData, rules: SportRules) {
  for (const teamId of [match.homeTeamId, match.awayTeamId]) {
    const lineup = teamLineup(match, teamId);
    const rule = rules[match.sport as keyof SportRules];
    if (lineup.starters.length !== rule.starters || lineup.substitutes.length !== rule.substitutes) {
      throw new CommandError(400, "FAILED_PRECONDITION", `Publish valid ${match.sport} lineups before starting.`);
    }
  }
}

function assertConfirmedEventPlayer(match: DocumentData, teamId: string, playerId: string | null | undefined, label = "Player") {
  if (!playerId || !isConfirmedLineupPlayer(match.lineups as Lineups, teamId, playerId)) {
    throw new CommandError(400, "INVALID_ARGUMENT", `${label} must be selected from the confirmed lineup.`);
  }
}

function fieldResultText(match: DocumentData) {
  const score = match.fieldState?.score ?? {};
  const homeScore = Number(score[match.homeTeamId] ?? 0);
  const awayScore = Number(score[match.awayTeamId] ?? 0);
  if (homeScore === awayScore) return {
    winnerTeamId: null,
    resultText: `${seededTeamName(match.homeTeamId)} and ${seededTeamName(match.awayTeamId)} drew ${homeScore}-${awayScore}`,
  };
  const winnerTeamId = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
  const loserTeamId = winnerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
  return {
    winnerTeamId,
    resultText: `${seededTeamName(winnerTeamId)} beat ${seededTeamName(loserTeamId)} ${Math.max(homeScore, awayScore)}-${Math.min(homeScore, awayScore)}`,
  };
}

function cricketPlayerTeam(match: DocumentData, playerId: string) {
  if (matchLineupIds(match, match.homeTeamId).includes(playerId)) return match.homeTeamId as string;
  if (matchLineupIds(match, match.awayTeamId).includes(playerId)) return match.awayTeamId as string;
  return "";
}

function suggestManOfTheMatch(match: DocumentData) {
  if (match.sport === "cricket") {
    const rows = new Map<string, {
      playerId: string; teamId: string; runs: number; balls: number; fours: number; sixes: number;
      wickets: number; bowlingRuns: number; bowlingBalls: number; dotBalls: number; maidens: number;
      catches: number; directRunOuts: number; assistedRunOuts: number; stumpings: number; winner: boolean;
    }>();
    for (const playerId of matchLineupIds(match, match.homeTeamId).concat(matchLineupIds(match, match.awayTeamId))) {
      const teamId = cricketPlayerTeam(match, playerId);
      rows.set(playerId, { playerId, teamId, runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, bowlingRuns: 0, bowlingBalls: 0, dotBalls: 0, maidens: 0, catches: 0, directRunOuts: 0, assistedRunOuts: 0, stumpings: 0, winner: match.winnerTeamId === teamId });
    }
    for (const entry of match.cricket?.innings ?? []) {
      for (const batter of Object.values(entry.state.batters) as Array<{ playerId: string; runs?: number; balls?: number; fours?: number; sixes?: number }>) {
        const row = rows.get(String(batter.playerId));
        if (!row) continue;
        row.runs += Number(batter.runs ?? 0);
        row.balls += Number(batter.balls ?? 0);
        row.fours += Number(batter.fours ?? 0);
        row.sixes += Number(batter.sixes ?? 0);
      }
      for (const bowler of Object.values(entry.state.bowlers) as Array<{ playerId: string; wickets?: number; runs?: number; legalBalls?: number; dots?: number; maidens?: number }>) {
        const row = rows.get(String(bowler.playerId));
        if (!row) continue;
        row.wickets += Number(bowler.wickets ?? 0);
        row.bowlingRuns += Number(bowler.runs ?? 0);
        row.bowlingBalls += Number(bowler.legalBalls ?? 0);
        row.dotBalls += Number(bowler.dots ?? 0);
        row.maidens += Number(bowler.maidens ?? 0);
      }
      for (const event of entry.state.events ?? []) {
        const dismissal = event.dismissal;
        if (!dismissal?.fielderId) continue;
        const row = rows.get(String(dismissal.fielderId));
        if (!row) continue;
        if (dismissal.type === "caught") row.catches += 1;
        if (dismissal.type === "run-out") row.directRunOuts += 1;
        if (dismissal.type === "stumped") row.stumpings += 1;
      }
    }
    return rankCricketMvpCandidates([...rows.values()]).slice(0, 5);
  }
  const score = match.fieldState?.score ?? {};
  const rows = new Map<string, { playerId: string; teamId: string; goals: number; assists: number; yellowCards: number; redCards: number; winner: boolean; goalsConceded: number }>();
  for (const teamId of [match.homeTeamId, match.awayTeamId]) {
    const opponentId = teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    for (const playerId of matchLineupIds(match, teamId)) {
      rows.set(playerId, { playerId, teamId, goals: 0, assists: 0, yellowCards: 0, redCards: 0, winner: match.winnerTeamId === teamId, goalsConceded: Number(score[opponentId] ?? 0) });
    }
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

async function backfillSeedMatches() {
  const storedPlayers = await _r().privateCollection("players").get();
  const batch = _r().db.batch();
  const now = FieldValue.serverTimestamp();
  const teamIds = new Set(S9_TEAMS.map((team) => team.id));
  const rosterKey = (teamId: unknown, name: unknown) => `${String(teamId)}:${String(name).trim().toLocaleLowerCase()}`;
  const storedByRosterKey = new Map<string, Array<{ id: string; data: DocumentData }>>();
  for (const snapshot of storedPlayers.docs) {
    const data = snapshot.data();
    const key = rosterKey(data.teamId, data.name);
    storedByRosterKey.set(key, [...(storedByRosterKey.get(key) ?? []), { id: snapshot.id, data }]);
  }
  for (const player of S9_PLAYERS) {
    const candidates = storedByRosterKey.get(rosterKey(player.teamId, player.name)) ?? [];
    const source = candidates.find((candidate) => candidate.id === player.id) ?? candidates[0];
    const canonicalPlayer = {
      ...player,
      ...(source?.data ?? {}),
      id: player.id,
      teamId: player.teamId,
      name: player.name,
      jerseyNumber: player.jerseyNumber,
      updatedAt: now,
    };
    batch.set(_r().privateCollection("players").doc(player.id), canonicalPlayer, { merge: true });
    batch.set(_r().publicCollection("players").doc(player.id), canonicalPlayer, { merge: true });
  }
  for (const snapshot of storedPlayers.docs) {
    const data = snapshot.data();
    if (!teamIds.has(String(data.teamId)) || S9_PLAYERS.some((player) => player.id === snapshot.id)) continue;
    batch.delete(_r().privateCollection("players").doc(snapshot.id));
    batch.delete(_r().publicCollection("players").doc(snapshot.id));
  }
  for (const seededMatch of S9_SEEDED_MATCHES) {
    const match = {
      ...seededMatch,
      createdAt: now,
      updatedAt: now,
      createdBy: ACTOR.name,
      updatedBy: ACTOR.name,
    };
    batch.set(_r().privateCollection("matches").doc(match.id), match, { merge: true });
    batch.set(_r().publicCollection("matches").doc(match.id), publicMatch(match), { merge: true });
  }
  await batch.commit();
  await handleRefreshProjections();
}

// --- Bootstrap ---

export async function handleBootstrap() {
  const existing = await _r().privateRoot.get();
  if (existing.exists && existing.data()?.bootstrapped === true) {
    await backfillSeedMatches();
    return { bootstrapped: false, synchronized: true, reason: "already-exists", matches: S9_SEEDED_MATCHES.length };
  }

  const batch = _r().db.batch();
  const tournament: DocumentData = {
    id: "sports-fiesta-s9",
    name: "Sports Fiesta",
    season: "S9",
    organizer: "SPTC",
    startDate: null,
    endDate: null,
    venues: [],
    cricketOvers: 5,
    sportRules: DEFAULT_SPORT_RULES,
    placementPoints: { football: [10, 5, 3, 1], handball: [10, 5, 3, 1], cricket: [10, 5, 3, 1] },
    bootstrapped: true,
    bootstrappedBy: ACTOR.name,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  batch.set(_r().privateRoot, tournament);
  batch.set(_r().publicRoot, { ...tournament, bootstrappedBy: undefined });

  for (const team of S9_TEAMS) {
    batch.set(_r().privateCollection("teams").doc(team.id), team);
    batch.set(_r().publicCollection("teams").doc(team.id), team);
  }
  for (const player of S9_PLAYERS) {
    batch.set(_r().privateCollection("players").doc(player.id), player);
    batch.set(_r().publicCollection("players").doc(player.id), player);
  }
  for (const sport of S9_SPORTS) {
    batch.set(_r().privateCollection("sports").doc(sport.id), { ...sport, fixturesConfirmed: false });
    batch.set(_r().publicCollection("sports").doc(sport.id), { ...sport, fixturesConfirmed: false });
  }

  const now = FieldValue.serverTimestamp();
  for (const seededMatch of S9_SEEDED_MATCHES) {
    const match = {
      ...seededMatch,
      createdAt: now,
      updatedAt: now,
      createdBy: ACTOR.name,
      updatedBy: ACTOR.name,
    };
    batch.set(_r().privateCollection("matches").doc(match.id), match);
    batch.set(_r().publicCollection("matches").doc(match.id), publicMatch(match));
  }

  const seededMatches = S9_SEEDED_MATCHES as MatchRow[];
  const emptyRows = S9_TEAMS.map((team, index) => ({ rank: index + 1, teamId: team.id, football: 0, handball: 0, cricket: 0, total: 0 }));
  for (const [key, rows] of [
    ["overall", emptyRows],
    ["football", fieldStandings(seededMatches, "football")],
    ["handball", fieldStandings(seededMatches, "handball")],
    ["cricket", cricketStandings(seededMatches)],
  ] as const) {
    batch.set(_r().publicCollection("standings").doc(key), { rows });
  }
  await batch.commit();
  await handleRefreshProjections();
  return { bootstrapped: true, synchronized: true, teams: S9_TEAMS.length, players: S9_PLAYERS.length, matches: S9_SEEDED_MATCHES.length };
}

// --- CRUD Commands ---

export async function handleSaveTournamentSettings(data: CallableData) {
  const sportRules = data.sportRules && typeof data.sportRules === "object"
    ? normalizeSportRules(data.sportRules as Partial<SportRules>)
    : undefined;
  const allowed: DocumentData = {
    name: data.name ? asString(data.name, "Tournament name") : undefined,
    organizer: data.organizer ? asString(data.organizer, "Organizer") : undefined,
    startDate: data.startDate ?? undefined,
    endDate: data.endDate ?? undefined,
    venues: Array.isArray(data.venues) ? data.venues.map((value) => String(value).trim()).filter(Boolean) : undefined,
    sportRules,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: ACTOR.name,
  };
  await _r().privateRoot.set(allowed, { merge: true });
  const publicValue = { ...allowed };
  delete publicValue.updatedBy;
  await _r().publicRoot.set(publicValue, { merge: true });
  return { ok: true };
}

export async function handleSaveTeam(data: CallableData) {
  const id = asString(data.id, "Team ID");
  const current = await _r().privateCollection("teams").doc(id).get();
  if (!current.exists) throw new CommandError(404, "NOT_FOUND", "Team not found.");
  const team: DocumentData = {
    name: data.name ? asString(data.name, "Team name") : undefined,
    shortName: data.shortName ? asString(data.shortName, "Short name", 30) : undefined,
    color: data.color ? asString(data.color, "Team color", 20) : undefined,
    accentColor: data.accentColor ? asString(data.accentColor, "Accent color", 20) : undefined,
    logoUrl: data.logoUrl === null ? null : data.logoUrl ? asString(data.logoUrl, "Logo URL", 500) : undefined,
    captainId: data.captainId === null ? null : data.captainId ? asString(data.captainId, "Captain") : undefined,
    viceCaptainId: data.viceCaptainId === null ? null : data.viceCaptainId ? asString(data.viceCaptainId, "Vice captain") : undefined,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await writeMirrored("teams", id, team);
  await _r().privateCollection("teams").doc(id).set({ updatedBy: ACTOR.name }, { merge: true });
  return { id };
}

export async function handleSavePlayer(data: CallableData) {
  const id = data.id ? asString(data.id, "Player ID") : _r().privateCollection("players").doc().id;
  const teamId = asString(data.teamId, "Team");
  const team = await _r().privateCollection("teams").doc(teamId).get();
  if (!team.exists) throw new CommandError(400, "INVALID_ARGUMENT", "Choose a valid team.");
  const player: Player & DocumentData = {
    id,
    teamId,
    name: asString(data.name, "Player name"),
    jerseyNumber: data.jerseyNumber === null || data.jerseyNumber === undefined ? null : Number(data.jerseyNumber),
    role: (data.role ?? "unassigned") as Player["role"],
    battingStyle: data.battingStyle ? asString(data.battingStyle, "Batting style") : null,
    bowlingStyle: data.bowlingStyle ? asString(data.bowlingStyle, "Bowling style") : null,
    active: data.active !== false,
  };
  await writeMirrored("players", id, player, false);
  await _r().privateCollection("players").doc(id).set({ updatedBy: ACTOR.name }, { merge: true });
  return { id };
}

export async function handleCreateMatch(data: CallableData) {
  const fixture = validateFixture({
    sport: asString(data.sport, "Sport") as "football" | "handball" | "cricket",
    homeTeamId: asString(data.homeTeamId, "Home team"),
    awayTeamId: asString(data.awayTeamId, "Away team"),
    stage: (data.stage ?? "league") as "league" | "third-place" | "final",
    maxOvers: data.sport === "cricket" ? 5 : undefined,
  });
  const id = _r().privateCollection("matches").doc().id;
  const now = FieldValue.serverTimestamp();
  await _r().db.runTransaction(async (transaction) => {
    const sportQuery = _r().privateCollection("matches").where("sport", "==", fixture.sport);
    const existing = await transaction.get(sportQuery);
    if (existing.docs.some((snapshot) => {
      const row = snapshot.data();
      return row.stage === fixture.stage && [row.homeTeamId, row.awayTeamId].sort().join(":") === [fixture.homeTeamId, fixture.awayTeamId].sort().join(":");
    })) throw new CommandError(409, "ALREADY_EXISTS", "This matchup already exists for the stage.");
    const match: DocumentData = {
      id,
      ...fixture,
      matchNumber: nextMatchNumber(fixture.sport, existing.docs.map((snapshot) => String(snapshot.data().matchNumber ?? ""))),
      lineups: {},
      scoreSummary: fixture.sport === "cricket" ? { innings: [] } : { [fixture.homeTeamId]: 0, [fixture.awayTeamId]: 0 },
      revision: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: ACTOR.name,
      updatedBy: ACTOR.name,
    };
    transaction.create(_r().privateCollection("matches").doc(id), match);
    transaction.create(_r().publicCollection("matches").doc(id), publicMatch(match));
  });
  return { id, revision: 0 };
}

export async function handleUpdateMatch(data: CallableData) {
  const id = asString(data.matchId, "Match");
  const snapshot = await _r().privateCollection("matches").doc(id).get();
  if (!snapshot.exists) throw new CommandError(404, "NOT_FOUND", "Match not found.");
  if (snapshot.data()?.status === "live") throw new CommandError(400, "FAILED_PRECONDITION", "A live match cannot be rescheduled.");
  const update: DocumentData = {
    startsAt: data.startsAt ? asString(data.startsAt, "Start date") : undefined,
    venue: data.venue ? asString(data.venue, "Venue") : undefined,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: ACTOR.name,
  };
  await _r().privateCollection("matches").doc(id).set(update, { merge: true });
  const projection = { ...update };
  delete projection.updatedBy;
  await _r().publicCollection("matches").doc(id).set(projection, { merge: true });
  return { id };
}

export async function handleConfirmFixtures(data: CallableData) {
  const sport = asString(data.sport, "Sport");
  const value: DocumentData = { fixturesConfirmed: data.confirmed !== false, updatedAt: FieldValue.serverTimestamp() };
  await writeMirrored("sports", sport, value);
  await _r().privateCollection("sports").doc(sport).set({ updatedBy: ACTOR.name }, { merge: true });
  return { sport, confirmed: value.fixturesConfirmed };
}

// --- Match Mutations ---

interface MatchMutationResult {
  match: DocumentData;
  event?: DocumentData;
  deleteEventId?: string;
}

async function mutateMatch(data: CallableData, mutate: (match: DocumentData) => MatchMutationResult) {
  const matchId = asString(data.matchId, "Match");
  const commandId = asString(data.commandId, "Command ID");
  const expectedRevision = Number(data.expectedRevision);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    throw new CommandError(400, "INVALID_ARGUMENT", "Expected revision is required.");
  }
  const matchRef = _r().privateCollection("matches").doc(matchId);
  const publicMatchRef = _r().publicCollection("matches").doc(matchId);
  const receiptRef = _r().privateCollection("commandReceipts").doc(commandId);

  return _r().db.runTransaction(async (transaction) => {
    const receipt = await transaction.get(receiptRef);
    if (receipt.exists) return receipt.data()?.response;
    const snapshot = await transaction.get(matchRef);
    if (!snapshot.exists) throw new CommandError(404, "NOT_FOUND", "Match not found.");
    const current = snapshot.data()!;
    if (current.revision !== expectedRevision) {
      throw new CommandError(409, "ABORTED", "Data is out of sync. Please refresh the page and try again.");
    }
    const result = mutate(current);
    const next: DocumentData = {
      ...result.match,
      revision: current.revision + 1,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: ACTOR.name,
    };
    const response = { revision: next.revision, match: publicMatch(next) };
    transaction.set(matchRef, next);
    transaction.set(publicMatchRef, publicMatch(next));
    if (result.event) {
      const eventId = String(result.event.id ?? commandId);
      transaction.set(matchRef.collection("events").doc(eventId), { ...result.event, actorUid: ACTOR.uid, actorName: ACTOR.name });
      transaction.set(publicMatchRef.collection("events").doc(eventId), result.event);
    }
    if (result.deleteEventId) {
      transaction.delete(matchRef.collection("events").doc(result.deleteEventId));
      transaction.delete(publicMatchRef.collection("events").doc(result.deleteEventId));
    }
    transaction.create(receiptRef, { commandId, matchId, actorUid: ACTOR.uid, createdAt: FieldValue.serverTimestamp(), response });
    return response;
  });
}

export async function handleSetLineup(data: CallableData) {
  const rules = await getSportRules();
  const teamId = asString(data.teamId, "Team");
  const activePlayerIds = await getActivePlayerIds(teamId);
  return mutateMatch(data, (match) => {
    if (![match.homeTeamId, match.awayTeamId].includes(teamId)) throw new CommandError(400, "INVALID_ARGUMENT", "That team is not in this match.");
    if (!["scheduled", "lineup"].includes(match.status)) throw new CommandError(400, "FAILED_PRECONDITION", "Lineups can only be changed before scoring starts.");
    let starters: string[];
    let substitutes: string[];
    try {
      ({ starters, substitutes } = validateLineupSelection({
        sport: match.sport,
        starters: asStringArray(data.starters, "Starters"),
        substitutes: asStringArray(data.substitutes ?? [], "Substitutes"),
        activePlayerIds,
        rules,
      }));
    } catch (error) {
      throw new CommandError(400, "INVALID_ARGUMENT", (error as Error).message);
    }
    return { match: { ...match, lineups: { ...match.lineups, [teamId]: { starters, substitutes } } } };
  });
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
  const rules = await getSportRules();
  return mutateMatch(data, (match) => {
    if (match.status !== "scheduled" && match.status !== "lineup") throw new CommandError(400, "FAILED_PRECONDITION", "This match cannot be started.");
    ensureConfiguredLineups(match, rules);
    if (match.sport === "cricket") return { match: { ...match, status: "lineup" } };
    const fieldState = createFieldMatch(match.homeTeamId, match.awayTeamId);
    return { match: { ...match, status: "live", fieldState, scoreSummary: fieldState.score } };
  });
}

export async function handleStartInnings(data: CallableData) {
  const rules = await getSportRules();
  return mutateMatch(data, (match) => {
    if (match.sport !== "cricket") throw new CommandError(400, "FAILED_PRECONDITION", "This is not a cricket match.");
    const battingTeamId = asString(data.battingTeamId, "Batting team");
    const bowlingTeamId = asString(data.bowlingTeamId, "Bowling team");
    if (battingTeamId === bowlingTeamId || ![match.homeTeamId, match.awayTeamId].includes(battingTeamId) || ![match.homeTeamId, match.awayTeamId].includes(bowlingTeamId)) {
      throw new CommandError(400, "INVALID_ARGUMENT", "Choose the two teams in this fixture.");
    }
    ensureConfiguredLineups(match, rules);
    const battingLineup = teamLineup(match, battingTeamId).starters;
    const bowlingLineup = teamLineup(match, bowlingTeamId).starters;
    assertConfirmedEventPlayer(match, battingTeamId, asString(data.strikerId, "Striker"), "Striker");
    assertConfirmedEventPlayer(match, battingTeamId, asString(data.nonStrikerId, "Non-striker"), "Non-striker");
    assertConfirmedEventPlayer(match, bowlingTeamId, asString(data.bowlerId, "Bowler"), "Bowler");
    const initial = {
      battingTeamId,
      bowlingTeamId,
      battingLineup,
      bowlingLineup,
      strikerId: asString(data.strikerId, "Striker"),
      nonStrikerId: asString(data.nonStrikerId, "Non-striker"),
      bowlerId: asString(data.bowlerId, "Bowler"),
      maxOvers: data.superOver ? 1 : rules.cricket.maxOvers ?? 5,
    };
    let state: CricketInningsState;
    try { state = createCricketInnings(initial); } catch (error) { throw new CommandError(400, "INVALID_ARGUMENT", (error as Error).message); }
    const innings = [...(match.cricket?.innings ?? []), { initial, state, superOver: data.superOver === true }];
    return {
      match: { ...match, status: "live", cricket: { ...match.cricket, innings, currentInnings: innings.length - 1 }, scoreSummary: { innings: innings.map((entry) => ({ battingTeamId: entry.state.battingTeamId, score: entry.state.score, wickets: entry.state.wickets, overs: entry.state.overs })) } },
    };
  });
}

function cricketStatus(match: DocumentData, state: CricketInningsState) {
  const innings = match.cricket.innings as Array<{ state: CricketInningsState; superOver?: boolean }>;
  const index = match.cricket.currentInnings as number;
  const first = innings[0]?.state;
  const isChase = index % 2 === 1;
  const target = isChase ? (innings[index - 1]?.state.score ?? first?.score ?? 0) + 1 : null;
  const chaseWon = target !== null && state.score >= target;
  if (chaseWon) {
    const previous = innings[index - 1]?.state;
    return {
      status: "live",
      winnerTeamId: state.battingTeamId,
      resultText: cricketResultText(previous, state, seededTeamName),
      target,
    };
  }
  if (!state.completed) return { status: "live", target };
  if (!isChase) return { status: "innings-break", target: state.score + 1 };
  const previous = innings[index - 1]?.state;
  if (state.score === previous?.score) {
    return state.maxOvers === 1
      ? { status: "super-over", resultText: "Super Over tied - organizer result required", target }
      : { status: "super-over", resultText: "Scores tied - Super Over required", target };
  }
  return {
    status: "live",
    winnerTeamId: state.score > (previous?.score ?? 0) ? state.battingTeamId : state.bowlingTeamId,
    resultText: cricketResultText(previous, state, seededTeamName),
    target,
  };
}

export async function handleRecordCricketDelivery(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport !== "cricket" || match.status !== "live") throw new CommandError(400, "FAILED_PRECONDITION", "The cricket match is not live.");
    const index = match.cricket?.currentInnings;
    const innings = [...(match.cricket?.innings ?? [])];
    if (!Number.isInteger(index) || !innings[index]) throw new CommandError(400, "FAILED_PRECONDITION", "Start an innings first.");
    const input = data.delivery as CricketDeliveryInput;
    if (input.dismissal?.fielderId) {
      const bowlingTeamId = innings[index].state.bowlingTeamId;
      assertConfirmedEventPlayer(match, bowlingTeamId, input.dismissal.fielderId, "Fielder");
    }
    if (input.dismissal?.assistFielderId) {
      const bowlingTeamId = innings[index].state.bowlingTeamId;
      assertConfirmedEventPlayer(match, bowlingTeamId, input.dismissal.assistFielderId, "Assist fielder");
    }
    let state: CricketInningsState;
    try { state = applyCricketDelivery(innings[index].state, input); } catch (error) { throw new CommandError(400, "FAILED_PRECONDITION", (error as Error).message); }
    const event = state.events.at(-1)!;
    innings[index] = { ...innings[index], state };
    const outcome = cricketStatus({ ...match, cricket: { ...match.cricket, innings } }, state);
    return {
      match: { ...match, ...outcome, cricket: { ...match.cricket, innings }, scoreSummary: { innings: innings.map((entry) => ({ battingTeamId: entry.state.battingTeamId, score: entry.state.score, wickets: entry.state.wickets, overs: entry.state.overs })) } },
      event,
    };
  });
}

export async function handleSelectNextBatter(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport !== "cricket" || match.status !== "live") throw new CommandError(400, "FAILED_PRECONDITION", "The cricket match is not live.");
    const index = match.cricket?.currentInnings;
    const innings = [...(match.cricket?.innings ?? [])];
    if (!Number.isInteger(index) || !innings[index]) throw new CommandError(400, "FAILED_PRECONDITION", "Start an innings first.");
    try { innings[index] = { ...innings[index], state: applyNextBatter(innings[index].state, asString(data.playerId, "Next batter")) }; } catch (error) { throw new CommandError(400, "FAILED_PRECONDITION", (error as Error).message); }
    return { match: { ...match, cricket: { ...match.cricket, innings } } };
  });
}

export async function handleSelectCricketBowler(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport !== "cricket" || match.status !== "live") throw new CommandError(400, "FAILED_PRECONDITION", "The cricket match is not live.");
    const index = match.cricket?.currentInnings;
    const innings = [...(match.cricket?.innings ?? [])];
    if (!Number.isInteger(index) || !innings[index]) throw new CommandError(400, "FAILED_PRECONDITION", "Start an innings first.");
    try { innings[index] = { ...innings[index], state: applyCricketBowler(innings[index].state, asString(data.playerId, "Bowler")) }; } catch (error) { throw new CommandError(400, "FAILED_PRECONDITION", (error as Error).message); }
    return { match: { ...match, cricket: { ...match.cricket, innings } } };
  });
}

export async function handleRecordFieldSportEvent(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (!["football", "handball"].includes(match.sport) || match.status !== "live") throw new CommandError(400, "FAILED_PRECONDITION", "The field-sport match is not live.");
    const event = data.event as FieldMatchEventInput;
    assertConfirmedEventPlayer(match, event.teamId, event.playerId, "Player");
    if (event.assistPlayerId) assertConfirmedEventPlayer(match, event.teamId, event.assistPlayerId, "Assist player");
    let fieldState: FieldMatchState;
    try { fieldState = recordFieldEvent(match.fieldState, event); } catch (error) { throw new CommandError(400, "INVALID_ARGUMENT", (error as Error).message); }
    const recorded = fieldState.events.at(-1)!;
    return { match: { ...match, fieldState, scoreSummary: fieldState.score }, event: recorded };
  });
}

function replayField(match: DocumentData, events: FieldMatchEventInput[]) {
  return events.reduce((state, event) => recordFieldEvent(state, event), createFieldMatch(match.homeTeamId, match.awayTeamId));
}

export async function handleEditMatchEvent(data: CallableData) {
  return mutateMatch(data, (match) => {
    const eventId = asString(data.eventId, "Event");
    if (match.sport === "cricket") {
      const index = match.cricket.currentInnings as number;
      const innings = [...match.cricket.innings];
      const entry = innings[index];
      const eventIndex = entry.state.events.findIndex((event: { id: string }) => event.id === eventId);
      if (eventIndex < 0) throw new CommandError(404, "NOT_FOUND", "Event not found in the current innings.");
      const events = [...entry.state.events];
      events[eventIndex] = { ...events[eventIndex], ...(data.event as CricketDeliveryInput), id: eventId };
      innings[index] = { ...entry, state: recalculateCricketInnings(entry.initial, events) };
      return { match: { ...match, cricket: { ...match.cricket, innings } }, event: events[eventIndex] };
    }
    const events = [...(match.fieldState?.events ?? [])];
    const eventIndex = events.findIndex((event: { id: string }) => event.id === eventId);
    if (eventIndex < 0) throw new CommandError(404, "NOT_FOUND", "Event not found.");
    events[eventIndex] = { ...events[eventIndex], ...(data.event as FieldMatchEventInput), id: eventId };
    return { match: { ...match, fieldState: replayField(match, events), scoreSummary: replayField(match, events).score }, event: events[eventIndex] };
  });
}

export async function handleUndoLastEvent(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport === "cricket") {
      const index = match.cricket.currentInnings as number;
      const innings = [...match.cricket.innings];
      const entry = innings[index];
      const removed = entry.state.events.at(-1);
      if (!removed) throw new CommandError(400, "FAILED_PRECONDITION", "There is no delivery to undo.");
      innings[index] = { ...entry, state: recalculateCricketInnings(entry.initial, entry.state.events.slice(0, -1)) };
      return {
        match: {
          ...match,
          status: "live",
          winnerTeamId: null,
          resultText: null,
          cricket: { ...match.cricket, innings },
          scoreSummary: { innings: innings.map((entry) => ({ battingTeamId: entry.state.battingTeamId, score: entry.state.score, wickets: entry.state.wickets, overs: entry.state.overs })) },
        },
        deleteEventId: removed.id,
      };
    }
    const events = match.fieldState?.events ?? [];
    const removed = events.at(-1);
    if (!removed) throw new CommandError(400, "FAILED_PRECONDITION", "There is no event to undo.");
    return { match: { ...match, fieldState: replayField(match, events.slice(0, -1)), scoreSummary: replayField(match, events.slice(0, -1)).score }, deleteEventId: removed.id };
  });
}

export async function handleEndInnings(data: CallableData) {
  return mutateMatch(data, (match) => {
    if (match.sport !== "cricket" || !match.cricket?.innings?.length) throw new CommandError(400, "FAILED_PRECONDITION", "No cricket innings is active.");
    const index = match.cricket.currentInnings as number;
    const innings = [...match.cricket.innings];
    const state = { ...innings[index].state, completed: true } as CricketInningsState;
    innings[index] = { ...innings[index], state };
    return {
      match: {
        ...match,
        cricket: { ...match.cricket, innings },
        scoreSummary: { innings: innings.map((entry) => ({ battingTeamId: entry.state.battingTeamId, score: entry.state.score, wickets: entry.state.wickets, overs: entry.state.overs })) },
        ...cricketStatus({ ...match, cricket: { ...match.cricket, innings } }, state),
      },
    };
  });
}

export async function handleEndMatch(data: CallableData) {
  const response = await mutateMatch(data, (match) => {
    if (!["live", "innings-break", "super-over"].includes(match.status)) {
      throw new CommandError(400, "FAILED_PRECONDITION", "Only an active match can be completed.");
    }
    let completed = { ...match };
    if (["football", "handball"].includes(match.sport)) {
      completed = { ...completed, ...fieldResultText(match) };
    } else if (match.sport === "cricket") {
      if (!match.resultText) throw new CommandError(400, "FAILED_PRECONDITION", "Cricket result is not ready yet.");
    }
    const suggestions = suggestManOfTheMatch(completed);
    const manOfTheMatchPlayerId = data.manOfTheMatchPlayerId ? asString(data.manOfTheMatchPlayerId, "Man of the match") : "";
    if (!manOfTheMatchPlayerId) {
      throw new CommandError(400, "FAILED_PRECONDITION", JSON.stringify({
        reason: "MOTM_REQUIRED",
        message: "Select Man of the Match before completing this match.",
        suggestions,
      }));
    }
    const selectedTeamId = [completed.homeTeamId, completed.awayTeamId].find((teamId) => matchLineupIds(completed, teamId).includes(manOfTheMatchPlayerId));
    if (!selectedTeamId) throw new CommandError(400, "INVALID_ARGUMENT", "Man of the Match must be selected from confirmed lineups.");
    const breakdown = suggestions.find((row) => row.playerId === manOfTheMatchPlayerId) ?? null;
    return {
      match: {
        ...completed,
        status: "completed",
        manOfTheMatchPlayerId,
        manOfTheMatchSuggestedPlayerIds: suggestions.map((row) => row.playerId),
        manOfTheMatchScoreBreakdown: breakdown,
      },
    };
  });
  await handleRefreshProjections();
  return response;
}

// --- Awards ---

export async function handleConfirmAward(data: CallableData) {
  const id = data.id ? asString(data.id, "Award ID") : _r().privateCollection("awards").doc().id;
  const award: DocumentData = {
    id, type: asString(data.type, "Award type"), sport: asString(data.sport, "Sport"),
    playerId: data.playerId ? asString(data.playerId, "Player") : null,
    teamId: data.teamId ? asString(data.teamId, "Team") : null,
    matchId: data.matchId ? asString(data.matchId, "Match") : null,
    place: data.place === undefined ? null : Number(data.place),
    confirmed: true, updatedAt: FieldValue.serverTimestamp(),
  };
  await writeMirrored("awards", id, award, false);
  await _r().privateCollection("awards").doc(id).set({ updatedBy: ACTOR.name }, { merge: true });
  return { id };
}

export async function handleSetPlacementPoints(data: CallableData) {
  const sport = asString(data.sport, "Sport");
  const points = Array.isArray(data.points) ? data.points.map(Number) : [];
  if (points.length !== 4 || points.some((value) => !Number.isFinite(value))) throw new CommandError(400, "INVALID_ARGUMENT", "Provide points for first through fourth place.");
  await _r().privateRoot.set({ [`placementPoints.${sport}`]: points, updatedAt: FieldValue.serverTimestamp(), updatedBy: ACTOR.name }, { merge: true });
  await _r().publicRoot.set({ [`placementPoints.${sport}`]: points, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { sport, points };
}

// --- Projections ---

interface MatchRow {
  id: string;
  sport: "football" | "handball" | "cricket";
  stage: string;
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  winnerTeamId?: string | null;
  resultText?: string;
  scoreSummary?: Record<string, number>;
  fieldState?: { score: Record<string, number>; events: Array<Record<string, unknown>> };
  cricket?: { innings: Array<{ state: CricketInningsState; superOver?: boolean }> };
}

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
    else { home.draws += 1; away.draws += 1; home.points += 1; away.points += 1; }
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

export async function handleRefreshProjections() {
  const [matchSnapshots, awardSnapshots, tournamentSnapshot] = await Promise.all([
    _r().privateCollection("matches").get(), _r().privateCollection("awards").get(), _r().privateRoot.get(),
  ]);
  const matches = matchSnapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as MatchRow));
  const football = fieldStandings(matches, "football");
  const handball = fieldStandings(matches, "handball");
  const cricket = cricketStandings(matches);
  const placementPoints = (tournamentSnapshot.data()?.placementPoints as Record<string, number[]>) ?? { football: [10, 5, 3, 1], handball: [10, 5, 3, 1], cricket: [10, 5, 3, 1] };
  const placements = awardSnapshots.docs.map((s) => s.data()).filter((a) => a.type === "sport-placement" && a.confirmed && a.teamId && a.sport && a.place);
  const overall = S9_TEAMS.map((team) => {
    const sportScores = Object.fromEntries(["football", "handball", "cricket"].map((sport) => {
      const place = placements.find((row) => row.teamId === team.id && row.sport === sport)?.place;
      return [sport, place ? placementPoints[sport]?.[Number(place) - 1] ?? 0 : 0];
    })) as Record<string, number>;
    return { teamId: team.id, ...sportScores, total: Object.values(sportScores).reduce((s, v) => s + v, 0) };
  }).sort((a, b) => b.total - a.total || a.teamId.localeCompare(b.teamId)).map((row, index) => ({ ...row, rank: index + 1 }));

  const batch = _r().db.batch();
  batch.set(_r().publicCollection("standings").doc("football"), { rows: football });
  batch.set(_r().publicCollection("standings").doc("handball"), { rows: handball });
  batch.set(_r().publicCollection("standings").doc("cricket"), { rows: cricket });
  batch.set(_r().publicCollection("standings").doc("overall"), { rows: overall });
  batch.set(_r().publicCollection("leaderboards").doc("football"), { topScorers: fieldLeaders(matches, "football") });
  batch.set(_r().publicCollection("leaderboards").doc("handball"), { topScorers: fieldLeaders(matches, "handball") });
  batch.set(_r().publicCollection("leaderboards").doc("cricket"), cricketLeaders(matches));
  for (const sport of ["football", "handball"] as const) {
    const rows = sport === "football" ? football : handball;
    const second = rows[1]; const third = rows[2];
    const needsDecider = Boolean(second && third && second.wins === third.wins && second.goalDifference === third.goalDifference && second.goalsFor === third.goalsFor);
    batch.set(_r().publicCollection("brackets").doc(sport), { finalists: needsDecider ? [rows[0]?.teamId].filter(Boolean) : rows.slice(0, 2).map((r) => r.teamId), decider: needsDecider ? [second.teamId, third.teamId] : null });
  }
  batch.set(_r().publicCollection("brackets").doc("cricket"), { finalists: cricket.slice(0, 2).map((r) => r.teamId) });
  await batch.commit();
  return { ok: true };
}
