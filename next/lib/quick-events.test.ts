import { describe, expect, it } from "vitest";
import { quickEventResultId, splitPlacementPoints } from "./quick-events";

describe("quick event scoring", () => {
  it("keeps the full award for one player", () => {
    expect(splitPlacementPoints(50, 1)).toBe(50);
  });

  it("divides the award evenly across a lineup", () => {
    expect(splitPlacementPoints(50, 2)).toBe(25);
    expect(splitPlacementPoints(50, 4)).toBe(12.5);
  });

  it("uses a stable result id for each fixture", () => {
    expect(quickEventResultId("quick-event-fixture:123")).toBe("quick-event-result:quick-event-fixture:123");
  });
});
