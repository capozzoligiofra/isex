import type { NextRequest } from "next/server";

/** Public origin of the app, preferring the configured site URL. */
export function siteOrigin(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  return configured ? configured.replace(/\/$/, "") : request.nextUrl.origin;
}
