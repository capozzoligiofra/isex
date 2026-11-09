import type { Config } from "@netlify/functions";

const WARM_INSTANCES = 2;

/**
 * Pings the app every 5 minutes so the Next.js server function stays warm.
 * With little traffic Netlify shuts it down after a few idle minutes and the
 * next visitor waits 1–4 s for a cold start.
 */
export default async function keepWarm() {
  const base = Netlify.env.get("URL") ?? Netlify.env.get("NEXT_PUBLIC_SITE_URL");
  if (!base) return;
  // Two requests at once keep two instances warm, so a page load and a
  // quick follow-up navigation don't both hit a cold start.
  const started = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: WARM_INSTANCES }, () =>
      fetch(`${base}/api/health`, { signal: AbortSignal.timeout(10000) }),
    ),
  );
  const statuses = results.map((r) => (r.status === "fulfilled" ? r.value.status : "errore"));
  console.log(`keep-warm: ${statuses.join(", ")} in ${Date.now() - started} ms`);
}

// Every 5 minutes (UTC; the interval is the same in any timezone).
export const config: Config = { schedule: "*/5 * * * *" };
