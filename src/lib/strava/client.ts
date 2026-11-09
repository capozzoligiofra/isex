import "server-only";
import { stravaConfig } from "./config";
import type { StravaActivity } from "./map";

export class StravaError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  athlete?: { id: number; firstname?: string; lastname?: string };
}

function config() {
  const c = stravaConfig();
  if (!c) throw new StravaError("Strava non configurato", 500);
  return c;
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new StravaError(`Strava ${res.status}: ${body.slice(0, 200)}`, res.status);
  }
  return res.json() as Promise<T>;
}

function tokenRequest(params: Record<string, string>) {
  const c = config();
  return request<StravaTokens>(`${c.baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      ...params,
    }),
  });
}

export function authorizeUrl(redirectUri: string, state: string, scope: string): string {
  const c = config();
  const url = new URL(`${c.baseUrl}/oauth/authorize`);
  url.searchParams.set("client_id", c.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("approval_prompt", "auto");
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  return url.toString();
}

export function exchangeCode(code: string) {
  return tokenRequest({ code, grant_type: "authorization_code" });
}

export function refreshTokens(refreshToken: string) {
  return tokenRequest({ refresh_token: refreshToken, grant_type: "refresh_token" });
}

/** Activities started after `afterEpoch`, oldest first, up to `maxPages` × 100. */
export async function listActivities(
  accessToken: string,
  afterEpoch: number,
  maxPages = 3,
): Promise<StravaActivity[]> {
  const c = config();
  const all: StravaActivity[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const url = new URL(`${c.baseUrl}/api/v3/athlete/activities`);
    url.searchParams.set("after", String(Math.floor(afterEpoch)));
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    const batch = await request<StravaActivity[]>(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

export async function deauthorize(accessToken: string): Promise<void> {
  const c = config();
  await request(`${c.baseUrl}/oauth/deauthorize`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
