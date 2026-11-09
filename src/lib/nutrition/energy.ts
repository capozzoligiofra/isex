import type {
  ActivityLevel,
  AthleteProfile,
  Goal,
  Intensity,
  Sex,
  Sport,
  Workout,
} from "./types";

/** Daily-life activity factors, excluding planned training. */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.35,
  active: 1.5,
  very_active: 1.7,
};

/**
 * Approximate MET values by sport and intensity, based on the
 * Compendium of Physical Activities (Ainsworth et al.).
 */
export const METS: Record<Sport, Record<Intensity, number>> = {
  cycling: {
    recovery: 4.5,
    endurance: 7,
    tempo: 9,
    threshold: 10.5,
    vo2max: 12,
    race: 11,
  },
  running: {
    recovery: 8,
    endurance: 9.5,
    tempo: 11,
    threshold: 12.5,
    vo2max: 14,
    race: 13,
  },
  swimming: {
    recovery: 5,
    endurance: 7,
    tempo: 8.5,
    threshold: 9.5,
    vo2max: 10,
    race: 10,
  },
  strength: {
    recovery: 3,
    endurance: 3.5,
    tempo: 5,
    threshold: 6,
    vo2max: 6,
    race: 6,
  },
  other: {
    recovery: 4,
    endurance: 6,
    tempo: 7.5,
    threshold: 9,
    vo2max: 10,
    race: 10,
  },
};

/** How much each intensity draws on carbohydrate relative to steady endurance work. */
export const INTENSITY_CARB_FACTOR: Record<Intensity, number> = {
  recovery: 0.5,
  endurance: 1,
  tempo: 1.3,
  threshold: 1.5,
  vo2max: 1.6,
  race: 1.7,
};

const SPORT_CARB_FACTOR: Record<Sport, number> = {
  cycling: 1,
  running: 1,
  swimming: 1,
  strength: 0.6,
  other: 0.9,
};

/** Efficiency-adjusted conversion: ~1.04 kcal expended per kJ of mechanical work. */
const KCAL_PER_KJ = 1.04;

export function ageOn(birthDate: string, date: string): number {
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [y, m, d] = date.split("-").map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age;
}

/** Mifflin-St Jeor resting metabolic rate (kcal/day). */
export function bmr(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/**
 * Net energy cost of a workout (kcal above what the baseline already counts).
 * Uses power-meter work when present, otherwise METs.
 */
export function workoutKcal(workout: Workout, weightKg: number): number {
  const hours = workout.durationMin / 60;
  const resting = weightKg * hours; // 1 MET is already in the baseline
  const gross =
    workout.energyKj && workout.energyKj > 0
      ? workout.energyKj * KCAL_PER_KJ
      : METS[workout.sport][workout.intensity] * weightKg * hours;
  return Math.max(0, gross - resting);
}

/**
 * Carbohydrate "load" of a workout, expressed in hours of steady endurance
 * work. 1 h at endurance pace = 1.0, 1 h of threshold intervals = 1.5.
 */
export function workoutLoad(workout: Workout): number {
  return (
    (workout.durationMin / 60) *
    INTENSITY_CARB_FACTOR[workout.intensity] *
    SPORT_CARB_FACTOR[workout.sport]
  );
}

export function goalAdjustment(goal: Goal, baseline: number): number {
  // The deficit/surplus applies to daily-life energy only, never to the
  // energy needed to fuel training.
  if (goal === "lose") return -Math.min(500, baseline * 0.15);
  if (goal === "gain") return Math.min(400, baseline * 0.1);
  return 0;
}

export function dailyEnergy(
  profile: AthleteProfile,
  date: string,
  workouts: Workout[],
) {
  const age = ageOn(profile.birthDate, date);
  const rmr = bmr(profile.sex, profile.weightKg, profile.heightCm, age);
  const baseline = rmr * ACTIVITY_FACTORS[profile.activityLevel];
  const exercise = workouts.reduce(
    (sum, w) => sum + workoutKcal(w, profile.weightKg),
    0,
  );
  const adj = goalAdjustment(profile.goal, baseline);
  return {
    bmr: rmr,
    baseline,
    exercise,
    goalAdjustment: adj,
    total: baseline + exercise + adj,
  };
}
