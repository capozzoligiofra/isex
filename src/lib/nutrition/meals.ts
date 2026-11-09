import { INTENSITY_CARB_FACTOR } from "./energy";
import type {
  CarbCode,
  MacroTargets,
  MealPlan,
  MealSlot,
  Workout,
} from "./types";

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function formatTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** How demanding a session is for the meals around it (0–2). */
export function sessionDemand(workout: Workout): number {
  const hours = workout.durationMin / 60;
  const sportFactor = workout.sport === "strength" ? 0.6 : 1;
  return Math.min(2, hours * INTENSITY_CARB_FACTOR[workout.intensity] * sportFactor);
}

function preWeight(minutesBefore: number): number {
  if (minutesBefore < 0) return 0;
  if (minutesBefore <= 60) return 0.7; // little time to digest
  if (minutesBefore <= 180) return 1;
  if (minutesBefore <= 240) return 0.6;
  return 0;
}

function postWeight(minutesAfter: number): number {
  if (minutesAfter < 0) return 0;
  if (minutesAfter <= 120) return 1;
  if (minutesAfter <= 240) return 0.6;
  if (minutesAfter <= 480) return 0.35;
  return 0;
}

const CODE_WEIGHT: Record<CarbCode, number> = { low: 1, medium: 2, high: 3.5 };
const KIND_WEIGHT = { main: 1, snack: 0.5 } as const;

export function codeFromScore(score: number): CarbCode {
  if (score >= 1.2) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

function label(w: Workout): string {
  return w.title?.trim() || "allenamento";
}

/**
 * Assigns each meal a carbohydrate code (low / medium / high) based on the
 * sessions before and after it, then splits the day's macros across meals.
 *
 * @param mealCarbsG carbs to place in meals (daily target minus in-workout fueling)
 */
export function planMeals(params: {
  meals: MealSlot[];
  workouts: Workout[];
  tomorrowWorkouts: Workout[];
  targets: MacroTargets;
  mealCarbsG: number;
}): MealPlan[] {
  const meals = [...params.meals].sort(
    (a, b) => toMinutes(a.time) - toMinutes(b.time),
  );
  if (meals.length === 0) return [];

  const lastMainId = [...meals].reverse().find((m) => m.kind === "main")?.id;
  const tomorrowMorning = params.tomorrowWorkouts
    .filter((w) => toMinutes(w.startTime) < 12 * 60)
    .sort((a, b) => sessionDemand(b) - sessionDemand(a))[0];

  const scored = meals.map((slot) => {
    const t = toMinutes(slot.time);
    let score = 0;
    let preTouchesMeal = false;
    const reasons: string[] = [];

    for (const w of params.workouts) {
      const start = toMinutes(w.startTime);
      const end = start + w.durationMin;
      const demand = sessionDemand(w);
      // A meal scheduled during the session is treated as eaten right before.
      const before = t > start && t < end ? 0 : start - t;
      const pre = preWeight(before) * demand;
      const post = t >= end ? postWeight(t - end) * demand : 0;
      if (pre > 0.05) {
        score += pre;
        reasons.push(`Prima di: ${label(w)} (${w.startTime})`);
        if (before <= 90) preTouchesMeal = true;
      }
      if (post > 0.05) {
        score += post;
        reasons.push(`Recupero dopo: ${label(w)}`);
      }
    }

    if (slot.id === lastMainId && tomorrowMorning) {
      const pre = 0.8 * sessionDemand(tomorrowMorning);
      if (pre > 0.05) {
        score += pre;
        reasons.push(
          `Carica per domani: ${label(tomorrowMorning)} (${tomorrowMorning.startTime})`,
        );
      }
    }

    const code = codeFromScore(score);
    if (reasons.length === 0) reasons.push("Nessun allenamento vicino");
    return { slot, code, score, reasons, preTouchesMeal };
  });

  const carbWeights = scored.map(
    (s) => CODE_WEIGHT[s.code] * KIND_WEIGHT[s.slot.kind],
  );
  const proteinWeights = scored.map((s) => KIND_WEIGHT[s.slot.kind]);
  // Keep fat low close to a session to speed up digestion.
  const fatWeights = scored.map(
    (s) => KIND_WEIGHT[s.slot.kind] * (s.preTouchesMeal ? 0.4 : 1),
  );

  const carbs = split(params.mealCarbsG, carbWeights);
  const protein = split(params.targets.proteinG, proteinWeights);
  const fat = split(params.targets.fatG, fatWeights);

  return scored.map((s, i) => ({
    slot: s.slot,
    code: s.code,
    carbsG: carbs[i],
    proteinG: protein[i],
    fatG: fat[i],
    kcal: carbs[i] * 4 + protein[i] * 4 + fat[i] * 9,
    reasons: s.reasons,
  }));
}

/** Splits an integer total proportionally, keeping the exact sum. */
export function split(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0 || total <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let rest = Math.round(total) - out.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) {
    out[order[k].i] += 1;
  }
  return out;
}
