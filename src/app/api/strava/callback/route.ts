import { NextResponse, type NextRequest } from "next/server";
import { getUserId } from "@/lib/data";
import { siteOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { exchangeCode } from "@/lib/strava/client";
import { saveConnection, syncStrava } from "@/lib/strava/sync";
import { STATE_COOKIE } from "@/lib/strava/config";

/** Strava redirects here after the athlete approves (or denies) access. */
export async function GET(request: NextRequest) {
  const origin = siteOrigin(request);
  const params = request.nextUrl.searchParams;
  const back = (status: string) => {
    const res = NextResponse.redirect(new URL(`/profilo?strava=${status}`, origin));
    res.cookies.delete({ name: STATE_COOKIE, path: "/api/strava" });
    return res;
  };

  const userId = await getUserId();
  if (!userId) return NextResponse.redirect(new URL("/login?next=/profilo", origin));

  const expected = request.cookies.get(STATE_COOKIE)?.value;
  if (!expected || params.get("state") !== expected) return back("errore");
  if (params.get("error")) return back("negato");

  const code = params.get("code");
  const scope = params.get("scope") ?? "";
  if (!code) return back("errore");
  if (!scope.split(",").some((s) => s.startsWith("activity:read"))) return back("permessi");

  try {
    const tokens = await exchangeCode(code);
    const supabase = await createClient();
    await saveConnection(supabase, userId, tokens, scope);
  } catch (e) {
    console.error("Collegamento Strava non riuscito:", e);
    return back("errore");
  }

  try {
    await syncStrava({ force: true });
  } catch (e) {
    // Connected anyway: the next sync will retry.
    console.error("Prima sincronizzazione Strava non riuscita:", e);
  }
  return back("collegato");
}
