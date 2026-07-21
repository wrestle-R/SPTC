import type { Player, Team } from "./types";

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
    color: "#15803d",
    accentColor: "#22c55e",
    logoUrl: null,
    captainId: null,
    viceCaptainId: null,
  },
  {
    id: "karuppu-knights",
    name: "Karuppu Knights",
    shortName: "Knights",
    color: "#18181b",
    accentColor: "#cbd5e1",
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

export const S9_SPORTS = [
  { id: "football", name: "Football", status: "active" },
  { id: "handball", name: "Handball", status: "active" },
  { id: "cricket", name: "Cricket", status: "active" },
  { id: "throwball", name: "Throwball", status: "coming-soon" },
  { id: "relay-race", name: "Relay Race", status: "coming-soon" },
  { id: "kids-game", name: "Kids' Game", status: "coming-soon" },
  { id: "womens-game", name: "Women's Game", status: "coming-soon" },
] as const;
