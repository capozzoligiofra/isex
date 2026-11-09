import type {
  ActivityLevel,
  CarbCode,
  Goal,
  Intensity,
  Sport,
} from "@/lib/nutrition";

export const SPORTS: Record<Sport, string> = {
  cycling: "Ciclismo",
  running: "Corsa",
  swimming: "Nuoto",
  strength: "Forza / palestra",
  other: "Altro",
};

export const INTENSITIES: Record<Intensity, { label: string; hint: string }> = {
  recovery: { label: "Recupero", hint: "Z1 · molto facile, si parla senza fatica" },
  endurance: { label: "Fondo", hint: "Z2 · ritmo aerobico costante" },
  tempo: { label: "Medio", hint: "Z3 · impegnativo ma sostenibile" },
  threshold: { label: "Soglia", hint: "Z4 · ripetute vicino alla soglia" },
  vo2max: { label: "VO2max", hint: "Z5 · ripetute brevi e molto intense" },
  race: { label: "Gara", hint: "Sforzo da competizione" },
};

export const GOALS: Record<Goal, { label: string; hint: string }> = {
  lose: { label: "Perdere peso", hint: "Deficit moderato solo nei giorni leggeri" },
  maintain: { label: "Mantenere", hint: "Energia pari al fabbisogno" },
  gain: { label: "Aumentare massa", hint: "Leggero surplus" },
};

export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; hint: string }> = {
  sedentary: { label: "Sedentario", hint: "Lavoro alla scrivania, pochi spostamenti" },
  light: { label: "Leggero", hint: "In piedi ogni tanto, qualche spostamento a piedi" },
  active: { label: "Attivo", hint: "Spesso in piedi o in movimento" },
  very_active: { label: "Molto attivo", hint: "Lavoro fisico" },
};

export const CARB_CODES: Record<CarbCode, { label: string; short: string }> = {
  low: { label: "Carbo basso", short: "Basso" },
  medium: { label: "Carbo medio", short: "Medio" },
  high: { label: "Carbo alto", short: "Alto" },
};

export const SOURCES: Record<"strava" | "intervals", { label: string; activityUrl: (id: string) => string; linkText: string }> = {
  strava: {
    label: "Strava",
    activityUrl: (id) => `https://www.strava.com/activities/${id}`,
    linkText: "View on Strava",
  },
  intervals: {
    label: "intervals.icu",
    activityUrl: (id) => `https://intervals.icu/activities/${id}`,
    linkText: "Vedi su intervals.icu",
  },
};

export function dayLoadLabel(load: number): string {
  if (load === 0) return "Riposo";
  if (load < 0.75) return "Giornata leggera";
  if (load < 1.5) return "Giornata moderata";
  if (load < 3) return "Giornata intensa";
  return "Giornata molto intensa";
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}
