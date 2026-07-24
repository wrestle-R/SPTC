import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ORGANIZER_ACCESS_COOKIE = "sptc_organizer_access";
const ORGANIZER_ACCESS_CODE = "92026";
const ORGANIZER_ACCESS_TOKEN = createHash("sha256").update(`sptc-organizer:${ORGANIZER_ACCESS_CODE}`).digest("hex");

export function isOrganizerCodeValid(code: string) {
  const supplied = Buffer.from(code);
  const expected = Buffer.from(ORGANIZER_ACCESS_CODE);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function hasOrganizerAccess() {
  const cookieStore = await cookies();
  return cookieStore.get(ORGANIZER_ACCESS_COOKIE)?.value === ORGANIZER_ACCESS_TOKEN;
}

export function organizerAccessToken() {
  return ORGANIZER_ACCESS_TOKEN;
}
