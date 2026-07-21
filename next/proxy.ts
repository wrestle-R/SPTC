import { NextRequest, NextResponse } from "next/server";

const redirects: Record<string, string> = {
  "/dashboard": "/",
  "/dashboard/live-scores": "/",
  "/dashboard/fixtures": "/football",
  "/dashboard/standings": "/teams",
  "/dashboard/brackets": "/football",
  "/dashboard/players": "/teams",
  "/dashboard/leaderboards": "/leaderboards",
  "/dashboard/access": "/organizer/login",
};

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/dashboard/audit-trail") {
    return NextResponse.rewrite(new URL("/__removed-audit-trail", request.url));
  }
  const destination = redirects[request.nextUrl.pathname];
  return destination ? NextResponse.redirect(new URL(destination, request.url)) : NextResponse.next();
}

export const config = { matcher: "/dashboard/:path*" };
