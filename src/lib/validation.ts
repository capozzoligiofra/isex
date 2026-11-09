import { z } from "zod";
import { ageOn } from "@/lib/nutrition";
import { isIsoDate } from "@/lib/dates";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isoDate = z.string().refine(isIsoDate, "Data non valida.");
export const timeOfDay = z.string().regex(TIME, "Orario non valido (HH:MM).");

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().pipe(schema).optional(),
  );

export const mealSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/),
  name: z.string().trim().min(1, "Dai un nome al pasto.").max(40),
  time: timeOfDay,
  kind: z.enum(["main", "snack"]),
});

export const mealsSchema = z
  .array(mealSchema)
  .min(1, "Serve almeno un pasto.")
  .max(8, "Al massimo 8 pasti.")
  .refine(
    (meals) => new Set(meals.map((m) => m.id)).size === meals.length,
    "Pasti duplicati.",
  );

export const profileSchema = z
  .object({
    display_name: z.string().trim().max(60).optional(),
    sex: z.enum(["male", "female"], "Seleziona il sesso."),
    birth_date: isoDate,
    height_cm: z.coerce
      .number("Inserisci l'altezza.")
      .min(100, "Altezza tra 100 e 250 cm.")
      .max(250, "Altezza tra 100 e 250 cm."),
    weight_kg: z.coerce
      .number("Inserisci il peso.")
      .min(30, "Peso tra 30 e 250 kg.")
      .max(250, "Peso tra 30 e 250 kg."),
    activity_level: z.enum(["sedentary", "light", "active", "very_active"]),
    goal: z.enum(["lose", "maintain", "gain"]),
    main_sport: z.enum(["cycling", "running", "swimming", "strength", "other"]),
    meals: z.preprocess((v) => {
      try {
        return JSON.parse(String(v));
      } catch {
        return undefined;
      }
    }, mealsSchema),
  })
  .refine(
    (p) => {
      const today = new Date().toISOString().slice(0, 10);
      const age = ageOn(p.birth_date, today);
      return age >= 14 && age <= 100;
    },
    { message: "L'app è pensata per atleti dai 14 anni in su.", path: ["birth_date"] },
  );

export const workoutSchema = z
  .object({
    id: z.uuid().optional(),
    date: isoDate,
    start_time: timeOfDay,
    duration_h: z.coerce.number().int().min(0).max(24),
    duration_m: z.coerce.number().int().min(0).max(59),
    sport: z.enum(["cycling", "running", "swimming", "strength", "other"]),
    intensity: z.enum(["recovery", "endurance", "tempo", "threshold", "vo2max", "race"]),
    title: z.string().trim().max(120).optional(),
    energy_kj: optionalNumber(z.number().int().min(0).max(20000)),
    hot_conditions: z.literal("on").optional(),
    completed: z.literal("on").optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((w) => w.duration_h * 60 + w.duration_m >= 5, {
    message: "Durata minima 5 minuti.",
    path: ["duration_m"],
  })
  .refine((w) => w.duration_h * 60 + w.duration_m <= 1440, {
    message: "Durata massima 24 ore.",
    path: ["duration_h"],
  });

const macro = (label: string) =>
  z.coerce.number(`Inserisci ${label}.`).min(0, `${label} non può essere negativo.`).max(5000);

export const foodEntrySchema = z.object({
  date: isoDate,
  meal_slot: z.string().regex(/^[a-z0-9-]{1,40}$/),
  name: z.string().trim().min(1, "Inserisci il nome dell'alimento.").max(200),
  brand: z.string().trim().max(200).optional(),
  source: z.enum(["manual", "generic", "openfoodfacts"]),
  source_id: z.string().max(100).optional(),
  basis: z.enum(["per100", "total"]),
  grams: z.coerce.number("Inserisci la quantità.").positive("La quantità deve essere maggiore di 0.").max(5000),
  kcal: macro("le kcal"),
  carbs: macro("i carboidrati"),
  protein: macro("le proteine"),
  fat: macro("i grassi"),
});
