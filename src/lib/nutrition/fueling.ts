import { split } from "./meals";
import type { FuelingFeed, FuelingPlan, Intensity, Workout } from "./types";

const HARD: Intensity[] = ["threshold", "vo2max", "race"];

/**
 * Carbohydrate intake during exercise (g/h), following Jeukendrup (2014) and
 * the ACSM position stand:
 *   < 45 min           not needed
 *   45–75 min          small amounts / mouth rinse for hard efforts
 *   1–2.5 h            30–60 g/h
 *   > 2.5 h            up to 90 g/h (glucose + fructose)
 */
export function carbsPerHour(workout: Workout): number {
  const hours = workout.durationMin / 60;
  const { intensity, sport } = workout;
  const hard = HARD.includes(intensity);

  if (sport === "strength") return hours >= 1.5 ? 20 : 0;
  if (hours < 0.75) return 0;
  if (hours < 1.25) {
    if (hard) return 30;
    return intensity === "tempo" ? 20 : 0;
  }
  if (hours < 2.5) {
    if (intensity === "recovery") return 20;
    if (intensity === "endurance") return 40;
    if (intensity === "tempo") return 50;
    return 60;
  }
  if (intensity === "recovery") return 30;
  if (intensity === "endurance") return 60;
  if (intensity === "tempo") return 75;
  return 90;
}

const FEED_INTERVAL_MIN = 20;

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function fuelingPlan(
  workout: Workout,
  weightKg: number,
  opts: { nextSessionWithinHours?: number | null } = {},
): FuelingPlan {
  const hours = workout.durationMin / 60;
  const hard = HARD.includes(workout.intensity);
  const hot = Boolean(workout.hotConditions);
  const notes: string[] = [];

  const cph = carbsPerHour(workout);
  // One feed every 20 minutes, none in the last 10 minutes. The hourly
  // target over the whole session is spread across the feeds.
  const feedTimes: number[] = [];
  if (cph > 0) {
    for (
      let t = FEED_INTERVAL_MIN;
      t <= workout.durationMin - 10;
      t += FEED_INTERVAL_MIN
    ) {
      feedTimes.push(t);
    }
  }
  const amounts = split(
    Math.round(cph * hours),
    feedTimes.map(() => 1),
  );
  const feeds: FuelingFeed[] = feedTimes.map((atMin, i) => ({
    atMin,
    carbsG: amounts[i],
  }));
  const totalCarbsG = amounts.reduce((s, g) => s + g, 0);

  if (cph === 0 && hours < 0.75) {
    notes.push("Sessione breve: non serve assumere carboidrati durante.");
  } else if (cph === 0) {
    notes.push(
      "Carboidrati facoltativi: un buon pasto prima basta per questa sessione.",
    );
  }
  if (cph > 60) {
    notes.push(
      "Oltre 60 g/h usa prodotti con glucosio + fruttosio (rapporto circa 1:0,8) e allena l'intestino in allenamento prima di farlo in gara.",
    );
  }
  if (workout.sport === "swimming" && cph > 0) {
    notes.push(
      "In vasca: tieni un gel o una borraccia di maltodestrine a bordo e assumi una porzione ogni 20–30 minuti.",
    );
  }

  // Fluids: ~7 ml/kg/h, more in the heat and at higher intensities.
  let fluid = weightKg * 7 + (hot ? 200 : 0) + (hard ? 100 : 0);
  fluid = Math.min(1000, Math.max(400, roundTo(fluid, 50)));
  if (hours < 0.75) {
    fluid = 0;
    notes.push("Bevi a sete.");
  }

  // Sodium matters for long sessions or in the heat.
  let sodium = 0;
  if (hours >= 1.5 || (hot && hours >= 1)) sodium = hot ? 700 : 400;
  if (sodium > 0 && hot) {
    notes.push(
      "Fa caldo: pesati prima e dopo per stimare quanto sudi e regola i liquidi.",
    );
  }

  const demanding = hours >= 1.5 || (hard && hours >= 1);
  const preCarbsG = demanding
    ? Math.round(weightKg * (hours >= 2.5 ? 2.5 : 1.5))
    : 0;

  // Fast recovery (1–1.2 g/kg/h for 4 h) only when the next session is close.
  const next = opts.nextSessionWithinHours;
  let postCarbsG = 0;
  if (next != null && next < 8 && demanding) {
    postCarbsG = Math.round(weightKg * 1.0 * Math.min(4, Math.max(1, next)));
    notes.push(
      `La prossima sessione è tra meno di 8 ore: recupera subito i carboidrati (circa ${Math.round(weightKg)} g per ora nelle prime ore).`,
    );
  } else if (demanding) {
    postCarbsG = Math.round(weightKg * 1.0);
  }
  const postProteinG = hours >= 0.75 ? Math.round(weightKg * 0.3) : 0;

  return {
    carbsPerHour: cph,
    totalCarbsG,
    fluidMlPerHour: fluid,
    sodiumMgPerHour: sodium,
    feeds,
    preCarbsG,
    postCarbsG,
    postProteinG,
    notes,
  };
}
