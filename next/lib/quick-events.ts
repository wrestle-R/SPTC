export type QuickEventStatus = "scheduled" | "live" | "completed";

export type QuickEventFixture = {
  id: string;
  type: "quick-event-fixture";
  title: string;
  status: QuickEventStatus;
  points: [number, number, number];
  lineups: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
};

export type QuickEventResult = {
  id: string;
  type: "quick-event-result";
  fixtureId: string;
  title: string;
  confirmed: true;
  points: [number, number, number];
  lineups: Record<string, string[]>;
  placements: Record<string, string>;
  updatedAt?: string;
};

export type QuickEventRecord = QuickEventFixture | QuickEventResult;

export function quickEventResultId(fixtureId: string) {
  return `quick-event-result:${fixtureId}`;
}

export function splitPlacementPoints(points: number, playerCount: number) {
  return playerCount > 0 ? points / playerCount : 0;
}
