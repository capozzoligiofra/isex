import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getTimeZone, getUserId } from "@/lib/data";
import { formatDateTime } from "@/lib/dates";
import { deauthorize, listActivities, refreshTokens, StravaError, type StravaTokens } from "./client";
import { isStravaConfigured } from "./config";
import { matchPlanned, toWorkout, type PlannedCandidate } from "./map";

export interface StravaConnection {
  user_id: string;
  athlete_id: number;
  athlete_name: string | null;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string | null;
  last_synced_at: string | null;
}

/** Without force, sync at most this often (page loads trigger it). */
const AUTO_SYNC_INTERVAL_MS = 30 * 60 * 1000;
/** First import looks back this far. */
const INITIAL_DAYS = 14;
/** Later imports re-check this many days, to catch late uploads. */
const OVERLAP_DAYS = 3;

const COLUMNS =
  "user_id, athlete_id, athlete_name, access_token, refresh_token, expires_at, scope, last_synced_at";

export function athleteName(tokens: StravaTokens): string | null {
  const a = tokens.athlete;
  const name = [a?.firstname, a?.lastname].filter(Boolean).join(" ").trim();
  return name || null;
}

export async function getConnection(
  supabase: SupabaseClient,
  userId: string,
): Promise<StravaConnection | null> {
  const { data } = await supabase
    .from("strava_connections")
    .select(COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as StravaConnection | null) ?? null;
}

export async function saveConnection(
  supabase: SupabaseClient,
  userId: string,
  tokens: StravaTokens,
  scope: string | null,
) {
  const { error } = await supabase.from("strava_connections").upsert({
    user_id: userId,
    athlete_id: tokens.athlete?.id ?? 0,
    athlete_name: athleteName(tokens),
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: new Date(tokens.expires_at * 1000).toISOString(),
    scope,
    last_synced_at: null,
  });
  if (error) throw new Error(`Salvataggio collegamento Strava non riuscito: ${error.message}`);
}

/** A valid access token, refreshed if it expires within a minute. */
async function freshAccessToken(supabase: SupabaseClient, conn: StravaConnection) {
  if (Date.parse(conn.expires_at) - Date.now() > 60_000) return conn.access_token;
  try {
    const tokens = await refreshTokens(conn.refresh_token);
    await supabase
      .from("strava_connections")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      })
      .eq("user_id", conn.user_id);
    return tokens.access_token;
  } catch (e) {
    // Access revoked from Strava's side: forget the connection.
    if (e instanceof StravaError && (e.status === 400 || e.status === 401)) {
      await supabase.from("strava_connections").delete().eq("user_id", conn.user_id);
      throw new StravaError("Collegamento Strava scaduto: ricollegalo dal profilo.", 401);
    }
    throw e;
  }
}

export interface SyncResult {
  imported: number;
  linked: number;
  skipped: boolean;
}

/**
 * Imports the signed-in user's recent Strava activities. An activity that
 * matches an open planned workout updates it; otherwise a new completed
 * workout is created. Activities already imported are left untouched, so
 * edits made in the app survive later syncs.
 */
export async function syncStrava(opts: { force?: boolean } = {}): Promise<SyncResult | null> {
  if (!isStravaConfigured()) return null;
  const userId = await getUserId();
  if (!userId) return null;
  const supabase = await createClient();
  const conn = await getConnection(supabase, userId);
  if (!conn) return null;

  const last = conn.last_synced_at ? Date.parse(conn.last_synced_at) : null;
  if (!opts.force && last && Date.now() - last < AUTO_SYNC_INTERVAL_MS) {
    return { imported: 0, linked: 0, skipped: true };
  }

  const accessToken = await freshAccessToken(supabase, conn);
  const afterMs = last
    ? last - OVERLAP_DAYS * 86_400_000
    : Date.now() - INITIAL_DAYS * 86_400_000;
  const activities = await listActivities(accessToken, afterMs / 1000);
  const imported = activities.map(toWorkout).filter((w) => w !== null);

  let importedCount = 0;
  let linkedCount = 0;
  if (imported.length > 0) {
    const dates = imported.map((w) => w.date).sort();
    const { data: existing, error } = await supabase
      .from("workouts")
      .select("id, date, start_time, sport, completed, source, external_id")
      .eq("user_id", userId)
      .gte("date", dates[0])
      .lte("date", dates[dates.length - 1]);
    if (error) throw new Error(`Lettura allenamenti non riuscita: ${error.message}`);

    const rows = existing as Array<{
      id: string;
      date: string;
      start_time: string;
      sport: PlannedCandidate["sport"];
      completed: boolean;
      source: string;
      external_id: string | null;
    }>;
    const known = new Set(rows.filter((r) => r.external_id).map((r) => r.external_id));
    const candidates: PlannedCandidate[] = rows.map((r) => ({
      id: r.id,
      date: r.date,
      startTime: r.start_time.slice(0, 5),
      sport: r.sport,
      completed: r.completed,
      linked: Boolean(r.external_id),
    }));
    const taken = new Set<string>();

    for (const w of imported) {
      if (known.has(w.external_id)) continue;
      const planId = matchPlanned(w, candidates, taken);
      if (planId) {
        taken.add(planId);
        // Keep the planned title and intensity: the athlete set them on purpose.
        const { error: upErr } = await supabase
          .from("workouts")
          .update({
            start_time: w.start_time,
            duration_min: w.duration_min,
            energy_kj: w.energy_kj,
            completed: true,
            source: "strava",
            external_id: w.external_id,
          })
          .eq("id", planId)
          .eq("user_id", userId);
        if (!upErr) linkedCount++;
      } else {
        const { error: insErr } = await supabase
          .from("workouts")
          .insert({ ...w, user_id: userId });
        // 23505 = already imported by a concurrent sync.
        if (!insErr) importedCount++;
        else if (insErr.code !== "23505") {
          throw new Error(`Import non riuscito: ${insErr.message}`);
        }
      }
    }
  }

  await supabase
    .from("strava_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { imported: importedCount, linked: linkedCount, skipped: false };
}

export async function disconnectStrava(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  const supabase = await createClient();
  const conn = await getConnection(supabase, userId);
  if (!conn) return;
  try {
    await deauthorize(conn.access_token);
  } catch {
    // Already revoked or expired on Strava's side: remove it locally anyway.
  }
  await supabase.from("strava_connections").delete().eq("user_id", userId);
}

export interface StravaStatus {
  configured: boolean;
  connected: boolean;
  athleteName: string | null;
  lastSyncedLabel: string;
}

/** What the UI may know about the connection (never the tokens). */
export async function getStravaStatus(): Promise<StravaStatus> {
  const configured = isStravaConfigured();
  const userId = await getUserId();
  if (!userId) return { configured, connected: false, athleteName: null, lastSyncedLabel: "mai" };
  const supabase = await createClient();
  const conn = await getConnection(supabase, userId);
  return {
    configured,
    connected: Boolean(conn),
    athleteName: conn?.athlete_name ?? null,
    lastSyncedLabel: formatDateTime(conn?.last_synced_at ?? null, await getTimeZone()),
  };
}
