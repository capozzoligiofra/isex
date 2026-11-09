import { NextResponse, type NextRequest } from "next/server";
import { getUserId } from "@/lib/data";
import { siteOrigin } from "@/lib/site";
import { authorizeUrl } from "@/lib/strava/client";
import { STATE_COOKIE, STRAVA_SCOPE, isStravaConfigured } from "@/lib/strava/config";

/** Starts the Strava OAuth flow for the signed-in user. */
export async function GET(request: NextRequest) {
  const origin = siteOrigin(request);
  if (!(await getUserId())) return NextResponse.redirect(new URL("/login?next=/profilo", origin));
  if (!isStravaConfigured()) {
    return NextResponse.redirect(new URL("/profilo?strava=non-configurato", origin));
  }

  const state = crypto.randomUUID();
  const response = NextResponse.redirect(
    authorizeUrl(`${origin}/api/strava/callback`, state, STRAVA_SCOPE),
  );
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: origin.startsWith("https://"),
    sameSite: "lax",
    path: "/api/strava",
    maxAge: 600,
  });
  return response;
}
