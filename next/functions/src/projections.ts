import { rankFieldStandings, S9_TEAMS, type CricketInningsState } from "@sports-fiesta/domain";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { REGION, TOURNAMENT_ID } from "./constants.js";
import { db, privateCollection, privateRoot, publicCollection } from "./firebase.js";

interface MatchRow {
  id: string;
  sport: "football" | "handball" | "cricket";
  stage: string;
  status: string;
  homeTeamId: string;
  awayTeamId: string;
  winnerTeamId?: string | null;
  scoreSummary?: Record<string, number>;
  fieldState?: { score: Record<string, number>; events: Array<Record<string, unknown>> };
  cricket?: { innings: Array<{ state: CricketInningsState; superOver?: boolean }> };
}

function emptyFieldRows() {
  return S9_TEAMS.map((team) => ({
    teamId: team.id,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));
}

function fieldStandings(matches: MatchRow[], sport: "football" | "handball") {
  const rows = emptyFieldRows();
  const byTeam = new Map(rows.map((row) => [row.teamId, row]));
  for (const match of matches.filter((row) => row.sport === sport && row.status === "completed" && row.stage === "league")) {
    const home = byTeam.get(match.homeTeamId)!;
    const away = byTeam.get(match.awayTeamId)!;
    const homeScore = match.fieldState?.score?.[match.homeTeamId] ?? 0;
    const awayScore = match.fieldState?.score?.[match.awayTeamId] ?? 0;
    home.played += 1;
    away.played += 1;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;
    if (match.winnerTeamId === match.homeTeamId || homeScore > awayScore) {
      home.wins += 1; home.points += 3; away.losses += 1;
    } else if (match.winnerTeamId === match.awayTeamId || awayScore > homeScore) {
      away.wins += 1; away.points += 3; home.losses += 1;
    } else {
      home.draws += 1; away.draws += 1; home.points += 1; away.points += 1;
    }
  }
  return rankFieldStandings(rows);
}

function cricketStandings(matches: MatchRow[]) {
  const rows = S9_TEAMS.map((team) => ({
    teamId: team.id,
    played: 0,
    wins: 0,
    ties: 0,
    losses: 0,
    points: 0,
    runsFor: 0,
    runsAgainst: 0,
    ballsFaced: 0,
    ballsBowled: 0,
    netRunRate: 0,
  }));
  const byTeam = new Map(rows.map((row) => [row.teamId, row]));
  for (const match of matches.filter((row) => row.sport === "cricket" && row.status === "completed" && row.stage === "league")) {
    const innings = (match.cricket?.innings ?? []).filter((entry) => !entry.superOver).slice(0, 2);
    if (innings.length < 2) continue;
    const [first, second] = innings.map((entry) => entry.state);
    for (const state of [first, second]) {
      const batting = byTeam.get(state.battingTeamId)!;
      const bowling = byTeam.get(state.bowlingTeamId)!;
      batting.runsFor += state.score;
      batting.ballsFaced += state.wickets >= state.battingLineup.length - 1 ? state.maxOvers * 6 : state.legalBalls;
      bowling.runsAgainst += state.score;
      bowling.ballsBowled += state.wickets >= state.battingLineup.length - 1 ? state.maxOvers * 6 : state.legalBalls;
    }
    const home = byTeam.get(match.homeTeamId)!;
    const away = byTeam.get(match.awayTeamId)!;
    home.played += 1; away.played += 1;
    if (match.winnerTeamId === home.teamId) {
      home.wins += 1; home.points += 2; away.losses += 1;
    } else if (match.winnerTeamId === away.teamId) {
      away.wins += 1; away.points += 2; home.losses += 1;
    } else {
      home.ties += 1; away.ties += 1; home.points += 1; away.points += 1;
    }
  }
  for (const row of rows) {
    const forRate = row.ballsFaced ? row.runsFor / (row.ballsFaced / 6) : 0;
    const againstRate = row.ballsBowled ? row.runsAgainst / (row.ballsBowled / 6) : 0;
    row.netRunRate = Number((forRate - againstRate).toFixed(3));
  }
  return rows
    .sort((a, b) => b.points - a.points || b.netRunRate - a.netRunRate || b.wins - a.wins || a.teamId.localeCompare(b.teamId))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function cricketLeaders(matches: MatchRow[]) {
  const players = new Map<string, {
    playerId: string; runs: number; innings: number; balls: number; wickets: number;
    bowlingRuns: number; bowlingBalls: number;
  }>();
  for (const match of matches.filter((row) => row.sport === "cricket")) {
    for (const entry of match.cricket?.innings ?? []) {
      for (const batter of Object.values(entry.state.batters)) {
        const row = players.get(batter.playerId) ?? {
          playerId: batter.playerId, runs: 0, innings: 0, balls: 0, wickets: 0, bowlingRuns: 0, bowlingBalls: 0,
        };
        row.runs += batter.runs; row.balls += batter.balls; row.innings += 1;
        players.set(batter.playerId, row);
      }
      for (const bowler of Object.values(entry.state.bowlers)) {
        const row = players.get(bowler.playerId) ?? {
          playerId: bowler.playerId, runs: 0, innings: 0, balls: 0, wickets: 0, bowlingRuns: 0, bowlingBalls: 0,
        };
        row.wickets += bowler.wickets; row.bowlingRuns += bowler.runs; row.bowlingBalls += bowler.legalBalls;
        players.set(bowler.playerId, row);
      }
    }
  }
  const values = [...players.values()].map((row) => ({
    ...row,
    strikeRate: row.balls ? Number(((row.runs / row.balls) * 100).toFixed(2)) : 0,
    economy: row.bowlingBalls ? Number(((row.bowlingRuns / row.bowlingBalls) * 6).toFixed(2)) : 0,
    bowlingStrikeRate: row.wickets ? Number((row.bowlingBalls / row.wickets).toFixed(2)) : null,
  }));
  return {
    orangeCap: [...values].sort((a, b) => b.runs - a.runs || a.innings - b.innings || b.strikeRate - a.strikeRate),
    purpleCap: [...values].sort((a, b) => b.wickets - a.wickets || a.economy - b.economy
      || (a.bowlingStrikeRate ?? Infinity) - (b.bowlingStrikeRate ?? Infinity)),
  };
}

function fieldLeaders(matches: MatchRow[], sport: "football" | "handball") {
  const scorers = new Map<string, { playerId: string; teamId: string; goals: number }>();
  for (const match of matches.filter((row) => row.sport === sport)) {
    for (const event of match.fieldState?.events ?? []) {
      if (event.type !== "goal" || typeof event.playerId !== "string" || typeof event.teamId !== "string") continue;
      const key = event.playerId;
      const row = scorers.get(key) ?? { playerId: key, teamId: event.teamId, goals: 0 };
      row.goals += 1;
      scorers.set(key, row);
    }
  }
  return [...scorers.values()].sort((a, b) => b.goals - a.goals || a.playerId.localeCompare(b.playerId));
}

async function refreshProjections() {
  const [matchSnapshots, disciplineSnapshots, awardSnapshots, tournamentSnapshot] = await Promise.all([
    privateCollection("matches").get(),
    privateCollection("discipline").get(),
    privateCollection("awards").get(),
    privateRoot.get(),
  ]);
  const matches = matchSnapshots.docs.map((snapshot) => ({ id: snapshot.id, ...snapshot.data() } as MatchRow));
  const football = fieldStandings(matches, "football");
  const handball = fieldStandings(matches, "handball");
  const cricket = cricketStandings(matches);
  const placementPoints = tournamentSnapshot.data()?.placementPoints ?? {
    football: [10, 5, 3, 1], handball: [10, 5, 3, 1], cricket: [10, 5, 3, 1],
  };
  const placements = awardSnapshots.docs
    .map((snapshot) => snapshot.data())
    .filter((award) => award.type === "sport-placement" && award.confirmed && award.teamId && award.sport && award.place);
  const discipline = new Map<string, number>();
  for (const snapshot of disciplineSnapshots.docs) {
    const row = snapshot.data();
    discipline.set(row.teamId, (discipline.get(row.teamId) ?? 0) + Number(row.points ?? 0));
  }
  const overall = S9_TEAMS.map((team) => {
    const sportScores = Object.fromEntries(["football", "handball", "cricket"].map((sport) => {
      const place = placements.find((row) => row.teamId === team.id && row.sport === sport)?.place;
      return [sport, place ? placementPoints[sport]?.[Number(place) - 1] ?? 0 : 0];
    })) as Record<string, number>;
    const disciplinePoints = discipline.get(team.id) ?? 0;
    return {
      teamId: team.id,
      ...sportScores,
      discipline: disciplinePoints,
      total: Object.values(sportScores).reduce((sum, value) => sum + value, 0) + disciplinePoints,
    };
  }).sort((a, b) => b.total - a.total || a.teamId.localeCompare(b.teamId))
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const batch = db.batch();
  batch.set(publicCollection("standings").doc("football"), { rows: football });
  batch.set(publicCollection("standings").doc("handball"), { rows: handball });
  batch.set(publicCollection("standings").doc("cricket"), { rows: cricket });
  batch.set(publicCollection("standings").doc("overall"), { rows: overall });
  batch.set(publicCollection("leaderboards").doc("football"), { topScorers: fieldLeaders(matches, "football") });
  batch.set(publicCollection("leaderboards").doc("handball"), { topScorers: fieldLeaders(matches, "handball") });
  batch.set(publicCollection("leaderboards").doc("cricket"), cricketLeaders(matches));
  for (const sport of ["football", "handball"] as const) {
    const rows = sport === "football" ? football : handball;
    const second = rows[1];
    const third = rows[2];
    const needsDecider = Boolean(second && third
      && second.wins === third.wins
      && second.goalDifference === third.goalDifference
      && second.goalsFor === third.goalsFor);
    batch.set(publicCollection("brackets").doc(sport), {
      finalists: needsDecider ? [rows[0]?.teamId].filter(Boolean) : rows.slice(0, 2).map((row) => row.teamId),
      decider: needsDecider ? [second.teamId, third.teamId] : null,
    });
  }
  batch.set(publicCollection("brackets").doc("cricket"), {
    finalists: cricket.slice(0, 2).map((row) => row.teamId),
  });
  await batch.commit();
}

const triggerOptions = { region: REGION, document: `tournaments/${TOURNAMENT_ID}/{collection}/{documentId}` };

export const refreshTournamentProjections = onDocumentWritten(triggerOptions, async (event) => {
  if (!["matches", "discipline", "awards"].includes(event.params.collection)) return;
  await refreshProjections();
});

export { refreshProjections };
