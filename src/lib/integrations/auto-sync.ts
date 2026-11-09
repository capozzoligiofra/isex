import "server-only";
import { after } from "next/server";
import { getAuth, getToday } from "@/lib/data";
import { syncIntervals } from "@/lib/intervals/sync";
import { syncStrava } from "@/lib/strava/sync";
import { createDbClient } from "@/lib/supabase/session";

/**
 * Schedules a throttled sync of every connected service to run after the
 * page has been sent, so external APIs never slow down rendering. New data
 * shows up on the next navigation.
 */
export async function scheduleIntegrationSync(): Promise<void> {
  // Request APIs can't be used inside after() in Server Components: read them now.
  const [auth, today] = await Promise.all([getAuth(), getToday()]);
  if (!auth) return;

  after(async () => {
    const ctx = { supabase: createDbClient(auth.token), userId: auth.userId, today };
    const results = await Promise.allSettled([syncIntervals({ ctx }), syncStrava({ ctx })]);
    for (const [i, r] of results.entries()) {
      if (r.status === "rejected") {
        console.error(`Sincronizzazione ${i === 0 ? "intervals.icu" : "Strava"} non riuscita:`, r.reason);
      }
    }
  });
}
