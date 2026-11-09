import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getTimeZone, getToday, getUserId } from "@/lib/data";
import { addDays, formatDateTime } from "@/lib/dates";
import { matchPlanned, type PlannedCandidate } from "@/lib/integrations/common";
import { requestSyncContext, type SyncContext } from "@/lib/integrations/context";
import type { Sport } from "@/lib/nutrition";
import { listActivities, listPlannedEvents, type IcuCredentials } from "./client";
import { activityToWorkout, eventToWorkout } from "./map";

interface Connection {
  user_id: string;
  athlete_id: string;
  athlete_name: string | null;
  api_key: string;
  default_time: string; // HH:MM:SS
  last_synced_at: string | null;
}

/** Planned workouts change often: sync on page load at most this often. */
const AUTO_SYNC_INTERVAL_MS = 15 * 60 * 1000;
const INITIAL_DAYS = 14;
const OVERLAP_DAYS = 3;
const PLAN_DAYS_AHEAD = 14;
const PLAN_DAYS_BEHIND = 3;

async function getConnection(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("intervals_connections")
    .select("user_id, athlete_id, athlete_name, api_key, default_time, last_synced_at")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Connection | null) ?? null;
}

interface Row {
  id: string;
  date: string;
  start_time: string;
  duration_min: number;
  sport: Sport;
  intensity: string;
  title: string | null;
  energy_kj: number | null;
  completed: boolean;
  source: string;
  external_id: string | null;
  plan_external_id: string | null;
}

export interface IntervalsSyncResult {
  activitiesImported: number;
  plansCompleted: number;
  plansAdded: number;
  plansUpdated: number;
  plansRemoved: number;
  skipped: boolean;
}

/**
 * Two-way consistent import from intervals.icu:
 * 1. recorded activities complete their planned workout (intervals.icu's own
 *    pairing first, then same day/sport/time) or are added as new workouts;
 * 2. planned workouts of the next 14 days mirror the intervals.icu calendar
 *    (added, moved, removed) until they are completed.
 */
export async function syncIntervals(
  opts: { force?: boolean; ctx?: SyncContext } = {},
): Promise<IntervalsSyncResult | null> {
  const ctx = opts.ctx ?? (await requestSyncContext());
  if (!ctx) return null;
  const { supabase, userId, today } = ctx;
  const conn = await getConnection(supabase, userId);
  if (!conn) return null;

  const last = conn.last_synced_at ? Date.parse(conn.last_synced_at) : null;
  if (!opts.force && last && Date.now() - last < AUTO_SYNC_INTERVAL_MS) {
    return { activitiesImported: 0, plansCompleted: 0, plansAdded: 0, plansUpdated: 0, plansRemoved: 0, skipped: true };
  }

  const creds: IcuCredentials = { athleteId: conn.athlete_id, apiKey: conn.api_key };
  const activitiesFrom = last
    ? addDays(new Date(last).toISOString().slice(0, 10), -OVERLAP_DAYS)
    : addDays(today, -INITIAL_DAYS);
  const plansFrom = addDays(today, -PLAN_DAYS_BEHIND);
  const plansTo = addDays(today, PLAN_DAYS_AHEAD);
  const defaultTime = conn.default_time.slice(0, 5);

  const [activities, events] = await Promise.all([
    listActivities(creds, activitiesFrom, today),
    listPlannedEvents(creds, plansFrom, plansTo),
  ]);

  const windowFrom = activitiesFrom < plansFrom ? activitiesFrom : plansFrom;
  const { data, error } = await supabase
    .from("workouts")
    .select(
      "id, date, start_time, duration_min, sport, intensity, title, energy_kj, completed, source, external_id, plan_external_id",
    )
    .eq("user_id", userId)
    .gte("date", windowFrom)
    .lte("date", plansTo);
  if (error) throw new Error(`Lettura allenamenti non riuscita: ${error.message}`);
  const rows = data as Row[];

  const result: IntervalsSyncResult = {
    activitiesImported: 0,
    plansCompleted: 0,
    plansAdded: 0,
    plansUpdated: 0,
    plansRemoved: 0,
    skipped: false,
  };
  const knownActivities = new Set(rows.map((r) => r.external_id).filter(Boolean));
  const planRows = new Map(
    rows.filter((r) => r.source === "intervals" && r.plan_external_id).map((r) => [r.plan_external_id!, r]),
  );
  const candidates: PlannedCandidate[] = rows.map((r) => ({
    id: r.id,
    date: r.date,
    startTime: r.start_time.slice(0, 5),
    sport: r.sport,
    completed: r.completed,
    linked: Boolean(r.external_id),
  }));
  const taken = new Set<string>();
  const pairedPlans = new Set<string>();

  // 1. Recorded activities
  for (const a of activities.map(activityToWorkout)) {
    if (!a) continue;
    if (a.pairedPlanId) pairedPlans.add(a.pairedPlanId);
    if (knownActivities.has(a.external_id)) continue;

    const paired = a.pairedPlanId ? planRows.get(a.pairedPlanId) : undefined;
    const targetId =
      paired && !paired.completed && !paired.external_id ? paired.id : matchPlanned(a, candidates, taken);

    const actual = {
      date: a.date,
      start_time: a.start_time,
      duration_min: a.duration_min,
      energy_kj: a.energy_kj,
      completed: true,
      source: "intervals" as const,
      external_id: a.external_id,
    };
    if (targetId) {
      taken.add(targetId);
      // Measured intensity beats the plan; without data, keep what was planned.
      const { error: upErr } = await supabase
        .from("workouts")
        .update(a.intensity ? { ...actual, intensity: a.intensity } : actual)
        .eq("id", targetId)
        .eq("user_id", userId);
      if (!upErr) result.plansCompleted++;
    } else {
      const { error: insErr } = await supabase.from("workouts").insert({
        ...actual,
        user_id: userId,
        sport: a.sport,
        intensity: a.intensity ?? "endurance",
        title: a.title,
      });
      if (!insErr) result.activitiesImported++;
      else if (insErr.code !== "23505") throw new Error(`Import non riuscito: ${insErr.message}`);
    }
  }

  // 2. Planned workouts: mirror the calendar until they're done.
  const seenPlans = new Set<string>();
  for (const p of events.map((e) => eventToWorkout(e, defaultTime))) {
    if (!p) continue;
    seenPlans.add(p.plan_external_id);
    if (pairedPlans.has(p.plan_external_id)) continue;
    const row = planRows.get(p.plan_external_id);
    if (row) {
      // Done, or completed by an activity a moment ago in step 1.
      if (row.completed || row.external_id || taken.has(row.id)) continue;
      const next = {
        date: p.date,
        start_time: p.start_time,
        duration_min: p.duration_min,
        sport: p.sport,
        intensity: p.intensity,
        title: p.title,
        energy_kj: p.energy_kj,
      };
      const unchanged =
        row.date === next.date &&
        row.start_time.slice(0, 5) === next.start_time &&
        row.duration_min === next.duration_min &&
        row.sport === next.sport &&
        row.intensity === next.intensity &&
        row.title === next.title &&
        row.energy_kj === next.energy_kj;
      if (unchanged) continue;
      const { error: upErr } = await supabase
        .from("workouts")
        .update(next)
        .eq("id", row.id)
        .eq("user_id", userId);
      if (!upErr) result.plansUpdated++;
    } else if (p.date >= today) {
      const { error: insErr } = await supabase.from("workouts").insert({ ...p, user_id: userId });
      if (!insErr) result.plansAdded++;
      else if (insErr.code !== "23505") throw new Error(`Import non riuscito: ${insErr.message}`);
    }
  }

  // Planned workouts deleted from the intervals.icu calendar.
  const stale = [...planRows.values()].filter(
    (r) =>
      !seenPlans.has(r.plan_external_id!) &&
      !taken.has(r.id) &&
      !r.completed &&
      !r.external_id &&
      r.date >= today &&
      r.date <= plansTo,
  );
  if (stale.length > 0) {
    const { error: delErr } = await supabase
      .from("workouts")
      .delete()
      .eq("user_id", userId)
      .in(
        "id",
        stale.map((r) => r.id),
      );
    if (!delErr) result.plansRemoved = stale.length;
  }

  await supabase
    .from("intervals_connections")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("user_id", userId);
  return result;
}

export interface IntervalsStatus {
  connected: boolean;
  athleteId: string | null;
  athleteName: string | null;
  defaultTime: string;
  /** Formatted on the server in the user's timezone (avoids hydration mismatches). */
  lastSyncedLabel: string;
}

/** What the UI may know about the connection (never the API key). */
export async function getIntervalsStatus(): Promise<IntervalsStatus> {
  const empty = { connected: false, athleteId: null, athleteName: null, defaultTime: "18:00", lastSyncedLabel: "mai" };
  const userId = await getUserId();
  if (!userId) return empty;
  const supabase = await createClient();
  const conn = await getConnection(supabase, userId);
  if (!conn) return empty;
  return {
    connected: true,
    athleteId: conn.athlete_id,
    athleteName: conn.athlete_name,
    defaultTime: conn.default_time.slice(0, 5),
    lastSyncedLabel: formatDateTime(conn.last_synced_at, await getTimeZone()),
  };
}

/** Removes the connection and the not-yet-done planned workouts it created. */
export async function disconnectIntervals(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  const supabase = await createClient();
  const today = await getToday();
  await supabase
    .from("workouts")
    .delete()
    .eq("user_id", userId)
    .eq("source", "intervals")
    .eq("completed", false)
    .is("external_id", null)
    .not("plan_external_id", "is", null)
    .gte("date", today);
  await supabase.from("intervals_connections").delete().eq("user_id", userId);
}
