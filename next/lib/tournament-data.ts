import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Goal,
  Home,
  KeyRound,
  ListChecks,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

export type Team = {
  id: string;
  name: string;
  shortName: string;
  colorName: string;
  accent: string;
  softAccent: string;
  roster: string[];
};

export type Player = {
  name: string;
  teamId: string;
  role: "Batter" | "Bowler" | "Forward" | "Goalkeeper" | "All-rounder";
};

export type SportEvent = {
  id: string;
  name: string;
  icon: string;
  status: "Live" | "Ready" | "Coming soon";
  summary: string;
};

export type Fixture = {
  id: string;
  sport: "Football" | "Handball" | "Cricket";
  stage: "Group Stage" | "Decider" | "Final";
  teamAId: string;
  teamBId: string;
  scoreA: string;
  scoreB: string;
  status: "Live" | "Upcoming" | "Finished";
  venue: string;
  time: string;
  highlight: string;
};

export type Standing = {
  teamId: string;
  football: number;
  cricket: number;
  handball: number;
  discipline: number;
  wins: number;
};

export type LeaderboardEntry = {
  player: string;
  teamId: string;
  metric: string;
  value: number | string;
};

export type DisciplineEntry = {
  id: string;
  teamId: string;
  points: number;
  reason: string;
  organizer: string;
  time: string;
};

export type AuditLogEntry = {
  id: string;
  actor: string;
  action: string;
  area: string;
  time: string;
};

export type NavGroup = {
  label: string;
  items: {
    title: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
    badge?: string;
  }[];
};

export const teams: Team[] = [
  {
    id: "black",
    name: "Karuppu Knights",
    shortName: "Black",
    colorName: "Silver",
    accent: "#cbd5e1",
    softAccent: "rgba(203, 213, 225, 0.14)",
    roster: [
      "Jonathan Kirubaharan",
      "Jerome Jebakumar",
      "Terry Aldrin",
      "Jagdish",
      "Leroy Kinskumar",
      "Abraham Joyal",
      "Ethan Russel",
      "Robins Duncan",
      "Jackson Andrews",
      "Eunice Edison",
      "Celeste Ditto",
      "Euvance Edison",
      "Joselin Golda",
      "Jas Johh",
      "Jency Sony",
      "Stella Daniel",
      "Ansel James",
    ],
  },
  {
    id: "green",
    name: "God's Gladiators",
    shortName: "Green",
    colorName: "Green",
    accent: "#39d77a",
    softAccent: "rgba(57, 215, 122, 0.14)",
    roster: [
      "Patrick Joshua",
      "Edben Kruze",
      "Jeshurun Edwin",
      "John Rajesh",
      "Febin Jagdish",
      "Jeffrey Jebakumar",
      "Eric Edison",
      "Ditto Lazar",
      "Benson Wilson",
      "Joselin Daniel",
      "Rheanna Robinson",
      "Maria Antony",
      "Andrea Joyal",
      "Jyotimani Wilson",
      "Esther Robins",
      "Sumitha Jackson",
      "Candice Jebastin",
      "Judith John",
    ],
  },
  {
    id: "white",
    name: "Ivory Elites",
    shortName: "White",
    colorName: "Ivory",
    accent: "#fff1c9",
    softAccent: "rgba(255, 241, 201, 0.13)",
    roster: [
      "Sheldon Benson",
      "Harrison Peter",
      "Akshay James",
      "Immanuel J",
      "Kevin Joash",
      "Frederick John",
      "Jovin Daniel",
      "Austin Sundarraj",
      "Robinson Samuel",
      "Jebakumar",
      "Jebastin David",
      "Alecia Wilson",
      "Johannah Jackson",
      "Andrea Prakash",
      "Rhowena Robinson",
      "Rani Edwin",
      "Geeta Benson",
      "Thulasi Edwin",
      "Annette Maria",
    ],
  },
  {
    id: "red",
    name: "Crimson Warriors",
    shortName: "Red",
    colorName: "Red",
    accent: "#f05969",
    softAccent: "rgba(240, 89, 105, 0.14)",
    roster: [
      "Daniel Russel Paul",
      "Glen Gladin",
      "Sam Jeyaraj",
      "Jovin Samraj",
      "Melvin Benn",
      "Aaron Ditto",
      "Johan Jagdish",
      "Jenson Shaji",
      "Daniel Ratnaraj",
      "Edwin Anburaj",
      "Jemima John",
      "Rachel Edwin",
      "Hannah Mano",
      "Sharon Jane",
      "Cressida Jebastin",
      "Suja Jebakumar",
      "Christy Jagdish",
      "Kaitlyn Eve",
    ],
  },
];

export const events: SportEvent[] = [
  {
    id: "football",
    name: "Football",
    icon: "⚽",
    status: "Live",
    summary: "Group stage, cards, scorers, decider, final bracket",
  },
  {
    id: "cricket",
    name: "Cricket",
    icon: "🏏",
    status: "Ready",
    summary: "5-over scoring, innings state, Orange and Purple caps",
  },
  {
    id: "handball",
    name: "Handball",
    icon: "🤾",
    status: "Ready",
    summary: "Goal events, cards, standings, final bracket",
  },
  {
    id: "throwball",
    name: "Throwball",
    icon: "🏐",
    status: "Coming soon",
    summary: "Placeholder event, ready to activate later",
  },
  {
    id: "relay",
    name: "Relay Race",
    icon: "🏃",
    status: "Coming soon",
    summary: "Placeholder event, ready to activate later",
  },
  {
    id: "kids",
    name: "Kids' Game",
    icon: "👧",
    status: "Coming soon",
    summary: "Placeholder event, ready to activate later",
  },
  {
    id: "women",
    name: "Women's Game",
    icon: "👩",
    status: "Coming soon",
    summary: "Placeholder event, ready to activate later",
  },
];

export const standings: Standing[] = [
  { teamId: "green", football: 10, cricket: 8, handball: 7, discipline: 2, wins: 5 },
  { teamId: "white", football: 5, cricket: 10, handball: 6, discipline: -1, wins: 4 },
  { teamId: "red", football: 7, cricket: 4, handball: 9, discipline: 3, wins: 4 },
  { teamId: "black", football: 8, cricket: 6, handball: 4, discipline: 1, wins: 3 },
];

export const fixtures: Fixture[] = [
  {
    id: "fb-green-red",
    sport: "Football",
    stage: "Group Stage",
    teamAId: "green",
    teamBId: "red",
    scoreA: "2",
    scoreB: "1",
    status: "Live",
    venue: "Main Ground",
    time: "Now",
    highlight: "Glen added the last goal event",
  },
  {
    id: "cr-white-black",
    sport: "Cricket",
    stage: "Group Stage",
    teamAId: "white",
    teamBId: "black",
    scoreA: "47/2",
    scoreB: "Yet to bat",
    status: "Upcoming",
    venue: "Cricket Pitch",
    time: "11:40 AM",
    highlight: "5 overs per innings",
  },
  {
    id: "hb-red-white",
    sport: "Handball",
    stage: "Group Stage",
    teamAId: "red",
    teamBId: "white",
    scoreA: "8",
    scoreB: "8",
    status: "Finished",
    venue: "Indoor Court",
    time: "10:20 AM",
    highlight: "Draw keeps final race open",
  },
  {
    id: "fb-black-white",
    sport: "Football",
    stage: "Decider",
    teamAId: "black",
    teamBId: "white",
    scoreA: "-",
    scoreB: "-",
    status: "Upcoming",
    venue: "Main Ground",
    time: "1:30 PM",
    highlight: "Winner reaches final",
  },
  {
    id: "hb-green-red-final",
    sport: "Handball",
    stage: "Final",
    teamAId: "green",
    teamBId: "red",
    scoreA: "-",
    scoreB: "-",
    status: "Upcoming",
    venue: "Indoor Court",
    time: "3:00 PM",
    highlight: "Champion badge pending",
  },
];

export const players: Player[] = [
  { name: "Patrick Joshua", teamId: "green", role: "Forward" },
  { name: "Sheldon Benson", teamId: "white", role: "Batter" },
  { name: "Jerome Jebakumar", teamId: "black", role: "Bowler" },
  { name: "Daniel Russel Paul", teamId: "red", role: "All-rounder" },
  { name: "Frederick John", teamId: "white", role: "Bowler" },
  { name: "Glen Gladin", teamId: "red", role: "Forward" },
  { name: "Jeshurun Edwin", teamId: "green", role: "All-rounder" },
  { name: "Robinson Samuel", teamId: "white", role: "Goalkeeper" },
];

export const orangeCap: LeaderboardEntry[] = [
  { player: "Sheldon Benson", teamId: "white", metric: "Runs", value: 46 },
  { player: "Patrick Joshua", teamId: "green", metric: "Runs", value: 39 },
  { player: "Daniel Russel Paul", teamId: "red", metric: "Runs", value: 32 },
  { player: "Jonathan Kirubaharan", teamId: "black", metric: "Runs", value: 28 },
];

export const purpleCap: LeaderboardEntry[] = [
  { player: "Jerome Jebakumar", teamId: "black", metric: "Wickets", value: 5 },
  { player: "Frederick John", teamId: "white", metric: "Wickets", value: 4 },
  { player: "Jeshurun Edwin", teamId: "green", metric: "Wickets", value: 3 },
  { player: "Aaron Ditto", teamId: "red", metric: "Wickets", value: 2 },
];

export const topScorers: LeaderboardEntry[] = [
  { player: "Glen Gladin", teamId: "red", metric: "Football goals", value: 4 },
  { player: "Patrick Joshua", teamId: "green", metric: "Football goals", value: 3 },
  { player: "Jovin Daniel", teamId: "white", metric: "Handball goals", value: 6 },
  { player: "Leroy Kinskumar", teamId: "black", metric: "Handball goals", value: 5 },
];

export const disciplineEntries: DisciplineEntry[] = [
  {
    id: "disc-1",
    teamId: "green",
    points: 2,
    reason: "Helped reset court equipment between matches",
    organizer: "Patrick",
    time: "09:42 AM",
  },
  {
    id: "disc-2",
    teamId: "red",
    points: 3,
    reason: "Excellent cleanup support after handball",
    organizer: "Sheldon",
    time: "10:35 AM",
  },
  {
    id: "disc-3",
    teamId: "white",
    points: -1,
    reason: "Late reporting to cricket fixture",
    organizer: "Jeshu",
    time: "10:48 AM",
  },
  {
    id: "disc-4",
    teamId: "black",
    points: 1,
    reason: "Sportsmanship during disputed throw-in",
    organizer: "Glen",
    time: "11:05 AM",
  },
];

export const auditTrail: AuditLogEntry[] = [
  {
    id: "audit-1",
    actor: "Patrick",
    action: "Confirmed football group fixtures",
    area: "Fixtures",
    time: "09:15 AM",
  },
  {
    id: "audit-2",
    actor: "Glen",
    action: "Added goal for God's Gladiators",
    area: "Live Scores",
    time: "10:02 AM",
  },
  {
    id: "audit-3",
    actor: "Sheldon",
    action: "Submitted +3 discipline points for Crimson Warriors",
    area: "Discipline",
    time: "10:35 AM",
  },
  {
    id: "audit-4",
    actor: "Jeshu",
    action: "Undid one handball card event",
    area: "Audit Trail",
    time: "11:12 AM",
  },
  {
    id: "audit-5",
    actor: "Patrick",
    action: "Reset organizer code for testing device",
    area: "Access",
    time: "11:20 AM",
  },
];

export const organizerAccess = [
  { name: "Patrick", role: "Admin", pin: "20261", claimed: true },
  { name: "Jeffery", role: "Organizer", pin: "20262", claimed: true },
  { name: "Aadu", role: "Organizer", pin: "20263", claimed: false },
  { name: "Abu", role: "Organizer", pin: "20264", claimed: false },
  { name: "Glen", role: "Organizer", pin: "20265", claimed: true },
  { name: "Jerome", role: "Organizer", pin: "20266", claimed: false },
  { name: "Jeshu", role: "Organizer", pin: "20267", claimed: true },
  { name: "Pogs", role: "Organizer", pin: "20268", claimed: false },
  { name: "Jovin", role: "Organizer", pin: "20269", claimed: false },
  { name: "Sheldon", role: "Organizer", pin: "202610", claimed: true },
  { name: "Fred", role: "Organizer", pin: "202611", claimed: false },
];

export const navigation: NavGroup[] = [
  {
    label: "Tournament",
    items: [
      { title: "Overview", href: "/dashboard", icon: Home },
      { title: "Live Scores", href: "/dashboard/live-scores", icon: Activity, badge: "Live" },
      { title: "Fixtures", href: "/dashboard/fixtures", icon: CalendarDays },
      { title: "Standings", href: "/dashboard/standings", icon: BarChart3 },
      { title: "Brackets", href: "/dashboard/brackets", icon: Trophy },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Players", href: "/dashboard/players", icon: Users },
      { title: "Leaderboards", href: "/dashboard/leaderboards", icon: Goal },
    ],
  },
  {
    label: "Control",
    items: [
      { title: "Audit Trail", href: "/dashboard/audit-trail", icon: ClipboardList },
      { title: "Access", href: "/dashboard/access", icon: KeyRound },
      { title: "Scoring Rules", href: "/dashboard/live-scores", icon: ListChecks },
      { title: "Transparency", href: "/dashboard/audit-trail", icon: ShieldCheck },
    ],
  },
];

export function getTeam(teamId: string) {
  const team = teams.find((item) => item.id === teamId);

  if (!team) {
    throw new Error(`Unknown team id: ${teamId}`);
  }

  return team;
}

export function teamTotal(teamId: string) {
  const row = standings.find((item) => item.teamId === teamId);

  if (!row) {
    return 0;
  }

  return row.football + row.cricket + row.handball + row.discipline;
}

export const sortedStandings = [...standings].sort((a, b) => teamTotal(b.teamId) - teamTotal(a.teamId));

export const liveFixture = fixtures.find((fixture) => fixture.status === "Live") ?? fixtures[0];
