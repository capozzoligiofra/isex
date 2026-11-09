/** Strava app credentials (server only). Create the app at strava.com/settings/api. */
export function stravaConfig() {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    // Overridable for tests against a local mock.
    baseUrl: (process.env.STRAVA_BASE_URL || "https://www.strava.com").replace(/\/$/, ""),
  };
}

export function isStravaConfigured(): boolean {
  return stravaConfig() !== null;
}

/** Read-only access to all activities, including private ones. */
export const STRAVA_SCOPE = "read,activity:read_all";

/** Cookie holding the OAuth `state` between /connect and /callback. */
export const STATE_COOKIE = "strava_oauth_state";
