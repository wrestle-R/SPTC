import type { Player, SeedMatch, Team } from "./types";

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

const rosterNumbers = {
  crimson: [10, 99, 8, 7, 29, 17, 7, 6, 3, 1, 3, 16, 44, 10, 4, 13, 17, 29, 20],
  gladiators: [9, 22, 10, 1, 12, 7, 4, 28, 1, 18, 7, 11, 14, 13, 9, 2, 17, 5, 23],
  knights: [17, 22, 2, 3, 14, 15, 1, null, 10, 28, 13, 29, 24, 7, null, 16, 5, 12, 5],
  ivory: [10, 14, 11, 8, 9, 7, 29, 9, 4, 5, 21, 7, 22, 32, 24, 4, 17, 6, null, 7],
} as const satisfies Record<keyof typeof rosterNames, readonly (number | null)[]>;

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
    color: "#047857",
    accentColor: "#00a86b",
    logoUrl: null,
    captainId: null,
    viceCaptainId: null,
  },
  {
    id: "karuppu-knights",
    name: "Karuppu Knights",
    shortName: "Knights",
    color: "#09090b",
    accentColor: "#18181b",
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

function roster(teamId: string, names: readonly string[], numbers: readonly (number | null)[]): Player[] {
  if (names.length !== numbers.length) throw new Error(`Jersey numbers do not match the ${teamId} roster.`);
  return names.map((name, index) => ({
    id: `${teamId}-${slugify(name)}-${index + 1}`,
    teamId,
    name,
    jerseyNumber: numbers[index],
    role: "unassigned",
    battingStyle: null,
    bowlingStyle: null,
    active: true,
  }));
}

export const S9_PLAYERS: Player[] = [
  ...roster("crimson-warriors", rosterNames.crimson, rosterNumbers.crimson),
  ...roster("gods-gladiators", rosterNames.gladiators, rosterNumbers.gladiators),
  ...roster("karuppu-knights", rosterNames.knights, rosterNumbers.knights),
  ...roster("ivory-elites", rosterNames.ivory, rosterNumbers.ivory),
];

function scheduledMatch(
  id: string,
  sport: SeedMatch["sport"],
  matchNumber: string,
  homeTeamId: string,
  awayTeamId: string,
): SeedMatch {
  return {
    id,
    sport,
    stage: "league",
    status: "scheduled",
    homeTeamId,
    awayTeamId,
    matchNumber,
    revision: 0,
    scoreSummary: sport === "cricket"
      ? { innings: [] }
      : { [homeTeamId]: 0, [awayTeamId]: 0 },
  };
}

export const S9_SEEDED_MATCHES: SeedMatch[] = [
  scheduledMatch("football-001", "football", "FB-001", "ivory-elites", "gods-gladiators"),
  scheduledMatch("football-002", "football", "FB-002", "karuppu-knights", "crimson-warriors"),
  scheduledMatch("football-003", "football", "FB-003", "gods-gladiators", "crimson-warriors"),
  scheduledMatch("football-004", "football", "FB-004", "karuppu-knights", "ivory-elites"),
  scheduledMatch("football-005", "football", "FB-005", "ivory-elites", "crimson-warriors"),
  scheduledMatch("football-006", "football", "FB-006", "gods-gladiators", "karuppu-knights"),

  scheduledMatch("handball-001", "handball", "HB-001", "crimson-warriors", "karuppu-knights"),
  scheduledMatch("handball-002", "handball", "HB-002", "gods-gladiators", "ivory-elites"),
  scheduledMatch("handball-003", "handball", "HB-003", "karuppu-knights", "gods-gladiators"),
  scheduledMatch("handball-004", "handball", "HB-004", "crimson-warriors", "ivory-elites"),

  scheduledMatch("throwball-001", "throwball", "TB-001", "karuppu-knights", "gods-gladiators"),
  scheduledMatch("throwball-002", "throwball", "TB-002", "ivory-elites", "crimson-warriors"),

  scheduledMatch("cricket-001", "cricket", "CR-001", "ivory-elites", "karuppu-knights"),
  scheduledMatch("cricket-002", "cricket", "CR-002", "crimson-warriors", "gods-gladiators"),
  scheduledMatch("cricket-003", "cricket", "CR-003", "karuppu-knights", "crimson-warriors"),
  scheduledMatch("cricket-004", "cricket", "CR-004", "ivory-elites", "gods-gladiators"),
];

export const S9_SPORTS = [
  { id: "football", name: "Football", status: "active" },
  { id: "handball", name: "Handball", status: "active" },
  { id: "cricket", name: "Cricket", status: "active" },
  { id: "throwball", name: "Throwball", status: "active" },
  { id: "relay-race", name: "Relay Race", status: "coming-soon" },
  { id: "kids-game", name: "Kids' Game", status: "coming-soon" },
  { id: "womens-game", name: "Women's Game", status: "coming-soon" },
] as const;
