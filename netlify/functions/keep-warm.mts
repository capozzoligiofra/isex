import type { Config } from "@netlify/functions";

/**
 * Pings the app every 5 minutes so the Next.js server function stays warm.
 * With little traffic Netlify shuts it down after a few idle minutes and the
 * next visitor waits 1–4 s for a cold start.
 */
export default async function keepWarm() {
  const base = Netlify.env.get("URL") ?? Netlify.env.get("NEXT_PUBLIC_SITE_URL");
  if (!base) return;
  const started = Date.now();
  const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(10000) });
  console.log(`keep-warm: ${res.status} in ${Date.now() - started} ms`);
}

// Every 5 minutes (UTC; the interval is the same in any timezone).
export const config: Config = { schedule: "*/5 * * * *" };
