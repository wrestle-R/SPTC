import { createHash, scryptSync, timingSafeEqual } from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { MAX_PIN_ATTEMPTS, PIN_WINDOW_MS, REGION } from "./constants.js";
import { db, privateCollection } from "./firebase.js";

export const organizerPinScrypt = defineSecret("ORGANIZER_PIN_SCRYPT");

function pinMatches(pin: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(pin, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function attemptId(installationId: string, ip: string) {
  return createHash("sha256").update(`${installationId}:${ip}`).digest("hex");
}

export const organizerLogin = onCall(
  { region: REGION, secrets: [organizerPinScrypt], enforceAppCheck: false },
  async (request) => {
    const pin = String(request.data?.pin ?? "");
    const installationId = String(request.data?.installationId ?? "").trim();
    const displayName = String(request.data?.displayName ?? "Organizer").trim().slice(0, 60) || "Organizer";
    if (!/^\d{5,8}$/.test(pin) || installationId.length < 12 || installationId.length > 160) {
      throw new HttpsError("invalid-argument", "Enter a valid organizer PIN.");
    }

    const ip = request.rawRequest.ip ?? "unknown";
    const limiterRef = db.collection("organizerPinAttempts").doc(attemptId(installationId, ip));
    const now = Date.now();
    const allowed = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(limiterRef);
      const record = snapshot.data() as { attempts?: number; windowStartedAt?: Timestamp } | undefined;
      const windowStartedAt = record?.windowStartedAt?.toMillis() ?? 0;
      const activeWindow = now - windowStartedAt < PIN_WINDOW_MS;
      const attempts = activeWindow ? record?.attempts ?? 0 : 0;
      if (attempts >= MAX_PIN_ATTEMPTS) return false;
      transaction.set(limiterRef, {
        attempts: attempts + 1,
        windowStartedAt: activeWindow ? record?.windowStartedAt : Timestamp.fromMillis(now),
        expiresAt: Timestamp.fromMillis(now + PIN_WINDOW_MS),
      });
      return true;
    });
    if (!allowed) throw new HttpsError("resource-exhausted", "Too many attempts. Try again later.");

    const stored = organizerPinScrypt.value();
    if (!stored || !pinMatches(pin, stored)) {
      throw new HttpsError("permission-denied", "The organizer PIN is incorrect.");
    }

    const uid = `organizer-${createHash("sha256").update(installationId).digest("hex").slice(0, 28)}`;
    const claims = { organizer: true, organizerName: displayName };
    await getAuth().setCustomUserClaims(uid, claims).catch(async (error: unknown) => {
      if ((error as { code?: string }).code !== "auth/user-not-found") throw error;
      await getAuth().createUser({ uid, displayName });
      await getAuth().setCustomUserClaims(uid, claims);
    });
    const token = await getAuth().createCustomToken(uid, claims);
    await privateCollection("organizerSessions").doc(uid).set({
      uid,
      displayName,
      installationHash: createHash("sha256").update(installationId).digest("hex"),
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await limiterRef.delete();
    return { token, uid, displayName };
  },
);

export function requireOrganizer(request: { auth?: { uid: string; token: Record<string, unknown> } }) {
  if (!request.auth || request.auth.token.organizer !== true) {
    throw new HttpsError("unauthenticated", "Organizer access is required.");
  }
  return {
    uid: request.auth.uid,
    name: String(request.auth.token.organizerName ?? "Organizer"),
  };
}
