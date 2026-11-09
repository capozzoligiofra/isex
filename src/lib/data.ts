import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createDbClient, readAccessToken, verifyAccessToken } from "@/lib/supabase/session";
import { DEFAULT_TIMEZONE, todayIso } from "@/lib/dates";
import {
  FOOD_COLUMNS,
  PROFILE_COLUMNS,
  WORKOUT_COLUMNS,
  toFoodEntry,
  toProfile,
  toWorkout,
  type FoodEntryRow,
  type ProfileRow,
  type WorkoutRow,
} from "@/lib/db";

/** Tokens this close to expiry count as expired: rendering never refreshes them. */
const EXPIRY_MARGIN_MS = 60_000;

/**
 * The signed-in user for this render, verified from the auth cookie without
 * any network call or session refresh (see lib/supabase/session.ts).
 */
export const getAuth = cache(async (): Promise<{ userId: string; token: string } | null> => {
  if (!isSupabaseConfigured()) return null;
  const token = await readAccessToken((await cookies()).getAll());
  if (!token) return null;
  const claims = await verifyAccessToken(token);
  if (!claims || claims.exp * 1000 - Date.now() < EXPIRY_MARGIN_MS) return null;
  return { userId: claims.sub, token };
});

export const getUserId = cache(async (): Promise<string | null> => (await getAuth())?.userId ?? null);

// Per-request holder for where to come back to after logging in again.
const returnPath = cache(() => ({ value: "/oggi" }));

/** Call at the top of a page so an expired session comes back here after login. */
export function setReturnPath(path: string) {
  returnPath().value = path;
}

function redirectToLogin(): never {
  redirect(`/login?next=${encodeURIComponent(returnPath().value)}`);
}

export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) redirectToLogin();
  return id;
}

/** Database client for rendering, bound to the user's access token. */
export const getDb = cache(async () => {
  const auth = await getAuth();
  if (!auth) redirectToLogin();
  return createDbClient(auth.token);
});

/**
 * For Server Actions: verifies the user and refreshes the session if needed
 * (actions can write cookies). Returns the SSR client to use for queries.
 */
export async function requireActionUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return { userId, supabase };
}

export const getProfileRow = cache(async (): Promise<ProfileRow | null> => {
  const [userId, supabase] = await Promise.all([requireUserId(), getDb()]);
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`Errore nel caricare il profilo: ${error.message}`);
  return data as ProfileRow | null;
});

/** The complete athlete profile; sends the user to onboarding if it's missing data. */
export async function requireProfile() {
  const row = await getProfileRow();
  const profile = row ? toProfile(row) : null;
  if (!profile) redirect("/onboarding");
  return profile;
}

export async function getWorkouts(from: string, to: string) {
  const [userId, supabase] = await Promise.all([requireUserId(), getDb()]);
  const { data, error } = await supabase
    .from("workouts")
    .select(WORKOUT_COLUMNS)
    .eq("user_id", userId)
    .gte("date", from)
    .lte("date", to)
    .order("date")
    .order("start_time");
  if (error) throw new Error(`Errore nel caricare gli allenamenti: ${error.message}`);
  return (data as WorkoutRow[]).map(toWorkout);
}

export async function getWorkout(id: string) {
  const [userId, supabase] = await Promise.all([requireUserId(), getDb()]);
  const { data, error } = await supabase
    .from("workouts")
    .select(WORKOUT_COLUMNS)
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data ? toWorkout(data as WorkoutRow) : null;
}

export async function getFoodEntries(date: string) {
  const [userId, supabase] = await Promise.all([requireUserId(), getDb()]);
  const { data, error } = await supabase
    .from("food_entries")
    .select(FOOD_COLUMNS)
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at");
  if (error) throw new Error(`Errore nel caricare il diario: ${error.message}`);
  return (data as FoodEntryRow[]).map(toFoodEntry);
}

/** Most recently logged distinct foods, for quick re-adding. */
export async function getRecentFoods(limit = 12) {
  const [userId, supabase] = await Promise.all([requireUserId(), getDb()]);
  const { data, error } = await supabase
    .from("food_entries")
    .select(FOOD_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  const seen = new Set<string>();
  const out = [];
  for (const entry of (data as FoodEntryRow[]).map(toFoodEntry)) {
    const key = `${entry.name}|${entry.brand ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
    if (out.length >= limit) break;
  }
  return out;
}

/** The user's timezone, set by the browser in the `tz` cookie. */
export async function getTimeZone(): Promise<string> {
  const tz = (await cookies()).get("tz")?.value;
  return tz ? decodeURIComponent(tz) : DEFAULT_TIMEZONE;
}

/** "Today" in the user's timezone. */
export async function getToday(): Promise<string> {
  return todayIso(await getTimeZone());
}
