import type {
  ActivityLevel,
  AthleteProfile,
  Goal,
  Intensity,
  MealSlot,
  Sex,
  Sport,
  Workout,
} from "@/lib/nutrition";

export interface ProfileRow {
  id: string;
  display_name: string | null;
  sex: Sex | null;
  birth_date: string | null;
  height_cm: number | string | null;
  weight_kg: number | string | null;
  activity_level: ActivityLevel;
  goal: Goal;
  main_sport: Sport;
  meals: MealSlot[];
}

export interface WorkoutRow {
  id: string;
  user_id: string;
  date: string;
  start_time: string; // HH:MM:SS
  duration_min: number;
  sport: Sport;
  intensity: Intensity;
  title: string | null;
  energy_kj: number | null;
  hot_conditions: boolean;
  completed: boolean;
  notes: string | null;
}

export interface FoodEntryRow {
  id: string;
  date: string;
  meal_slot: string;
  name: string;
  brand: string | null;
  source: "manual" | "generic" | "openfoodfacts";
  source_id: string | null;
  grams: number | string;
  kcal: number | string;
  carbs_g: number | string;
  protein_g: number | string;
  fat_g: number | string;
  created_at: string;
}

export interface FoodEntry {
  id: string;
  date: string;
  mealSlot: string;
  name: string;
  brand: string | null;
  source: FoodEntryRow["source"];
  sourceId: string | null;
  grams: number;
  kcal: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
}

export const WORKOUT_COLUMNS =
  "id, user_id, date, start_time, duration_min, sport, intensity, title, energy_kj, hot_conditions, completed, notes";
export const FOOD_COLUMNS =
  "id, date, meal_slot, name, brand, source, source_id, grams, kcal, carbs_g, protein_g, fat_g, created_at";
export const PROFILE_COLUMNS =
  "id, display_name, sex, birth_date, height_cm, weight_kg, activity_level, goal, main_sport, meals";

/** A profile with everything the nutrition engine needs. */
export interface CompleteProfile extends AthleteProfile {
  id: string;
  displayName: string | null;
  mainSport: Sport;
}

export function toProfile(row: ProfileRow): CompleteProfile | null {
  if (!row.sex || !row.birth_date || !row.height_cm || !row.weight_kg) {
    return null;
  }
  return {
    id: row.id,
    displayName: row.display_name,
    mainSport: row.main_sport,
    sex: row.sex,
    birthDate: row.birth_date,
    heightCm: Number(row.height_cm),
    weightKg: Number(row.weight_kg),
    goal: row.goal,
    activityLevel: row.activity_level,
    meals: Array.isArray(row.meals) ? row.meals : [],
  };
}

export interface WorkoutRecord extends Workout {
  completed: boolean;
  notes: string | null;
}

export function toWorkout(row: WorkoutRow): WorkoutRecord {
  return {
    id: row.id,
    date: row.date,
    startTime: row.start_time.slice(0, 5),
    durationMin: row.duration_min,
    sport: row.sport,
    intensity: row.intensity,
    title: row.title,
    energyKj: row.energy_kj,
    hotConditions: row.hot_conditions,
    completed: row.completed,
    notes: row.notes,
  };
}

export function toFoodEntry(row: FoodEntryRow): FoodEntry {
  return {
    id: row.id,
    date: row.date,
    mealSlot: row.meal_slot,
    name: row.name,
    brand: row.brand,
    source: row.source,
    sourceId: row.source_id,
    grams: Number(row.grams),
    kcal: Number(row.kcal),
    carbsG: Number(row.carbs_g),
    proteinG: Number(row.protein_g),
    fatG: Number(row.fat_g),
  };
}
