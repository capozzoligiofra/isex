import "server-only";
import { syncIntervals } from "@/lib/intervals/sync";
import { syncStrava } from "@/lib/strava/sync";

/**
 * Throttled sync of every connected service, run on page loads. Time-boxed
 * so a slow service never holds up the page, and it never throws.
 */
export async function autoSyncIntegrations(timeoutMs = 5000): Promise<void> {
  const run = async (name: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      console.error(`Sincronizzazione ${name} non riuscita:`, e);
    }
  };
  await Promise.race([
    Promise.all([run("intervals.icu", () => syncIntervals()), run("Strava", () => syncStrava())]),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
