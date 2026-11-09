import type { Intensity, Sport } from "@/lib/nutrition";
import { mapSport } from "@/lib/integrations/common";

export { MATCH_WINDOW_MIN, mapSport, matchPlanned, type PlannedCandidate } from "@/lib/integrations/common";

/** The fields we use from Strava's SummaryActivity. */
export interface StravaActivity {
  id: number;
  name: string;
  sport_type?: string;
  type?: string;
  /** Local time, formatted like "2026-11-09T09:30:00Z" (the Z is not meaningful). */
  start_date_local: string;
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  kilojoules?: number | null;
  workout_type?: number | null;
  suffer_score?: number | null;
  manual?: boolean;
}

/** Strava workout_type codes: runs 1 = race, 3 = workout; rides 11 = race, 12 = workout. */
const RACE_TYPES = new Set([1, 11]);
const WORKOUT_TYPES = new Set([3, 12]);

/**
 * Best guess of the session intensity. Strava's summary has no zones, so we
 * use the race/workout flag and, when heart rate was recorded, Relative
 * Effort per hour. Users can correct it after the import.
 */
export function estimateIntensity(activity: StravaActivity): Intensity {
  if (activity.workout_type != null && RACE_TYPES.has(activity.workout_type)) return "race";
  if (activity.workout_type != null && WORKOUT_TYPES.has(activity.workout_type)) {
    return "threshold";
  }
  const hours = activity.moving_time / 3600;
  if (activity.suffer_score != null && hours > 0) {
    const perHour = activity.suffer_score / hours;
    if (perHour >= 120) return "threshold";
    if (perHour >= 80) return "tempo";
    if (perHour < 25) return "recovery";
  }
  return "endurance";
}

export interface ImportedWorkout {
  date: string;
  start_time: string;
  duration_min: number;
  sport: Sport;
  intensity: Intensity;
  title: string;
  energy_kj: number | null;
  completed: true;
  source: "strava";
  external_id: string;
}

export const MIN_DURATION_MIN = 5;
export const MAX_DURATION_MIN = 1440;

/** Converts a Strava activity, or returns null for activities too short to matter. */
export function toWorkout(activity: StravaActivity): ImportedWorkout | null {
  const seconds = activity.moving_time || activity.elapsed_time;
  const minutes = Math.round(seconds / 60);
  if (minutes < MIN_DURATION_MIN) return null;
  const local = activity.start_date_local;
  return {
    date: local.slice(0, 10),
    start_time: local.slice(11, 16),
    duration_min: Math.min(MAX_DURATION_MIN, minutes),
    sport: mapSport(activity),
    intensity: estimateIntensity(activity),
    title: (activity.name || "Attività Strava").slice(0, 120),
    energy_kj:
      activity.kilojoules && activity.kilojoules > 0 ? Math.round(activity.kilojoules) : null,
    completed: true,
    source: "strava",
    external_id: String(activity.id),
  };
}
