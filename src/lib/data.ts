import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
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

/** The signed-in user's id, verified against the JWT, or null. */
export const getUserId = cache(async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
});

export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) redirect("/login");
  return id;
}

export const getProfileRow = cache(async (): Promise<ProfileRow | null> => {
  const userId = await requireUserId();
  const supabase = await createClient();
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
  const userId = await requireUserId();
  const supabase = await createClient();
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
  const userId = await requireUserId();
  const supabase = await createClient();
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
  const userId = await requireUserId();
  const supabase = await createClient();
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
  const userId = await requireUserId();
  const supabase = await createClient();
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

/** "Today" in the user's timezone (set by the browser in the `tz` cookie). */
export async function getToday(): Promise<string> {
  const tz = (await cookies()).get("tz")?.value;
  return todayIso(tz ? decodeURIComponent(tz) : DEFAULT_TIMEZONE);
}
