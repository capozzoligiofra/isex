export type Sex = "male" | "female";
export type Goal = "lose" | "maintain" | "gain";
/** Activity outside of training (job, commuting, daily life). */
export type ActivityLevel = "sedentary" | "light" | "active" | "very_active";
export type Sport = "cycling" | "running" | "swimming" | "strength" | "other";
export type Intensity =
  | "recovery"
  | "endurance"
  | "tempo"
  | "threshold"
  | "vo2max"
  | "race";
export type MealKind = "main" | "snack";
export type CarbCode = "low" | "medium" | "high";

export interface MealSlot {
  id: string;
  name: string;
  /** "HH:MM" */
  time: string;
  kind: MealKind;
}

export interface AthleteProfile {
  sex: Sex;
  birthDate: string; // YYYY-MM-DD
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  meals: MealSlot[];
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMin: number;
  sport: Sport;
  intensity: Intensity;
  title?: string | null;
  /** Mechanical work from a power meter, if available. */
  energyKj?: number | null;
  hotConditions?: boolean;
}

export interface FuelingFeed {
  /** Minutes from workout start. */
  atMin: number;
  carbsG: number;
}

export interface FuelingPlan {
  carbsPerHour: number;
  totalCarbsG: number;
  fluidMlPerHour: number;
  sodiumMgPerHour: number;
  feeds: FuelingFeed[];
  /** Carbs suggested in the 1–4 h before the session (0 if not needed). */
  preCarbsG: number;
  /** Carbs suggested in the first hours after the session. */
  postCarbsG: number;
  postProteinG: number;
  notes: string[];
}

export interface WorkoutPlan {
  workout: Workout;
  kcal: number;
  load: number;
  fueling: FuelingPlan;
}

export interface MealPlan {
  slot: MealSlot;
  code: CarbCode;
  carbsG: number;
  proteinG: number;
  fatG: number;
  kcal: number;
  reasons: string[];
}

export interface EnergyBreakdown {
  bmr: number;
  /** BMR × daily-life activity factor. */
  baseline: number;
  exercise: number;
  goalAdjustment: number;
  total: number;
}

export interface MacroTargets {
  kcal: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  carbsPerKg: number;
}

export interface DayPlan {
  date: string;
  load: number;
  energy: EnergyBreakdown;
  targets: MacroTargets;
  workouts: WorkoutPlan[];
  meals: MealPlan[];
  /** Carbs planned during workouts (already included in targets.carbsG). */
  fuelingCarbsG: number;
}
