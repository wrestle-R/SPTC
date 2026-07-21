import {
  createCricketInnings,
  createFieldMatch,
  recalculateCricketInnings,
  recordCricketDelivery as applyCricketDelivery,
  recordFieldEvent,
  setCricketBowler as applyCricketBowler,
  setNextBatter as applyNextBatter,
  validateFixture,
  type CricketDeliveryInput,
  type CricketInningsState,
  type FieldMatchEventInput,
  type FieldMatchState,
  type Player,
  type Team,
} from "@sports-fiesta/domain";
import { FieldValue, type DocumentData, type Transaction } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { requireOrganizer } from "./auth.js";
import { REGION } from "./constants.js";
import { db, privateCollection, privateRoot, publicCollection, publicRoot } from "./firebase.js";

type Actor = { uid: string; name: string };
type CallableData = Record<string, unknown>;

function asString(value: unknown, label: string, max = 160) {
  const result = String(value ?? "").trim();
  if (!result || result.length > max) throw new HttpsError("invalid-argument", `${label} is required.`);
  return result;
}

function asStringArray(value: unknown, label: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new HttpsError("invalid-argument", `${label} must be a list of player IDs.`);
  }
  return [...new Set(value as string[])];
}

function organizerCallable(handler: (data: CallableData, actor: Actor) => Promise<unknown>) {
  return onCall({ region: REGION }, async (request) => handler(request.data ?? {}, requireOrganizer(request)));
}

function publicMatch(match: DocumentData) {
  const { createdBy: _createdBy, updatedBy: _updatedBy, ...projection } = match;
  return projection;
}

async function writeMirrored(collection: string, id: string, value: DocumentData, merge = true) {
  const batch = db.batch();
  batch.set(privateCollection(collection).doc(id), value, { merge });
  batch.set(publicCollection(collection).doc(id), value, { merge });
  await batch.commit();
}

export const saveTournamentSettings = organizerCallable(async (data, actor) => {
  const allowed = {
    name: data.name ? asString(data.name, "Tournament name") : undefined,
    organizer: data.organizer ? asString(data.organizer, "Organizer") : undefined,
    startDate: data.startDate ?? undefined,
    endDate: data.endDate ?? undefined,
    venues: Array.isArray(data.venues) ? data.venues.map((value) => String(value).trim()).filter(Boolean) : undefined,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.name,
  };
  await privateRoot.set(allowed, { merge: true });
  const { updatedBy: _updatedBy, ...publicValue } = allowed;
  await publicRoot.set(publicValue, { merge: true });
  return { ok: true };
});

export const saveTeam = organizerCallable(async (data, actor) => {
  const id = asString(data.id, "Team ID");
  const current = await privateCollection("teams").doc(id).get();
  if (!current.exists) throw new HttpsError("not-found", "Team not found.");
  const team: DocumentData = {
    name: data.name ? asString(data.name, "Team name") : undefined,
    shortName: data.shortName ? asString(data.shortName, "Short name", 30) : undefined,
    color: data.color ? asString(data.color, "Team color", 20) : undefined,
    accentColor: data.accentColor ? asString(data.accentColor, "Accent color", 20) : undefined,
    logoUrl: data.logoUrl === null ? null : data.logoUrl ? asString(data.logoUrl, "Logo URL", 500) : undefined,
    captainId: data.captainId === null ? null : data.captainId ? asString(data.captainId, "Captain") : undefined,
    viceCaptainId: data.viceCaptainId === null
      ? null
      : data.viceCaptainId ? asString(data.viceCaptainId, "Vice captain") : undefined,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await writeMirrored("teams", id, team);
  await privateCollection("teams").doc(id).set({ updatedBy: actor.name }, { merge: true });
  return { id };
});

export const savePlayer = organizerCallable(async (data, actor) => {
  const id = data.id ? asString(data.id, "Player ID") : privateCollection("players").doc().id;
  const teamId = asString(data.teamId, "Team");
  const team = await privateCollection("teams").doc(teamId).get();
  if (!team.exists) throw new HttpsError("invalid-argument", "Choose a valid team.");
  const player: Player & DocumentData = {
    id,
    teamId,
    name: asString(data.name, "Player name"),
    jerseyNumber: data.jerseyNumber === null || data.jerseyNumber === undefined
      ? null
      : Number(data.jerseyNumber),
    role: (data.role ?? "unassigned") as Player["role"],
    battingStyle: data.battingStyle ? asString(data.battingStyle, "Batting style") : null,
    bowlingStyle: data.bowlingStyle ? asString(data.bowlingStyle, "Bowling style") : null,
    active: data.active !== false,
  };
  await writeMirrored("players", id, player, false);
  await privateCollection("players").doc(id).set({ updatedBy: actor.name }, { merge: true });
  return { id };
});

export const createMatch = organizerCallable(async (data, actor) => {
  const fixture = validateFixture({
    sport: asString(data.sport, "Sport") as "football" | "handball" | "cricket",
    homeTeamId: asString(data.homeTeamId, "Home team"),
    awayTeamId: asString(data.awayTeamId, "Away team"),
    startsAt: asString(data.startsAt, "Start date"),
    venue: asString(data.venue, "Venue"),
    stage: (data.stage ?? "league") as "league" | "semifinal" | "final",
    maxOvers: data.sport === "cricket" ? 5 : undefined,
  });
  const id = privateCollection("matches").doc().id;
  const now = FieldValue.serverTimestamp();
  const match = {
    id,
    ...fixture,
    lineups: {},
    scoreSummary: fixture.sport === "cricket" ? { innings: [] } : {
      [fixture.homeTeamId]: 0,
      [fixture.awayTeamId]: 0,
    },
    revision: 0,
    createdAt: now,
    updatedAt: now,
    createdBy: actor.name,
    updatedBy: actor.name,
  };
  await db.runTransaction(async (transaction) => {
    const duplicateQuery = privateCollection("matches")
      .where("sport", "==", fixture.sport)
      .where("stage", "==", fixture.stage);
    const existing = await transaction.get(duplicateQuery);
    const duplicate = existing.docs.some((snapshot) => {
      const row = snapshot.data();
      return [row.homeTeamId, row.awayTeamId].sort().join(":")
        === [fixture.homeTeamId, fixture.awayTeamId].sort().join(":");
    });
    if (duplicate) throw new HttpsError("already-exists", "This matchup already exists for the stage.");
    transaction.create(privateCollection("matches").doc(id), match);
    transaction.create(publicCollection("matches").doc(id), publicMatch(match));
  });
  return { id, revision: 0 };
});

export const updateMatch = organizerCallable(async (data, actor) => {
  const id = asString(data.matchId, "Match");
  const snapshot = await privateCollection("matches").doc(id).get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Match not found.");
  if (snapshot.data()?.status === "live") throw new HttpsError("failed-precondition", "A live match cannot be rescheduled.");
  const update = {
    startsAt: data.startsAt ? asString(data.startsAt, "Start date") : undefined,
    venue: data.venue ? asString(data.venue, "Venue") : undefined,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.name,
  };
  await privateCollection("matches").doc(id).set(update, { merge: true });
  const { updatedBy: _updatedBy, ...projection } = update;
  await publicCollection("matches").doc(id).set(projection, { merge: true });
  return { id };
});

export const confirmFixtures = organizerCallable(async (data, actor) => {
  const sport = asString(data.sport, "Sport");
  const value = {
    fixturesConfirmed: data.confirmed !== false,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await writeMirrored("sports", sport, value);
  await privateCollection("sports").doc(sport).set({ updatedBy: actor.name }, { merge: true });
  return { sport, confirmed: value.fixturesConfirmed };
});

interface MatchMutationResult {
  match: DocumentData;
  event?: DocumentData;
  deleteEventId?: string;
}

async function mutateMatch(
  data: CallableData,
  actor: Actor,
  mutate: (match: DocumentData) => MatchMutationResult,
) {
  const matchId = asString(data.matchId, "Match");
  const commandId = asString(data.commandId, "Command ID");
  const expectedRevision = Number(data.expectedRevision);
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
    throw new HttpsError("invalid-argument", "Expected revision is required.");
  }
  const matchRef = privateCollection("matches").doc(matchId);
  const publicMatchRef = publicCollection("matches").doc(matchId);
  const receiptRef = privateCollection("commandReceipts").doc(commandId);

  return db.runTransaction(async (transaction) => {
    const receipt = await transaction.get(receiptRef);
    if (receipt.exists) return receipt.data()?.response;
    const snapshot = await transaction.get(matchRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "Match not found.");
    const current = snapshot.data()!;
    if (current.revision !== expectedRevision) {
      throw new HttpsError("aborted", "The match changed on another scorer. Refresh and try again.", {
        code: "REVISION_CONFLICT",
        currentRevision: current.revision,
      });
    }
    const result = mutate(current);
    const next = {
      ...result.match,
      revision: current.revision + 1,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: actor.name,
    };
    const response = { revision: next.revision, match: publicMatch(next) };
    transaction.set(matchRef, next);
    transaction.set(publicMatchRef, publicMatch(next));
    if (result.event) {
      const eventId = String(result.event.id ?? commandId);
      transaction.set(matchRef.collection("events").doc(eventId), {
        ...result.event,
        actorUid: actor.uid,
        actorName: actor.name,
      });
      transaction.set(publicMatchRef.collection("events").doc(eventId), result.event);
    }
    if (result.deleteEventId) {
      transaction.delete(matchRef.collection("events").doc(result.deleteEventId));
      transaction.delete(publicMatchRef.collection("events").doc(result.deleteEventId));
    }
    transaction.create(receiptRef, {
      commandId,
      matchId,
      actorUid: actor.uid,
      createdAt: FieldValue.serverTimestamp(),
      response,
    });
    return response;
  });
}

export const setLineup = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  const teamId = asString(data.teamId, "Team");
  if (![match.homeTeamId, match.awayTeamId].includes(teamId)) {
    throw new HttpsError("invalid-argument", "That team is not in this match.");
  }
  const starters = asStringArray(data.starters, "Starters");
  const substitutes = asStringArray(data.substitutes ?? [], "Substitutes");
  return { match: { ...match, lineups: { ...match.lineups, [teamId]: { starters, substitutes } } } };
}));

export const setToss = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  if (match.sport !== "cricket") throw new HttpsError("failed-precondition", "Toss applies only to cricket.");
  const winnerTeamId = asString(data.winnerTeamId, "Toss winner");
  if (![match.homeTeamId, match.awayTeamId].includes(winnerTeamId)) {
    throw new HttpsError("invalid-argument", "Toss winner must be in this match.");
  }
  const decision = data.decision === "bowl" ? "bowl" : "bat";
  return { match: { ...match, toss: { winnerTeamId, decision } } };
}));

export const startMatch = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  if (match.status !== "scheduled" && match.status !== "lineup") {
    throw new HttpsError("failed-precondition", "This match cannot be started.");
  }
  if (match.sport === "cricket") return { match: { ...match, status: "lineup" } };
  const fieldState = createFieldMatch(match.homeTeamId, match.awayTeamId);
  return { match: { ...match, status: "live", fieldState, scoreSummary: fieldState.score } };
}));

export const startInnings = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  if (match.sport !== "cricket") throw new HttpsError("failed-precondition", "This is not a cricket match.");
  const battingTeamId = asString(data.battingTeamId, "Batting team");
  const bowlingTeamId = asString(data.bowlingTeamId, "Bowling team");
  if (battingTeamId === bowlingTeamId || ![match.homeTeamId, match.awayTeamId].includes(battingTeamId)
    || ![match.homeTeamId, match.awayTeamId].includes(bowlingTeamId)) {
    throw new HttpsError("invalid-argument", "Choose the two teams in this fixture.");
  }
  const initial = {
    battingTeamId,
    bowlingTeamId,
    battingLineup: asStringArray(data.battingLineup, "Batting lineup"),
    bowlingLineup: asStringArray(data.bowlingLineup, "Bowling lineup"),
    strikerId: asString(data.strikerId, "Striker"),
    nonStrikerId: asString(data.nonStrikerId, "Non-striker"),
    bowlerId: asString(data.bowlerId, "Bowler"),
    maxOvers: data.superOver ? 1 : 5,
  };
  let state: CricketInningsState;
  try {
    state = createCricketInnings(initial);
  } catch (error) {
    throw new HttpsError("invalid-argument", (error as Error).message);
  }
  const innings = [...(match.cricket?.innings ?? []), { initial, state, superOver: data.superOver === true }];
  return {
    match: {
      ...match,
      status: "live",
      cricket: { ...match.cricket, innings, currentInnings: innings.length - 1 },
      scoreSummary: { innings: innings.map((entry) => ({
        battingTeamId: entry.state.battingTeamId,
        score: entry.state.score,
        wickets: entry.state.wickets,
        overs: entry.state.overs,
      })) },
    },
  };
}));

function cricketStatus(match: DocumentData, state: CricketInningsState) {
  const innings = match.cricket.innings as Array<{ state: CricketInningsState; superOver?: boolean }>;
  const index = match.cricket.currentInnings as number;
  const first = innings[0]?.state;
  const isChase = index % 2 === 1;
  const target = isChase ? (innings[index - 1]?.state.score ?? first?.score ?? 0) + 1 : null;
  const chaseWon = target !== null && state.score >= target;
  if (chaseWon) return { status: "completed", winnerTeamId: state.battingTeamId, target };
  if (!state.completed) return { status: "live", target };
  if (!isChase) return { status: "innings-break", target: state.score + 1 };
  const previous = innings[index - 1]?.state;
  if (state.score === previous?.score) {
    return state.maxOvers === 1
      ? { status: "completed", resultText: "Super Over tied - resolution pending", target }
      : { status: "super-over", resultText: "Scores tied - Super Over required", target };
  }
  return {
    status: "completed",
    winnerTeamId: state.score > (previous?.score ?? 0) ? state.battingTeamId : state.bowlingTeamId,
    target,
  };
}

export const recordCricketDelivery = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  if (match.sport !== "cricket" || match.status !== "live") {
    throw new HttpsError("failed-precondition", "The cricket match is not live.");
  }
  const index = match.cricket?.currentInnings;
  const innings = [...(match.cricket?.innings ?? [])];
  if (!Number.isInteger(index) || !innings[index]) throw new HttpsError("failed-precondition", "Start an innings first.");
  const input = data.delivery as CricketDeliveryInput;
  let state: CricketInningsState;
  try {
    state = applyCricketDelivery(innings[index].state, input);
  } catch (error) {
    throw new HttpsError("failed-precondition", (error as Error).message);
  }
  const event = state.events.at(-1)!;
  innings[index] = { ...innings[index], state };
  const outcome = cricketStatus({ ...match, cricket: { ...match.cricket, innings } }, state);
  const next = {
    ...match,
    ...outcome,
    cricket: { ...match.cricket, innings },
    scoreSummary: { innings: innings.map((entry) => ({
      battingTeamId: entry.state.battingTeamId,
      score: entry.state.score,
      wickets: entry.state.wickets,
      overs: entry.state.overs,
    })) },
  };
  return { match: next, event };
}));

export const selectNextBatter = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  if (match.sport !== "cricket" || match.status !== "live") {
    throw new HttpsError("failed-precondition", "The cricket match is not live.");
  }
  const index = match.cricket?.currentInnings;
  const innings = [...(match.cricket?.innings ?? [])];
  if (!Number.isInteger(index) || !innings[index]) throw new HttpsError("failed-precondition", "Start an innings first.");
  try {
    innings[index] = {
      ...innings[index],
      state: applyNextBatter(innings[index].state, asString(data.playerId, "Next batter")),
    };
  } catch (error) {
    throw new HttpsError("failed-precondition", (error as Error).message);
  }
  return { match: { ...match, cricket: { ...match.cricket, innings } } };
}));

export const selectCricketBowler = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  if (match.sport !== "cricket" || match.status !== "live") {
    throw new HttpsError("failed-precondition", "The cricket match is not live.");
  }
  const index = match.cricket?.currentInnings;
  const innings = [...(match.cricket?.innings ?? [])];
  if (!Number.isInteger(index) || !innings[index]) throw new HttpsError("failed-precondition", "Start an innings first.");
  try {
    innings[index] = {
      ...innings[index],
      state: applyCricketBowler(innings[index].state, asString(data.playerId, "Bowler")),
    };
  } catch (error) {
    throw new HttpsError("failed-precondition", (error as Error).message);
  }
  return { match: { ...match, cricket: { ...match.cricket, innings } } };
}));

export const recordFieldSportEvent = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  if (!["football", "handball"].includes(match.sport) || match.status !== "live") {
    throw new HttpsError("failed-precondition", "The field-sport match is not live.");
  }
  let fieldState: FieldMatchState;
  try {
    fieldState = recordFieldEvent(match.fieldState, data.event as FieldMatchEventInput);
  } catch (error) {
    throw new HttpsError("invalid-argument", (error as Error).message);
  }
  const event = fieldState.events.at(-1)!;
  return { match: { ...match, fieldState, scoreSummary: fieldState.score }, event };
}));

function replayField(match: DocumentData, events: FieldMatchEventInput[]) {
  return events.reduce(
    (state, event) => recordFieldEvent(state, event),
    createFieldMatch(match.homeTeamId, match.awayTeamId),
  );
}

export const editMatchEvent = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  const eventId = asString(data.eventId, "Event");
  if (match.sport === "cricket") {
    const index = match.cricket.currentInnings as number;
    const innings = [...match.cricket.innings];
    const entry = innings[index];
    const eventIndex = entry.state.events.findIndex((event: { id: string }) => event.id === eventId);
    if (eventIndex < 0) throw new HttpsError("not-found", "Event not found in the current innings.");
    const events = [...entry.state.events];
    events[eventIndex] = { ...events[eventIndex], ...(data.event as CricketDeliveryInput), id: eventId };
    const state = recalculateCricketInnings(entry.initial, events);
    innings[index] = { ...entry, state };
    return { match: { ...match, cricket: { ...match.cricket, innings } }, event: events[eventIndex] };
  }
  const events = [...(match.fieldState?.events ?? [])];
  const eventIndex = events.findIndex((event: { id: string }) => event.id === eventId);
  if (eventIndex < 0) throw new HttpsError("not-found", "Event not found.");
  events[eventIndex] = { ...events[eventIndex], ...(data.event as FieldMatchEventInput), id: eventId };
  const fieldState = replayField(match, events);
  return { match: { ...match, fieldState, scoreSummary: fieldState.score }, event: events[eventIndex] };
}));

export const undoLastEvent = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  if (match.sport === "cricket") {
    const index = match.cricket.currentInnings as number;
    const innings = [...match.cricket.innings];
    const entry = innings[index];
    const removed = entry.state.events.at(-1);
    if (!removed) throw new HttpsError("failed-precondition", "There is no delivery to undo.");
    const state = recalculateCricketInnings(entry.initial, entry.state.events.slice(0, -1));
    innings[index] = { ...entry, state };
    return {
      match: { ...match, status: "live", cricket: { ...match.cricket, innings } },
      deleteEventId: removed.id,
    };
  }
  const events = match.fieldState?.events ?? [];
  const removed = events.at(-1);
  if (!removed) throw new HttpsError("failed-precondition", "There is no event to undo.");
  const fieldState = replayField(match, events.slice(0, -1));
  return {
    match: { ...match, fieldState, scoreSummary: fieldState.score },
    deleteEventId: removed.id,
  };
}));

export const endInnings = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => {
  if (match.sport !== "cricket" || !match.cricket?.innings?.length) {
    throw new HttpsError("failed-precondition", "No cricket innings is active.");
  }
  const index = match.cricket.currentInnings as number;
  const innings = [...match.cricket.innings];
  const state = { ...innings[index].state, completed: true } as CricketInningsState;
  innings[index] = { ...innings[index], state };
  const withInnings = { ...match, cricket: { ...match.cricket, innings } };
  return { match: { ...withInnings, ...cricketStatus(withInnings, state) } };
}));

export const endMatch = organizerCallable((data, actor) => mutateMatch(data, actor, (match) => ({
  match: {
    ...match,
    status: "completed",
    winnerTeamId: data.winnerTeamId ? asString(data.winnerTeamId, "Winner") : null,
    resultText: data.resultText ? asString(data.resultText, "Result", 300) : undefined,
  },
})));

export const confirmAward = organizerCallable(async (data, actor) => {
  const id = data.id ? asString(data.id, "Award ID") : privateCollection("awards").doc().id;
  const award = {
    id,
    type: asString(data.type, "Award type"),
    sport: asString(data.sport, "Sport"),
    playerId: data.playerId ? asString(data.playerId, "Player") : null,
    teamId: data.teamId ? asString(data.teamId, "Team") : null,
    matchId: data.matchId ? asString(data.matchId, "Match") : null,
    place: data.place === undefined ? null : Number(data.place),
    confirmed: true,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await writeMirrored("awards", id, award, false);
  await privateCollection("awards").doc(id).set({ updatedBy: actor.name }, { merge: true });
  return { id };
});

export const addDisciplineAdjustment = organizerCallable(async (data, actor) => {
  const id = privateCollection("discipline").doc().id;
  const points = Number(data.points);
  if (!Number.isFinite(points) || points < -100 || points > 100) {
    throw new HttpsError("invalid-argument", "Points must be between -100 and 100.");
  }
  const adjustment = {
    id,
    teamId: asString(data.teamId, "Team"),
    points,
    reason: asString(data.reason, "Reason", 240),
    createdAt: FieldValue.serverTimestamp(),
  };
  await writeMirrored("discipline", id, adjustment, false);
  await privateCollection("discipline").doc(id).set({ createdBy: actor.name }, { merge: true });
  return { id };
});

export const setPlacementPoints = organizerCallable(async (data, actor) => {
  const sport = asString(data.sport, "Sport");
  const points = Array.isArray(data.points) ? data.points.map(Number) : [];
  if (points.length !== 4 || points.some((value) => !Number.isFinite(value))) {
    throw new HttpsError("invalid-argument", "Provide points for first through fourth place.");
  }
  await privateRoot.set({
    [`placementPoints.${sport}`]: points,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: actor.name,
  }, { merge: true });
  await publicRoot.set({
    [`placementPoints.${sport}`]: points,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  return { sport, points };
});
