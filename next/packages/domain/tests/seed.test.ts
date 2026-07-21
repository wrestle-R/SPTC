import { describe, expect, it } from "vitest";
import { S9_PLAYERS, S9_TEAMS } from "../src/seed";

const expectedRosters = {
  "crimson-warriors": ["Daniel Russel Paul", "Glen Gladin", "Sam Jeyaraj", "Jovin Samraj", "Melvin Benn", "Aaron Ditto", "Johan Jagdish", "Jenson Shaji", "Daniel Ratnaraj", "Edwin Anburaj", "Jemima John", "Rachel Edwin", "Hannah Mano", "Sharon Jane", "Cressida Jebastin", "Suja Jebakumar", "Christy Jagdish", "Anita Ditto", "Kaitlyn Eve"],
  "gods-gladiators": ["Patrick Joshua", "Edben Kruze", "Jeshurun Edwin", "John Rajesh", "Febin Jagdish", "Jeffrey Jebakumar", "Eric Edison", "Jabez Singh", "Ditto Lazar", "Benson Wilson", "Joselin Daniel", "Rheanna Robinson", "Maria Antony", "Andrea Joyal", "Jyotimani Wilson", "Esther Robins", "Sumitha Jackson", "Candice Jebastin", "Judith John"],
  "karuppu-knights": ["Jonathan Kirubaharan", "Jerome Jebakumar", "Terry Aldrin", "Jagdish", "Leroy Kinskumar", "Abraham Joyal", "Ethan Russel", "Michael Antony", "Robins Duncan", "Jackson Andrews", "Eunice Edison", "Celeste Ditto", "Euvance Edison", "Joselin Golda", "Jas Johh", "Jency Sony", "Stella Daniel", "Jenefa Praiselin", "Ansel James"],
  "ivory-elites": ["Sheldon Benson", "Harrison Peter", "Akshay James", "Immanuel J", "Kevin Joash", "Frederick John", "Jovin Jora", "Austin Sundarraj", "Robinson Samuel", "Jebakumar", "Jebastin David", "Alecia Wilson", "Johannah Jackson", "Andrea Prakash", "Rhowena Robinson", "Rani Edwin", "Geeta Benson", "Thulasi Edwin", "Margaret Michael", "Annette Maria"],
} as const;

describe("finalized rosters", () => {
  it("contains the exact approved team names and accent colors", () => {
    expect(S9_TEAMS.map(({ name, accentColor }) => ({ name, accentColor }))).toEqual([
      { name: "Crimson Warriors", accentColor: "#ef4444" },
      { name: "God's Gladiators", accentColor: "#22c55e" },
      { name: "Karuppu Knights", accentColor: "#a1a1aa" },
      { name: "Ivory Elites", accentColor: "#f8fafc" },
    ]);
  });

  it.each(Object.entries(expectedRosters))("matches the approved %s roster", (teamId, expected) => {
    expect(S9_PLAYERS.filter((player) => player.teamId === teamId).map((player) => player.name)).toEqual(expected);
  });

  it("contains 77 unique player records", () => {
    expect(S9_PLAYERS).toHaveLength(77);
    expect(new Set(S9_PLAYERS.map((player) => player.id)).size).toBe(77);
  });
});
