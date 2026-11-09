import type { Sport } from "@/lib/nutrition";

const CYCLING = new Set([
  "Ride",
  "VirtualRide",
  "GravelRide",
  "MountainBikeRide",
  "EBikeRide",
  "EMountainBikeRide",
  "Velomobile",
  "Handcycle",
  "TrackRide",
]);
const RUNNING = new Set(["Run", "TrailRun", "VirtualRun"]);
const SWIMMING = new Set(["Swim", "OpenWaterSwim"]);
const STRENGTH = new Set(["WeightTraining", "Crossfit", "HighIntensityIntervalTraining"]);

/** Maps Strava-style activity types (also used by intervals.icu) to our sports. */
export function mapSport(activity: { sport_type?: string | null; type?: string | null }): Sport {
  const t = activity.sport_type || activity.type || "";
  if (CYCLING.has(t)) return "cycling";
  if (RUNNING.has(t)) return "running";
  if (SWIMMING.has(t)) return "swimming";
  if (STRENGTH.has(t)) return "strength";
  return "other";
}

export interface PlannedCandidate {
  id: string;
  date: string;
  startTime: string; // HH:MM
  sport: Sport;
  completed: boolean;
  /** Already tied to a recorded activity. */
  linked: boolean;
}

/** How far apart (minutes) a plan and the activity can start and still match. */
export const MATCH_WINDOW_MIN = 180;

function minutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Finds the open planned workout (not completed, no activity attached) this
 * activity most likely corresponds to: same day, same sport, start within 3 h.
 */
export function matchPlanned(
  activity: { date: string; start_time: string; sport: Sport },
  candidates: PlannedCandidate[],
  taken: Set<string> = new Set(),
): string | null {
  let best: { id: string; gap: number } | null = null;
  for (const c of candidates) {
    if (taken.has(c.id) || c.completed || c.linked) continue;
    if (c.date !== activity.date || c.sport !== activity.sport) continue;
    const gap = Math.abs(minutes(c.startTime) - minutes(activity.start_time));
    if (gap > MATCH_WINDOW_MIN) continue;
    if (!best || gap < best.gap) best = { id: c.id, gap };
  }
  return best?.id ?? null;
}
