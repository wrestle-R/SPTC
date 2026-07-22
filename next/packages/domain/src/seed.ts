import { cricketResultText, recalculateCricketInnings } from "./cricket";
import type { CreateInningsInput } from "./cricket";
import type { CricketDelivery, CricketDeliveryInput, FieldMatchEvent, Player, SeedMatch, Team, TeamId } from "./types";

const rosterNames = {
  crimson: [
    "Daniel Russel Paul", "Glen Gladin", "Sam Jeyaraj", "Jovin Samraj", "Melvin Benn",
    "Aaron Ditto", "Johan Jagdish", "Jenson Shaji", "Daniel Ratnaraj", "Edwin Anburaj",
    "Jemima John", "Rachel Edwin", "Hannah Mano", "Sharon Jane", "Cressida Jebastin",
    "Suja Jebakumar", "Christy Jagdish", "Anita Ditto", "Kaitlyn Eve",
  ],
  gladiators: [
    "Patrick Joshua", "Edben Kruze", "Jeshurun Edwin", "John Rajesh", "Febin Jagdish",
    "Jeffrey Jebakumar", "Eric Edison", "Jabez Singh", "Ditto Lazar", "Benson Wilson", "Joselin Daniel",
    "Rheanna Robinson", "Maria Antony", "Andrea Joyal", "Jyotimani Wilson", "Esther Robins",
    "Sumitha Jackson", "Candice Jebastin", "Judith John",
  ],
  knights: [
    "Jonathan Kirubaharan", "Jerome Jebakumar", "Terry Aldrin", "Jagdish", "Leroy Kinskumar",
    "Abraham Joyal", "Ethan Russel", "Michael Antony", "Robins Duncan", "Jackson Andrews", "Eunice Edison",
    "Celeste Ditto", "Euvance Edison", "Joselin Golda", "Jas Johh", "Jency Sony",
    "Stella Daniel", "Jenefa Praiselin", "Ansel James",
  ],
  ivory: [
    "Sheldon Benson", "Harrison Peter", "Akshay James", "Immanuel J", "Kevin Joash",
    "Frederick John", "Jovin Jora", "Austin Sundarraj", "Robinson Samuel", "Jebakumar",
    "Jebastin David", "Alecia Wilson", "Johannah Jackson", "Andrea Prakash", "Rhowena Robinson",
    "Rani Edwin", "Geeta Benson", "Thulasi Edwin", "Margaret Michael", "Annette Maria",
  ],
} as const;

export const S9_TEAMS: Team[] = [
  {
    id: "crimson-warriors",
    name: "Crimson Warriors",
    shortName: "Crimson",
    color: "#dc2626",
    accentColor: "#ef4444",
    logoUrl: null,
    captainId: null,
    viceCaptainId: null,
  },
  {
    id: "gods-gladiators",
    name: "God's Gladiators",
    shortName: "Gladiators",
    color: "#1d4ed8",
    accentColor: "#3b82f6",
    logoUrl: null,
    captainId: null,
    viceCaptainId: null,
  },
  {
    id: "karuppu-knights",
    name: "Karuppu Knights",
    shortName: "Knights",
    color: "#52525b",
    accentColor: "#a1a1aa",
    logoUrl: null,
    captainId: null,
    viceCaptainId: null,
  },
  {
    id: "ivory-elites",
    name: "Ivory Elites",
    shortName: "Ivory",
    color: "#f8fafc",
    accentColor: "#f8fafc",
    logoUrl: null,
    captainId: null,
    viceCaptainId: null,
  },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function roster(teamId: string, names: readonly string[]): Player[] {
  return names.map((name, index) => ({
    id: `${teamId}-${slugify(name)}-${index + 1}`,
    teamId,
    name,
    jerseyNumber: null,
    role: "unassigned",
    battingStyle: null,
    bowlingStyle: null,
    active: true,
  }));
}

export const S9_PLAYERS: Player[] = [
  ...roster("crimson-warriors", rosterNames.crimson),
  ...roster("gods-gladiators", rosterNames.gladiators),
  ...roster("karuppu-knights", rosterNames.knights),
  ...roster("ivory-elites", rosterNames.ivory),
];

type SeedDelivery = CricketDeliveryInput & Partial<Pick<CricketDelivery, "bowlerId" | "strikerId">>;

function teamName(teamId: string) {
  return S9_TEAMS.find((team) => team.id === teamId)?.name ?? "Team";
}

function teamPlayers(teamId: TeamId, count = 8) {
  return S9_PLAYERS.filter((player) => player.teamId === teamId).slice(0, count).map((player) => player.id);
}

function player(teamId: TeamId, index: number) {
  return teamPlayers(teamId, Math.max(index + 1, 8))[index];
}

function fieldState(
  homeTeamId: TeamId,
  awayTeamId: TeamId,
  homeScore: number,
  awayScore: number,
  events: FieldMatchEvent[],
) {
  return {
    teamIds: [homeTeamId, awayTeamId] as [TeamId, TeamId],
    score: { [homeTeamId]: homeScore, [awayTeamId]: awayScore },
    shootout: { [homeTeamId]: 0, [awayTeamId]: 0 },
    events,
  };
}

function fieldEvent(id: string, type: FieldMatchEvent["type"], teamId: TeamId, playerId: string, minute: number): FieldMatchEvent {
  return { id, type, teamId, playerId, minute, timestamp: `2026-07-21T09:${String(minute).padStart(2, "0")}:00.000Z` };
}

function innings(initial: CreateInningsInput, deliveries: SeedDelivery[]) {
  return recalculateCricketInnings(initial, deliveries as CricketDeliveryInput[]);
}

const crimsonLineup = teamPlayers("crimson-warriors");
const gladiatorsLineup = teamPlayers("gods-gladiators");
const knightsLineup = teamPlayers("karuppu-knights");
const ivoryLineup = teamPlayers("ivory-elites");

const completedCricketFirstInitial: CreateInningsInput = {
  battingTeamId: "gods-gladiators",
  bowlingTeamId: "crimson-warriors",
  battingLineup: gladiatorsLineup,
  bowlingLineup: crimsonLineup,
  strikerId: player("gods-gladiators", 0),
  nonStrikerId: player("gods-gladiators", 1),
  bowlerId: player("crimson-warriors", 1),
  maxOvers: 5,
};

const completedCricketFirst = innings(completedCricketFirstInitial, [
  { runsOffBat: 1 }, { runsOffBat: 4 }, { runsOffBat: 0 }, { runsOffBat: 1 }, { runsOffBat: 2 }, { runsOffBat: 0 },
  { bowlerId: player("crimson-warriors", 2), runsOffBat: 6 }, { runsOffBat: 0 }, { runsOffBat: 0, dismissal: { type: "bowled", playerOutId: player("gods-gladiators", 1) } }, { strikerId: player("gods-gladiators", 2), runsOffBat: 1 }, { runsOffBat: 1 }, { runsOffBat: 0 },
  { bowlerId: player("crimson-warriors", 3), runsOffBat: 2 }, { runsOffBat: 2 }, { runsOffBat: 1 }, { runsOffBat: 0 }, { runsOffBat: 4 }, { runsOffBat: 1 },
  { bowlerId: player("crimson-warriors", 5), runsOffBat: 0 }, { runsOffBat: 1 }, { runsOffBat: 1 }, { runsOffBat: 0, dismissal: { type: "caught", playerOutId: player("gods-gladiators", 2), fielderId: player("crimson-warriors", 0) } }, { strikerId: player("gods-gladiators", 3), runsOffBat: 2 }, { runsOffBat: 0 },
  { bowlerId: player("crimson-warriors", 1), runsOffBat: 4 }, { runsOffBat: 1 }, { runsOffBat: 0 }, { runsOffBat: 2 }, { runsOffBat: 1 }, { runsOffBat: 2 },
]);

const completedCricketSecondInitial: CreateInningsInput = {
  battingTeamId: "crimson-warriors",
  bowlingTeamId: "gods-gladiators",
  battingLineup: crimsonLineup,
  bowlingLineup: gladiatorsLineup,
  strikerId: player("crimson-warriors", 0),
  nonStrikerId: player("crimson-warriors", 1),
  bowlerId: player("gods-gladiators", 0),
  maxOvers: 5,
};

const completedCricketSecond = innings(completedCricketSecondInitial, [
  { runsOffBat: 4 }, { runsOffBat: 1 }, { runsOffBat: 0 }, { runsOffBat: 6 }, { runsOffBat: 1 }, { runsOffBat: 2 },
  { bowlerId: player("gods-gladiators", 1), runsOffBat: 0 }, { runsOffBat: 0, dismissal: { type: "caught", playerOutId: player("crimson-warriors", 1), fielderId: player("gods-gladiators", 3) } }, { strikerId: player("crimson-warriors", 2), runsOffBat: 4 }, { runsOffBat: 1 }, { runsOffBat: 1 }, { runsOffBat: 0 },
  { bowlerId: player("gods-gladiators", 0), runsOffBat: 6 }, { runsOffBat: 4 }, { runsOffBat: 1 }, { runsOffBat: 0 }, { runsOffBat: 2 }, { runsOffBat: 1 },
  { bowlerId: player("gods-gladiators", 1), runsOffBat: 1 }, { runsOffBat: 4 }, { runsOffBat: 1 }, { runsOffBat: 1 },
]);

const liveCricketFirstInitial: CreateInningsInput = {
  battingTeamId: "karuppu-knights",
  bowlingTeamId: "ivory-elites",
  battingLineup: knightsLineup,
  bowlingLineup: ivoryLineup,
  strikerId: player("karuppu-knights", 0),
  nonStrikerId: player("karuppu-knights", 1),
  bowlerId: player("ivory-elites", 0),
  maxOvers: 5,
};

const liveCricketFirst = innings(liveCricketFirstInitial, [
  { runsOffBat: 4 }, { runsOffBat: 2 }, { runsOffBat: 1 }, { runsOffBat: 0 }, { runsOffBat: 6 }, { runsOffBat: 1 },
  { bowlerId: player("ivory-elites", 1), runsOffBat: 0 }, { runsOffBat: 1 }, { runsOffBat: 4 }, { runsOffBat: 1 }, { runsOffBat: 2 }, { runsOffBat: 0 },
  { bowlerId: player("ivory-elites", 2), runsOffBat: 6 }, { runsOffBat: 1 }, { runsOffBat: 0, dismissal: { type: "bowled", playerOutId: player("karuppu-knights", 1) } }, { strikerId: player("karuppu-knights", 2), runsOffBat: 1 }, { runsOffBat: 4 }, { runsOffBat: 1 },
  { bowlerId: player("ivory-elites", 3), runsOffBat: 2 }, { runsOffBat: 0 }, { runsOffBat: 1 }, { runsOffBat: 1 }, { runsOffBat: 4 }, { runsOffBat: 0 },
  { bowlerId: player("ivory-elites", 0), runsOffBat: 1 }, { runsOffBat: 2 }, { runsOffBat: 1 }, { runsOffBat: 0 }, { runsOffBat: 1 }, { runsOffBat: 1 },
]);

const liveCricketSecondInitial: CreateInningsInput = {
  battingTeamId: "ivory-elites",
  bowlingTeamId: "karuppu-knights",
  battingLineup: ivoryLineup,
  bowlingLineup: knightsLineup,
  strikerId: player("ivory-elites", 0),
  nonStrikerId: player("ivory-elites", 1),
  bowlerId: player("karuppu-knights", 0),
  maxOvers: 5,
};

const liveCricketSecond = innings(liveCricketSecondInitial, [
  { runsOffBat: 4 }, { runsOffBat: 1 }, { runsOffBat: 0 }, { runsOffBat: 2 }, { runsOffBat: 1 }, { runsOffBat: 0 },
  { bowlerId: player("karuppu-knights", 1), runsOffBat: 6 }, { runsOffBat: 0 }, { runsOffBat: 1 }, { runsOffBat: 1 }, { runsOffBat: 0 }, { runsOffBat: 2 },
  { bowlerId: player("karuppu-knights", 2), runsOffBat: 1 }, { runsOffBat: 4 }, { runsOffBat: 0, dismissal: { type: "caught", playerOutId: player("ivory-elites", 1), fielderId: player("karuppu-knights", 3) } }, { strikerId: player("ivory-elites", 2), runsOffBat: 1 }, { runsOffBat: 2 }, { runsOffBat: 4 },
]);

export const S9_SEEDED_MATCHES: SeedMatch[] = [
  {
    id: "football-live-1",
    sport: "football",
    stage: "league",
    status: "live",
    homeTeamId: "crimson-warriors",
    awayTeamId: "gods-gladiators",
    matchNumber: "FB-01",
    venue: "Main Ground",
    revision: 0,
    lineups: {},
    fieldState: fieldState("crimson-warriors", "gods-gladiators", 1, 1, [
      fieldEvent("event-1", "goal", "crimson-warriors", player("crimson-warriors", 0), 12),
      fieldEvent("event-2", "goal", "gods-gladiators", player("gods-gladiators", 0), 29),
    ]),
    scoreSummary: { "crimson-warriors": 1, "gods-gladiators": 1 },
  },
  {
    id: "football-completed-1",
    sport: "football",
    stage: "league",
    status: "completed",
    homeTeamId: "karuppu-knights",
    awayTeamId: "ivory-elites",
    matchNumber: "FB-02",
    venue: "Main Ground",
    revision: 0,
    lineups: {},
    fieldState: fieldState("karuppu-knights", "ivory-elites", 2, 1, [
      fieldEvent("event-1", "goal", "karuppu-knights", player("karuppu-knights", 0), 9),
      fieldEvent("event-2", "goal", "ivory-elites", player("ivory-elites", 0), 18),
      fieldEvent("event-3", "goal", "karuppu-knights", player("karuppu-knights", 1), 34),
    ]),
    scoreSummary: { "karuppu-knights": 2, "ivory-elites": 1 },
    winnerTeamId: "karuppu-knights",
    resultText: "Karuppu Knights beat Ivory Elites 2-1",
  },
  {
    id: "handball-live-1",
    sport: "handball",
    stage: "league",
    status: "live",
    homeTeamId: "ivory-elites",
    awayTeamId: "crimson-warriors",
    matchNumber: "HB-01",
    venue: "Indoor Court",
    revision: 0,
    lineups: {},
    fieldState: fieldState("ivory-elites", "crimson-warriors", 6, 5, [
      fieldEvent("event-1", "goal", "ivory-elites", player("ivory-elites", 1), 4),
      fieldEvent("event-2", "goal", "crimson-warriors", player("crimson-warriors", 2), 5),
      fieldEvent("event-3", "goal", "ivory-elites", player("ivory-elites", 2), 7),
      fieldEvent("event-4", "goal", "crimson-warriors", player("crimson-warriors", 3), 10),
      fieldEvent("event-5", "goal", "ivory-elites", player("ivory-elites", 3), 13),
      fieldEvent("event-6", "goal", "crimson-warriors", player("crimson-warriors", 4), 16),
      fieldEvent("event-7", "goal", "ivory-elites", player("ivory-elites", 4), 19),
      fieldEvent("event-8", "goal", "crimson-warriors", player("crimson-warriors", 5), 22),
      fieldEvent("event-9", "goal", "ivory-elites", player("ivory-elites", 5), 25),
      fieldEvent("event-10", "goal", "crimson-warriors", player("crimson-warriors", 6), 28),
      fieldEvent("event-11", "goal", "ivory-elites", player("ivory-elites", 6), 31),
    ]),
    scoreSummary: { "ivory-elites": 6, "crimson-warriors": 5 },
  },
  {
    id: "handball-completed-1",
    sport: "handball",
    stage: "league",
    status: "completed",
    homeTeamId: "gods-gladiators",
    awayTeamId: "karuppu-knights",
    matchNumber: "HB-02",
    venue: "Indoor Court",
    revision: 0,
    lineups: {},
    fieldState: fieldState("gods-gladiators", "karuppu-knights", 11, 9, [
      fieldEvent("event-1", "goal", "gods-gladiators", player("gods-gladiators", 1), 3),
      fieldEvent("event-2", "goal", "karuppu-knights", player("karuppu-knights", 2), 6),
      fieldEvent("event-3", "goal", "gods-gladiators", player("gods-gladiators", 3), 12),
      fieldEvent("event-4", "goal", "karuppu-knights", player("karuppu-knights", 3), 14),
      fieldEvent("event-5", "goal", "gods-gladiators", player("gods-gladiators", 4), 16),
      fieldEvent("event-6", "goal", "gods-gladiators", player("gods-gladiators", 5), 18),
      fieldEvent("event-7", "goal", "karuppu-knights", player("karuppu-knights", 4), 20),
      fieldEvent("event-8", "goal", "gods-gladiators", player("gods-gladiators", 6), 22),
      fieldEvent("event-9", "goal", "karuppu-knights", player("karuppu-knights", 5), 24),
      fieldEvent("event-10", "goal", "gods-gladiators", player("gods-gladiators", 7), 26),
      fieldEvent("event-11", "goal", "karuppu-knights", player("karuppu-knights", 6), 28),
      fieldEvent("event-12", "goal", "gods-gladiators", player("gods-gladiators", 8), 30),
      fieldEvent("event-13", "goal", "karuppu-knights", player("karuppu-knights", 7), 32),
      fieldEvent("event-14", "goal", "gods-gladiators", player("gods-gladiators", 9), 34),
      fieldEvent("event-15", "goal", "karuppu-knights", player("karuppu-knights", 8), 36),
      fieldEvent("event-16", "goal", "gods-gladiators", player("gods-gladiators", 10), 38),
      fieldEvent("event-17", "goal", "karuppu-knights", player("karuppu-knights", 9), 40),
      fieldEvent("event-18", "goal", "gods-gladiators", player("gods-gladiators", 0), 42),
      fieldEvent("event-19", "goal", "karuppu-knights", player("karuppu-knights", 10), 44),
      fieldEvent("event-20", "goal", "gods-gladiators", player("gods-gladiators", 1), 46),
    ]),
    scoreSummary: { "gods-gladiators": 11, "karuppu-knights": 9 },
    winnerTeamId: "gods-gladiators",
    resultText: "God's Gladiators beat Karuppu Knights 11-9",
  },
  {
    id: "cricket-live-1",
    sport: "cricket",
    stage: "league",
    status: "live",
    homeTeamId: "karuppu-knights",
    awayTeamId: "ivory-elites",
    matchNumber: "CR-01",
    venue: "Main Ground",
    revision: 0,
    lineups: {},
    cricket: {
      innings: [
        { initial: liveCricketFirstInitial, state: { ...liveCricketFirst, completed: true } },
        { initial: liveCricketSecondInitial, state: liveCricketSecond },
      ],
      currentInnings: 1,
    },
    scoreSummary: {
      innings: [
        { battingTeamId: liveCricketFirst.battingTeamId, score: liveCricketFirst.score, wickets: liveCricketFirst.wickets, overs: liveCricketFirst.overs },
        { battingTeamId: liveCricketSecond.battingTeamId, score: liveCricketSecond.score, wickets: liveCricketSecond.wickets, overs: liveCricketSecond.overs },
      ],
    },
  },
  {
    id: "cricket-completed-1",
    sport: "cricket",
    stage: "league",
    status: "completed",
    homeTeamId: "crimson-warriors",
    awayTeamId: "gods-gladiators",
    matchNumber: "CR-02",
    venue: "Main Ground",
    revision: 0,
    lineups: {},
    cricket: {
      innings: [
        { initial: completedCricketFirstInitial, state: { ...completedCricketFirst, completed: true } },
        { initial: completedCricketSecondInitial, state: { ...completedCricketSecond, completed: true } },
      ],
      currentInnings: 1,
    },
    scoreSummary: {
      innings: [
        { battingTeamId: completedCricketFirst.battingTeamId, score: completedCricketFirst.score, wickets: completedCricketFirst.wickets, overs: completedCricketFirst.overs },
        { battingTeamId: completedCricketSecond.battingTeamId, score: completedCricketSecond.score, wickets: completedCricketSecond.wickets, overs: completedCricketSecond.overs },
      ],
    },
    winnerTeamId: "crimson-warriors",
    resultText: cricketResultText(completedCricketFirst, completedCricketSecond, teamName) ?? "Crimson Warriors beat God's Gladiators by 6 wickets",
  },
];

export const S9_SPORTS = [
  { id: "football", name: "Football", status: "active" },
  { id: "handball", name: "Handball", status: "active" },
  { id: "cricket", name: "Cricket", status: "active" },
  { id: "throwball", name: "Throwball", status: "coming-soon" },
  { id: "relay-race", name: "Relay Race", status: "coming-soon" },
  { id: "kids-game", name: "Kids' Game", status: "coming-soon" },
  { id: "womens-game", name: "Women's Game", status: "coming-soon" },
] as const;
