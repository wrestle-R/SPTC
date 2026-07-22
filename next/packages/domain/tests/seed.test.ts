import { describe, expect, it } from "vitest";
import { S9_PLAYERS, S9_SEEDED_MATCHES, S9_TEAMS } from "../src/seed";

const expectedRosters = {
  "crimson-warriors": ["Daniel Russel Paul", "Glen Gladin", "Sam Jeyaraj", "Jovin Samraj", "Melvin Benn", "Aaron Ditto", "Johan Jagdish", "Jenson Shaji", "Daniel Ratnaraj", "Edwin Anburaj", "Jemima John", "Rachel Edwin", "Hannah Mano", "Sharon Jane", "Cressida Jebastin", "Suja Jebakumar", "Christy Jagdish", "Anita Ditto", "Kaitlyn Eve"],
  "gods-gladiators": ["Patrick Joshua", "Edben Kruze", "Jeshurun Edwin", "John Rajesh", "Febin Jagdish", "Jeffrey Jebakumar", "Eric Edison", "Jabez Singh", "Ditto Lazar", "Benson Wilson", "Joselin Daniel", "Rheanna Robinson", "Maria Antony", "Andrea Joyal", "Jyotimani Wilson", "Esther Robins", "Sumitha Jackson", "Candice Jebastin", "Judith John"],
  "karuppu-knights": ["Jonathan Kirubaharan", "Jerome Jebakumar", "Terry Aldrin", "Jagdish", "Leroy Kinskumar", "Abraham Joyal", "Ethan Russel", "Michael Antony", "Robins Duncan", "Jackson Andrews", "Eunice Edison", "Celeste Ditto", "Euvance Edison", "Joselin Golda", "Jas Johh", "Jency Sony", "Stella Daniel", "Jenefa Praiselin", "Ansel James"],
  "ivory-elites": ["Sheldon Benson", "Harrison Peter", "Akshay James", "Immanuel J", "Kevin Joash", "Frederick John", "Jovin Jora", "Austin Sundarraj", "Robinson Samuel", "Jebakumar", "Jebastin David", "Alecia Wilson", "Johannah Jackson", "Andrea Prakash", "Rhowena Robinson", "Rani Edwin", "Geeta Benson", "Thulasi Edwin", "Margaret Michael", "Annette Maria"],
} as const;

const expectedJerseyNumbers = {
  "crimson-warriors": [10, 99, 8, 7, 29, 17, 7, 6, 3, 1, 3, 16, 44, 10, 4, 13, 17, 29, 20],
  "gods-gladiators": [9, 22, 10, 1, 12, 7, 4, 28, 1, 18, 7, 11, 14, 13, 9, 2, 17, 5, 23],
  "karuppu-knights": [17, 22, 2, 3, 14, 15, 1, null, 10, 28, 13, 29, 24, 7, null, 16, 5, 12, 5],
  "ivory-elites": [10, 14, 11, 8, 9, 7, 29, 9, 4, 5, 21, 7, 22, 32, 24, 4, 17, 6, null, 7],
} as const;

describe("finalized rosters", () => {
  it("contains the exact approved team names and accent colors", () => {
    expect(S9_TEAMS.map(({ name, accentColor }) => ({ name, accentColor }))).toEqual([
      { name: "Crimson Warriors", accentColor: "#ef4444" },
      { name: "God's Gladiators", accentColor: "#3b82f6" },
      { name: "Karuppu Knights", accentColor: "#a1a1aa" },
      { name: "Ivory Elites", accentColor: "#f8fafc" },
    ]);
  });

  it.each(Object.entries(expectedRosters))("matches the approved %s roster", (teamId, expected) => {
    expect(S9_PLAYERS.filter((player) => player.teamId === teamId).map((player) => player.name)).toEqual(expected);
  });

  it.each(Object.entries(expectedJerseyNumbers))("matches the approved %s jersey numbers", (teamId, expected) => {
    expect(S9_PLAYERS.filter((player) => player.teamId === teamId).map((player) => player.jerseyNumber)).toEqual(expected);
  });

  it("keeps only the three TBD jersey numbers unassigned", () => {
    expect(S9_PLAYERS.filter((player) => player.jerseyNumber === null).map((player) => player.name)).toEqual([
      "Michael Antony",
      "Jas Johh",
      "Margaret Michael",
    ]);
  });

  it("contains 77 unique player records", () => {
    expect(S9_PLAYERS).toHaveLength(77);
    expect(new Set(S9_PLAYERS.map((player) => player.id)).size).toBe(77);
  });

  it("seeds one live and one completed match for each active sport", () => {
    expect(S9_SEEDED_MATCHES).toHaveLength(6);
    for (const sport of ["football", "handball", "cricket"] as const) {
      const matches = S9_SEEDED_MATCHES.filter((match) => match.sport === sport);
      expect(matches.map((match) => match.status).sort()).toEqual(["completed", "live"]);
    }
  });

  it("never seeds a completed match without a real result", () => {
    const completed = S9_SEEDED_MATCHES.filter((match) => match.status === "completed");
    expect(completed).toHaveLength(3);
    for (const match of completed) {
      expect(match.winnerTeamId).toBeTruthy();
      expect(match.resultText).toMatch(/beat/);
      if (match.sport === "cricket") {
        expect(match.resultText).toBe("Crimson Warriors beat God's Gladiators by 6 wickets");
        expect(match.scoreSummary.innings).toHaveLength(2);
      }
    }
  });

  it("seeds field-sport goal events that match the visible score", () => {
    const fieldMatches = S9_SEEDED_MATCHES.filter((match) => match.sport === "football" || match.sport === "handball");
    for (const match of fieldMatches) {
      expect(match.fieldState).toBeTruthy();
      const expectedGoals = Object.values(match.scoreSummary).reduce((sum, score) => sum + score, 0);
      const recordedGoals = match.fieldState?.events.filter((event) => event.type === "goal" || event.type === "own-goal").length;
      expect(recordedGoals).toBe(expectedGoals);
    }
  });
});
