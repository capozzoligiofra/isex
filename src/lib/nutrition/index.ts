import { dailyEnergy, workoutKcal, workoutLoad } from "./energy";
import { fuelingPlan } from "./fueling";
import { macroTargets } from "./macros";
import { planMeals, toMinutes } from "./meals";
import type { AthleteProfile, DayPlan, Workout, WorkoutPlan } from "./types";

export * from "./types";
export { ageOn, bmr, workoutKcal, workoutLoad } from "./energy";
export { carbsPerKg, macroTargets } from "./macros";
export { carbsPerHour, fuelingPlan } from "./fueling";
export { formatTime, planMeals, sessionDemand, toMinutes } from "./meals";

/** Minimum carbs left for meals, in g/kg, after in-workout fueling. */
const MIN_MEAL_CARBS_PER_KG = 2;

function sortByStart(workouts: Workout[]): Workout[] {
  return [...workouts].sort(
    (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
  );
}

/**
 * Builds the full nutrition plan for one day: energy, macro targets,
 * per-workout fueling and per-meal carb coding.
 */
export function computeDayPlan(params: {
  profile: AthleteProfile;
  date: string;
  workouts: Workout[];
  tomorrowWorkouts?: Workout[];
}): DayPlan {
  const { profile, date } = params;
  const workouts = sortByStart(params.workouts);
  const tomorrow = sortByStart(params.tomorrowWorkouts ?? []);
  const kg = profile.weightKg;

  const load = workouts.reduce((s, w) => s + workoutLoad(w), 0);
  const tomorrowLoad = tomorrow.reduce((s, w) => s + workoutLoad(w), 0);

  const workoutPlans: WorkoutPlan[] = workouts.map((w, i) => {
    const end = toMinutes(w.startTime) + w.durationMin;
    const next = workouts[i + 1] ?? tomorrow[0];
    let nextWithinHours: number | null = null;
    if (next) {
      const nextStart =
        toMinutes(next.startTime) + (workouts[i + 1] ? 0 : 24 * 60);
      nextWithinHours = (nextStart - end) / 60;
    }
    return {
      workout: w,
      kcal: Math.round(workoutKcal(w, kg)),
      load: Math.round(workoutLoad(w) * 100) / 100,
      fueling: fuelingPlan(w, kg, { nextSessionWithinHours: nextWithinHours }),
    };
  });

  const fuelingCarbsG = workoutPlans.reduce(
    (s, p) => s + p.fueling.totalCarbsG,
    0,
  );

  const energy = dailyEnergy(profile, date, workouts);
  const targets = macroTargets({
    weightKg: kg,
    goal: profile.goal,
    energyKcal: energy.total,
    load,
    tomorrowLoad,
    minCarbsG: fuelingCarbsG + MIN_MEAL_CARBS_PER_KG * kg,
  });

  const meals = planMeals({
    meals: profile.meals,
    workouts,
    tomorrowWorkouts: tomorrow,
    targets,
    mealCarbsG: Math.max(0, targets.carbsG - fuelingCarbsG),
  });

  return {
    date,
    load: Math.round(load * 100) / 100,
    energy: {
      bmr: Math.round(energy.bmr),
      baseline: Math.round(energy.baseline),
      exercise: Math.round(energy.exercise),
      goalAdjustment: Math.round(energy.goalAdjustment),
      total: Math.round(energy.total),
    },
    targets,
    workouts: workoutPlans,
    meals,
    fuelingCarbsG,
  };
}
