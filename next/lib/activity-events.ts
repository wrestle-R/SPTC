export type ActivitySportId = "womens-games" | "senior-kids" | "junior-kids" | "relay";
export type ActivityEventKind = "individual" | "relay";

export type ActivityEvent = {
  id: string;
  name: string;
  kind: ActivityEventKind;
  points: readonly number[];
};

export type ActivitySport = {
  id: ActivitySportId;
  label: string;
  shortLabel: string;
  events: readonly ActivityEvent[];
};

const INDIVIDUAL_POINTS = [50, 30, 10] as const;
const RELAY_POINTS = [100, 75, 50, 20] as const;

export const ACTIVITY_SPORTS: readonly ActivitySport[] = [
  {
    id: "womens-games",
    label: "Women’s Games",
    shortLabel: "Women’s",
    events: [
      { id: "blindfold-colour-ball", name: "Blindfold pick the colour ball", kind: "relay", points: INDIVIDUAL_POINTS },
      { id: "ring-toss-challenge", name: "Ring Toss Challenge", kind: "relay", points: INDIVIDUAL_POINTS },
      { id: "lemon-spoon", name: "Lemon Spoon", kind: "relay", points: INDIVIDUAL_POINTS },
      { id: "book-balancing", name: "Book Balancing", kind: "relay", points: INDIVIDUAL_POINTS },
    ],
  },
  {
    id: "senior-kids",
    label: "Senior Kids",
    shortLabel: "Senior Kids",
    events: [
      { id: "sack-race", name: "Sack Race", kind: "relay", points: INDIVIDUAL_POINTS },
      { id: "hurdles-obstacle-race", name: "Hurdles & Obstacle Race", kind: "relay", points: INDIVIDUAL_POINTS },
      { id: "hit-the-stumps-senior", name: "Hit the Stumps Challenge", kind: "relay", points: INDIVIDUAL_POINTS },
    ],
  },
  {
    id: "junior-kids",
    label: "Junior Kids",
    shortLabel: "Junior Kids",
    events: [
      { id: "arrange-colour-balls", name: "Arrange the balls based on the colours", kind: "relay", points: INDIVIDUAL_POINTS },
      { id: "ball-bucket-toss", name: "Ball Bucket Toss", kind: "relay", points: INDIVIDUAL_POINTS },
      { id: "hurdles", name: "Hurdles", kind: "relay", points: INDIVIDUAL_POINTS },
      { id: "hit-the-stumps-junior", name: "Hit the Stumps Challenge", kind: "relay", points: INDIVIDUAL_POINTS },
    ],
  },
  {
    id: "relay",
    label: "Relay",
    shortLabel: "Relay",
    events: [
      { id: "mens-relay", name: "Men’s Relay", kind: "relay", points: RELAY_POINTS },
      { id: "womens-relay", name: "Women’s Relay", kind: "relay", points: RELAY_POINTS },
      { id: "potato-race-relay", name: "Potato Race Relay", kind: "relay", points: RELAY_POINTS },
    ],
  },
] as const;

export function getActivitySport(id: string) {
  return ACTIVITY_SPORTS.find((sport) => sport.id === id);
}

export function getActivityEvent(sportId: string, eventId: string) {
  return getActivitySport(sportId)?.events.find((event) => event.id === eventId);
}

export type ActivityResult = {
  id: string;
  type: "activity-result";
  confirmed: boolean;
  sport: ActivitySportId;
  eventId: string;
  kind: ActivityEventKind;
  placements: Record<string, string>;
  lineups?: Record<string, string[]>;
  updatedAt?: string;
};

export type ActivityFixture = {
  id: string;
  type: "activity-fixture";
  sport: ActivitySportId;
  eventId: string;
  status: "scheduled" | "live" | "completed";
  lineups?: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
};

export type ActivityRecord = ActivityResult | ActivityFixture | QuickEventFixture | QuickEventResult;

export function activityFixtureId(sport: ActivitySportId, eventId: string) {
  return `activity-fixture:${sport}:${eventId}`;
}
import type { QuickEventFixture, QuickEventResult } from "@/lib/quick-events";
