import "server-only";
import { cookies } from "next/headers";
import { after } from "next/server";
import { getToday, getUserId } from "@/lib/data";
import { syncIntervals } from "@/lib/intervals/sync";
import { syncStrava } from "@/lib/strava/sync";
import { createClientFromSnapshot } from "@/lib/supabase/server";

/**
 * Schedules a throttled sync of every connected service to run after the
 * page has been sent, so external APIs never slow down rendering. New data
 * shows up on the next navigation.
 */
export async function scheduleIntegrationSync(): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;
  // Request APIs can't be used inside after() in Server Components: read them now.
  const [cookieStore, today] = await Promise.all([cookies(), getToday()]);
  const snapshot = cookieStore.getAll().map(({ name, value }) => ({ name, value }));

  after(async () => {
    const ctx = { supabase: createClientFromSnapshot(snapshot), userId, today };
    const results = await Promise.allSettled([syncIntervals({ ctx }), syncStrava({ ctx })]);
    for (const [i, r] of results.entries()) {
      if (r.status === "rejected") {
        console.error(`Sincronizzazione ${i === 0 ? "intervals.icu" : "Strava"} non riuscita:`, r.reason);
      }
    }
  });
}
