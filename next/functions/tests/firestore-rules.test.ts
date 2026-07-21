import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, describe, it } from "vitest";

let environment: RulesTestEnvironment;

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: "sports-fiesta-rules-test",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: readFileSync(resolve(process.cwd(), "../firestore.rules"), "utf8"),
    },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(
      doc(context.firestore(), "publicTournaments/sports-fiesta-s9/teams/red"),
      { name: "Crimson Warriors" },
    );
    await setDoc(
      doc(context.firestore(), "tournaments/sports-fiesta-s9/teams/red"),
      { name: "Crimson Warriors", internal: true },
    );
  });
});

afterAll(async () => environment?.cleanup());

describe("Firestore access", () => {
  it("allows unauthenticated reads of public projections", async () => {
    const db = environment.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(db, "publicTournaments/sports-fiesta-s9/teams/red")));
  });

  it("denies direct writes to public projections", async () => {
    const db = environment.authenticatedContext("organizer", { organizer: true }).firestore();
    await assertFails(setDoc(doc(db, "publicTournaments/sports-fiesta-s9/teams/red"), { name: "Changed" }));
  });

  it("denies private reads to viewers and permits organizer reads", async () => {
    const viewer = environment.unauthenticatedContext().firestore();
    const organizer = environment.authenticatedContext("organizer", { organizer: true }).firestore();
    await assertFails(getDoc(doc(viewer, "tournaments/sports-fiesta-s9/teams/red")));
    await assertSucceeds(getDoc(doc(organizer, "tournaments/sports-fiesta-s9/teams/red")));
  });
});
