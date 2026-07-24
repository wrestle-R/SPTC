import { NextResponse } from "next/server";
import {
  isOrganizerCodeValid,
  ORGANIZER_ACCESS_COOKIE,
  organizerAccessToken,
} from "@/lib/organizer-access";

export async function POST(request: Request) {
  const { code } = await request.json().catch(() => ({ code: "" })) as { code?: string };
  if (!isOrganizerCodeValid(String(code ?? ""))) {
    return NextResponse.json({ error: "Incorrect access code." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ORGANIZER_ACCESS_COOKIE, organizerAccessToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
