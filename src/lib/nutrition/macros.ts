import type { Goal, MacroTargets } from "./types";

/**
 * Daily carbohydrate needs (g/kg) as a function of training load, following
 * the ranges in the IOC/ACSM sports nutrition consensus (Burke et al. 2011,
 * Thomas et al. 2016):
 *   light/skill-based        3–5 g/kg
 *   moderate (~1 h/day)       5–7 g/kg
 *   high (1–3 h/day)          6–10 g/kg
 *   very high (>4–5 h/day)    8–12 g/kg
 */
const LOAD_TO_CARBS: Array<[load: number, gPerKg: number]> = [
  [0, 3],
  [0.5, 4],
  [1, 5.5],
  [2, 7],
  [3, 8.5],
  [4, 10],
  [5, 11],
  [7, 12],
];

export const PROTEIN_PER_KG: Record<Goal, number> = {
  lose: 2.0,
  maintain: 1.6,
  gain: 1.8,
};

export const FAT_MIN_PER_KG = 0.8;
export const FAT_MAX_PER_KG = 1.5;
export const CARBS_MAX_PER_KG = 12;

function interpolate(points: Array<[number, number]>, x: number): number {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return points[points.length - 1][1];
}

/**
 * Carbs for the day in g/kg.
 * @param load today's training load (hours of endurance-equivalent work)
 * @param tomorrowLoad tomorrow's load: big sessions are prepared the day before
 */
export function carbsPerKg(
  load: number,
  tomorrowLoad: number,
  goal: Goal,
): number {
  let g = interpolate(LOAD_TO_CARBS, load);
  if (goal === "lose" && load < 1) g -= 0.5;
  if (goal === "gain") g += 0.5;
  if (tomorrowLoad >= 2) g += Math.min(1.5, 0.5 + 0.25 * (tomorrowLoad - 2));
  return Math.min(CARBS_MAX_PER_KG, Math.max(2.5, g));
}

/**
 * Splits an energy target into macros. Carbs and protein are set per kg;
 * fat fills the remaining energy within physiological bounds. If fat would
 * exceed its upper bound the surplus energy goes to carbs; if it would fall
 * below the minimum, the energy target rises (training is never underfuelled).
 */
export function macroTargets(params: {
  weightKg: number;
  goal: Goal;
  energyKcal: number;
  load: number;
  tomorrowLoad: number;
  minCarbsG?: number;
}): MacroTargets {
  const { weightKg, goal, energyKcal, load, tomorrowLoad } = params;
  const minCarbsG = params.minCarbsG ?? 0;
  let carbsG = Math.max(carbsPerKg(load, tomorrowLoad, goal) * weightKg, minCarbsG);
  const carbsCap = Math.max(CARBS_MAX_PER_KG * weightKg, minCarbsG);
  const proteinG = PROTEIN_PER_KG[goal] * weightKg;

  const fatMin = FAT_MIN_PER_KG * weightKg;
  const fatMax = FAT_MAX_PER_KG * weightKg;
  const residualFat = (energyKcal - carbsG * 4 - proteinG * 4) / 9;

  let fatG: number;
  if (residualFat > fatMax) {
    fatG = fatMax;
    carbsG += ((residualFat - fatMax) * 9) / 4;
    carbsG = Math.min(carbsG, carbsCap);
  } else if (residualFat < fatMin) {
    fatG = fatMin;
  } else {
    fatG = residualFat;
  }

  const c = Math.round(carbsG);
  const p = Math.round(proteinG);
  const f = Math.round(fatG);
  return {
    kcal: c * 4 + p * 4 + f * 9,
    carbsG: c,
    proteinG: p,
    fatG: f,
    carbsPerKg: Math.round((c / weightKg) * 10) / 10,
  };
}
