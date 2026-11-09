import { mapSport } from "@/lib/integrations/common";
import type { Intensity, Sport } from "@/lib/nutrition";

/** Calendar event fields we use (GET /api/v1/athlete/{id}/events). */
export interface IcuEvent {
  id: number;
  start_date_local: string; // "2026-11-10T00:00:00"
  category: string;
  type?: string | null;
  name?: string | null;
  moving_time?: number | null; // planned seconds
  joules?: number | null;
  icu_training_load?: number | null;
  icu_intensity?: number | null; // percent of threshold
}

/** Activity fields we use (GET /api/v1/athlete/{id}/activities). */
export interface IcuActivity {
  id: string;
  start_date_local: string;
  type?: string | null;
  name?: string | null;
  moving_time?: number | null;
  elapsed_time?: number | null;
  icu_joules?: number | null;
  icu_training_load?: number | null;
  icu_intensity?: number | null;
  paired_event_id?: number | null;
  sub_type?: string | null;
  source?: string | null;
}

export const PLANNED_CATEGORIES = ["WORKOUT", "RACE_A", "RACE_B", "RACE_C"];
export const MIN_DURATION_MIN = 5;
const MAX_DURATION_MIN = 1440;

/**
 * Intensity from intervals.icu's Intensity Factor (percent of threshold). If
 * only training load is known, IF is derived from it (load = h × IF² × 100).
 * Returns null when neither is available.
 */
export function intensityFromData(params: {
  icuIntensity?: number | null;
  trainingLoad?: number | null;
  seconds: number;
}): Intensity | null {
  let factor = params.icuIntensity && params.icuIntensity > 0 ? params.icuIntensity / 100 : null;
  if (factor == null && params.trainingLoad && params.trainingLoad > 0 && params.seconds > 0) {
    factor = Math.sqrt(params.trainingLoad / ((params.seconds / 3600) * 100));
  }
  if (factor == null) return null;
  if (factor < 0.6) return "recovery";
  if (factor < 0.76) return "endurance";
  if (factor < 0.85) return "tempo";
  if (factor < 0.95) return "threshold";
  return "vo2max";
}

function clampMinutes(seconds: number) {
  return Math.min(MAX_DURATION_MIN, Math.round(seconds / 60));
}

function kj(joules?: number | null) {
  return joules && joules > 0 ? Math.round(joules / 1000) : null;
}

export interface PlannedImport {
  date: string;
  start_time: string;
  duration_min: number;
  sport: Sport;
  intensity: Intensity;
  title: string;
  energy_kj: number | null;
  completed: false;
  source: "intervals";
  plan_external_id: string;
}

/** A planned workout or race from the calendar, or null for notes and the like. */
export function eventToWorkout(event: IcuEvent, defaultTime: string): PlannedImport | null {
  if (!PLANNED_CATEGORIES.includes(event.category)) return null;
  const seconds = event.moving_time ?? 0;
  if (seconds < MIN_DURATION_MIN * 60) return null;
  const time = event.start_date_local.slice(11, 16);
  const race = event.category.startsWith("RACE");
  return {
    date: event.start_date_local.slice(0, 10),
    // Planned workouts often have no time of day (midnight): use the athlete's usual time.
    start_time: !time || time === "00:00" ? defaultTime : time,
    duration_min: clampMinutes(seconds),
    sport: mapSport({ type: event.type }),
    intensity: race
      ? "race"
      : (intensityFromData({
          icuIntensity: event.icu_intensity,
          trainingLoad: event.icu_training_load,
          seconds,
        }) ?? "endurance"),
    title: (event.name || (race ? "Gara" : "Allenamento pianificato")).slice(0, 120),
    energy_kj: kj(event.joules),
    completed: false,
    source: "intervals",
    plan_external_id: `e${event.id}`,
  };
}

export interface ActivityImport {
  date: string;
  start_time: string;
  duration_min: number;
  sport: Sport;
  /** Null when the activity has no power/HR data to judge it by. */
  intensity: Intensity | null;
  title: string;
  energy_kj: number | null;
  completed: true;
  source: "intervals";
  external_id: string;
  pairedPlanId: string | null;
}

/** A recorded activity, or null if too short or without timing data. */
export function activityToWorkout(activity: IcuActivity): ActivityImport | null {
  const seconds = activity.moving_time || activity.elapsed_time || 0;
  if (seconds < MIN_DURATION_MIN * 60) return null;
  return {
    date: activity.start_date_local.slice(0, 10),
    start_time: activity.start_date_local.slice(11, 16),
    duration_min: clampMinutes(seconds),
    sport: mapSport({ type: activity.type }),
    intensity:
      activity.sub_type === "RACE"
        ? "race"
        : intensityFromData({
            icuIntensity: activity.icu_intensity,
            trainingLoad: activity.icu_training_load,
            seconds,
          }),
    title: (activity.name || "Attività").slice(0, 120),
    energy_kj: kj(activity.icu_joules),
    completed: true,
    source: "intervals",
    external_id: String(activity.id).slice(0, 40),
    pairedPlanId: activity.paired_event_id ? `e${activity.paired_event_id}` : null,
  };
}

/** Accepts "i12345", "12345" or "I12345" and returns "i12345", or null. */
export function normalizeAthleteId(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  const m = /^i?(\d{1,12})$/.exec(v);
  return m ? `i${m[1]}` : null;
}
