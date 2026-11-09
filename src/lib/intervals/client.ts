import "server-only";
import type { IcuActivity, IcuEvent } from "./map";

export class IntervalsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function baseUrl() {
  // Overridable for tests against a local mock.
  return (process.env.INTERVALS_BASE_URL || "https://intervals.icu").replace(/\/$/, "");
}

export interface IcuCredentials {
  athleteId: string;
  apiKey: string;
}

async function get<T>(creds: IcuCredentials, path: string, query: Record<string, string> = {}) {
  const url = new URL(`${baseUrl()}/api/v1/athlete/${encodeURIComponent(creds.athleteId)}${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: {
      // Basic auth: username "API_KEY", password = the athlete's key.
      Authorization: `Basic ${Buffer.from(`API_KEY:${creds.apiKey}`).toString("base64")}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new IntervalsError(`intervals.icu ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

export function getAthlete(creds: IcuCredentials) {
  return get<{ id: string; name?: string | null; firstname?: string | null; lastname?: string | null }>(
    creds,
    "",
  );
}

const ACTIVITY_FIELDS = [
  "id",
  "start_date_local",
  "type",
  "name",
  "moving_time",
  "elapsed_time",
  "icu_joules",
  "icu_training_load",
  "icu_intensity",
  "paired_event_id",
  "sub_type",
  "source",
].join(",");

export function listActivities(creds: IcuCredentials, oldest: string, newest: string) {
  return get<IcuActivity[]>(creds, "/activities", {
    oldest,
    newest: `${newest}T23:59:59`,
    fields: ACTIVITY_FIELDS,
  });
}

export function listPlannedEvents(creds: IcuCredentials, oldest: string, newest: string) {
  return get<IcuEvent[]>(creds, "/events", {
    oldest,
    newest,
    category: "WORKOUT,RACE_A,RACE_B,RACE_C",
  });
}
