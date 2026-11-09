import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getToday, getUserId } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

/** Everything a sync needs, so it can also run outside the request (after()). */
export interface SyncContext {
  supabase: SupabaseClient;
  userId: string;
  /** "Today" in the user's timezone. */
  today: string;
}

/** Context from the current request (Server Actions, Route Handlers, render). */
export async function requestSyncContext(): Promise<SyncContext | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const [supabase, today] = await Promise.all([createClient(), getToday()]);
  return { supabase, userId, today };
}
