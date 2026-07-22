import type {
  FieldStanding,
  FieldStandingInput,
  OverallStanding,
  OverallStandingInput,
  ThrowballStanding,
  ThrowballStandingInput,
} from "./types";

export const DEFAULT_PLACEMENT_POINTS = [10, 5, 3, 1] as const;

export function rankFieldStandings(rows: FieldStandingInput[]): FieldStanding[] {
  return rows
    .map((row) => ({
      ...row,
      points: row.points ?? row.wins * 3 + row.draws,
      rank: 0,
      goalDifference: row.goalsFor - row.goalsAgainst,
    }))
    .sort((a, b) =>
      b.wins - a.wins
      || b.goalDifference - a.goalDifference
      || b.goalsFor - a.goalsFor
      || b.points - a.points
      || a.teamId.localeCompare(b.teamId),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function rankThrowballStandings(rows: ThrowballStandingInput[]): ThrowballStanding[] {
  return rows
    .map((row) => ({
      ...row,
      rank: 0,
      setDifference: row.setsFor - row.setsAgainst,
      pointDifference: row.pointsFor - row.pointsAgainst,
      points: row.wins * 3,
    }))
    .sort((a, b) =>
      b.wins - a.wins
      || b.setDifference - a.setDifference
      || b.pointDifference - a.pointDifference
      || b.points - a.points
      || a.teamId.localeCompare(b.teamId),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

interface SportPlacement {
  teamId: string;
  sport: string;
  place: number;
}

export function calculateOverallStandings(
  teamIds: string[],
  placements: SportPlacement[],
  pointsBySport: Record<string, readonly number[]>,
) {
  return teamIds
    .map((teamId) => {
      const segments = Object.fromEntries(
        Object.keys(pointsBySport).map((sport) => {
          const place = placements.find(
            (placement) => placement.teamId === teamId && placement.sport === sport,
          )?.place;
          return [sport, place ? pointsBySport[sport]?.[place - 1] ?? 0 : 0];
        }),
      );
      const sportPoints = Object.values(segments).reduce((sum, points) => sum + points, 0);
      return {
        teamId,
        segments,
        sportPoints,
        total: sportPoints,
      };
    })
    .sort((a, b) => b.total - a.total || b.sportPoints - a.sportPoints || a.teamId.localeCompare(b.teamId))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function rankOverallStandings(
  rows: OverallStandingInput[],
  placementPoints: readonly number[] = DEFAULT_PLACEMENT_POINTS,
): OverallStanding[] {
  return rows
    .map((row) => {
      const segments = Object.fromEntries(
        Object.entries(row.sportPlacements).map(([sport, placement]) => [
          sport,
          placement && placement > 0 ? placementPoints[placement - 1] ?? 0 : 0,
        ]),
      );
      const sportPoints = Object.values(segments).reduce((total, points) => total + points, 0);
      return {
        ...row,
        segments,
        sportPoints,
        totalPoints: sportPoints,
        rank: 0,
      };
    })
    .sort((a, b) =>
      b.totalPoints - a.totalPoints
      || b.sportPoints - a.sportPoints
      || a.teamId.localeCompare(b.teamId),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
