import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ORGANIZER_COOKIE, verifyOrganizerIdToken } from "@/lib/organizer-session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { idToken?: string } | null;
  const idToken = body?.idToken ?? "";
  const organizer = await verifyOrganizerIdToken(idToken);
  if (!organizer) return NextResponse.json({ error: "Organizer authentication failed." }, { status: 401 });
  (await cookies()).set(ORGANIZER_COOKIE, idToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 55 * 60,
  });
  return NextResponse.json({ organizer });
}

export async function DELETE() {
  (await cookies()).delete(ORGANIZER_COOKIE);
  return NextResponse.json({ ok: true });
}
