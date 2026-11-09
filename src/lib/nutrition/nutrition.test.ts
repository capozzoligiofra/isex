import { describe, expect, it } from "vitest";
import {
  ageOn,
  bmr,
  carbsPerHour,
  carbsPerKg,
  computeDayPlan,
  fuelingPlan,
  planMeals,
  workoutKcal,
  type AthleteProfile,
  type MealSlot,
  type Workout,
} from ".";
import { split } from "./meals";

const MEALS: MealSlot[] = [
  { id: "colazione", name: "Colazione", time: "07:30", kind: "main" },
  { id: "pranzo", name: "Pranzo", time: "12:30", kind: "main" },
  { id: "spuntino", name: "Spuntino", time: "16:30", kind: "snack" },
  { id: "cena", name: "Cena", time: "20:00", kind: "main" },
];

const PROFILE: AthleteProfile = {
  sex: "male",
  birthDate: "1996-05-20",
  heightCm: 178,
  weightKg: 70,
  goal: "maintain",
  activityLevel: "light",
  meals: MEALS,
};

function workout(partial: Partial<Workout>): Workout {
  return {
    id: "w1",
    date: "2026-11-09",
    startTime: "09:00",
    durationMin: 60,
    sport: "cycling",
    intensity: "endurance",
    ...partial,
  };
}

const codes = (plan: { code: string }[]) => plan.map((m) => m.code);

describe("energy", () => {
  it("computes Mifflin-St Jeor BMR", () => {
    expect(bmr("male", 70, 178, 30)).toBeCloseTo(1667.5);
    expect(bmr("female", 60, 165, 30)).toBeCloseTo(1320.25);
  });

  it("computes age taking the birthday into account", () => {
    expect(ageOn("1996-05-20", "2026-05-19")).toBe(29);
    expect(ageOn("1996-05-20", "2026-05-20")).toBe(30);
  });

  it("prefers power-meter work over METs", () => {
    const w = workout({ durationMin: 120, energyKj: 1000 });
    expect(workoutKcal(w, 70)).toBeCloseTo(1040 - 140);
  });

  it("charges more energy for harder sessions", () => {
    const easy = workoutKcal(workout({ intensity: "recovery" }), 70);
    const hard = workoutKcal(workout({ intensity: "threshold" }), 70);
    expect(hard).toBeGreaterThan(easy);
  });
});

describe("daily carbohydrates", () => {
  it("follows consensus ranges", () => {
    expect(carbsPerKg(0, 0, "maintain")).toBe(3);
    expect(carbsPerKg(1, 0, "maintain")).toBe(5.5);
    expect(carbsPerKg(2.5, 0, "maintain")).toBeCloseTo(7.75);
    expect(carbsPerKg(20, 0, "maintain")).toBe(12);
  });

  it("raises carbs the day before a big session", () => {
    expect(carbsPerKg(0, 3, "maintain")).toBeGreaterThan(
      carbsPerKg(0, 0, "maintain"),
    );
  });

  it("only trims carbs on light days when losing weight", () => {
    expect(carbsPerKg(0, 0, "lose")).toBe(2.5);
    expect(carbsPerKg(2, 0, "lose")).toBe(carbsPerKg(2, 0, "maintain"));
  });
});

describe("in-workout fueling", () => {
  it("skips carbs for short sessions", () => {
    const plan = fuelingPlan(workout({ durationMin: 30 }), 70);
    expect(plan.carbsPerHour).toBe(0);
    expect(plan.feeds).toHaveLength(0);
    expect(plan.fluidMlPerHour).toBe(0);
  });

  it("scales with duration and intensity", () => {
    expect(carbsPerHour(workout({ durationMin: 90 }))).toBe(40);
    expect(carbsPerHour(workout({ durationMin: 90, intensity: "threshold" }))).toBe(60);
    expect(carbsPerHour(workout({ durationMin: 240, intensity: "race" }))).toBe(90);
    expect(carbsPerHour(workout({ sport: "strength" }))).toBe(0);
  });

  it("builds a feeding schedule every 20 minutes", () => {
    const plan = fuelingPlan(workout({ durationMin: 180, intensity: "race" }), 70);
    expect(plan.feeds).toHaveLength(8);
    expect(plan.feeds[0].atMin).toBe(20);
    expect(plan.feeds.at(-1)!.atMin).toBe(160);
    expect(plan.totalCarbsG).toBe(270);
    expect(plan.sodiumMgPerHour).toBeGreaterThan(0);
  });

  it("asks for more fluids and sodium in the heat", () => {
    const cool = fuelingPlan(workout({ durationMin: 120 }), 70);
    const hot = fuelingPlan(workout({ durationMin: 120, hotConditions: true }), 70);
    expect(hot.fluidMlPerHour).toBeGreaterThan(cool.fluidMlPerHour);
    expect(hot.sodiumMgPerHour).toBeGreaterThan(cool.sodiumMgPerHour);
  });
});

describe("meal carb coding", () => {
  const targets = { kcal: 2500, carbsG: 300, proteinG: 112, fatG: 80, carbsPerKg: 4.3 };

  it("marks every meal low on a rest day", () => {
    const plan = planMeals({ meals: MEALS, workouts: [], tomorrowWorkouts: [], targets, mealCarbsG: 300 });
    expect(codes(plan)).toEqual(["low", "low", "low", "low"]);
  });

  it("fuels before and after a long morning ride", () => {
    const plan = planMeals({
      meals: MEALS,
      workouts: [workout({ startTime: "09:00", durationMin: 180 })],
      tomorrowWorkouts: [],
      targets,
      mealCarbsG: 300,
    });
    const [breakfast, lunch, snack, dinner] = plan;
    expect(breakfast.code).toBe("high");
    expect(lunch.code).toBe("high");
    expect(snack.code).toBe("medium");
    expect(dinner.code).toBe("medium");
    expect(breakfast.carbsG).toBeGreaterThan(dinner.carbsG);
  });

  it("keeps meals low around an easy recovery session", () => {
    const plan = planMeals({
      meals: MEALS,
      workouts: [workout({ startTime: "18:00", durationMin: 45, intensity: "recovery" })],
      tomorrowWorkouts: [],
      targets,
      mealCarbsG: 300,
    });
    expect(codes(plan)).toEqual(["low", "low", "low", "low"]);
  });

  it("loads dinner before a big session the next morning", () => {
    const plan = planMeals({
      meals: MEALS,
      workouts: [],
      tomorrowWorkouts: [workout({ startTime: "08:00", durationMin: 240 })],
      targets,
      mealCarbsG: 300,
    });
    expect(plan[3].code).toBe("high");
    expect(plan[3].reasons[0]).toContain("Carica per domani");
  });

  it("keeps fat low in the meal right before a session", () => {
    const plan = planMeals({
      meals: MEALS,
      workouts: [workout({ startTime: "17:30", durationMin: 90, intensity: "threshold" })],
      tomorrowWorkouts: [],
      targets,
      mealCarbsG: 300,
    });
    const snack = plan[2];
    expect(snack.code).toBe("high");
    expect(snack.fatG).toBeLessThan(plan[0].fatG / 2);
  });
});

describe("split", () => {
  it("keeps the exact total", () => {
    expect(split(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(split(257, [3.5, 1, 0.5, 2]).reduce((a, b) => a + b)).toBe(257);
    expect(split(50, [0, 0])).toEqual([0, 0]);
  });
});

describe("computeDayPlan", () => {
  it("gives a training day more carbs and energy than a rest day", () => {
    const rest = computeDayPlan({ profile: PROFILE, date: "2026-11-09", workouts: [] });
    const ride = computeDayPlan({
      profile: PROFILE,
      date: "2026-11-09",
      workouts: [workout({ durationMin: 180, intensity: "tempo" })],
    });
    expect(ride.targets.carbsG).toBeGreaterThan(rest.targets.carbsG);
    expect(ride.targets.kcal).toBeGreaterThan(rest.targets.kcal);
    expect(rest.targets.carbsPerKg).toBeGreaterThanOrEqual(3);
  });

  it("is internally consistent", () => {
    const plan = computeDayPlan({
      profile: PROFILE,
      date: "2026-11-09",
      workouts: [
        workout({ id: "a", startTime: "07:00", durationMin: 60, intensity: "recovery" }),
        workout({ id: "b", startTime: "17:00", durationMin: 120, intensity: "threshold" }),
      ],
      tomorrowWorkouts: [workout({ id: "c", startTime: "08:00", durationMin: 240 })],
    });
    const { targets } = plan;
    const sum = (k: "carbsG" | "proteinG" | "fatG") =>
      plan.meals.reduce((s, m) => s + m[k], 0);

    expect(sum("carbsG") + plan.fuelingCarbsG).toBe(targets.carbsG);
    expect(sum("proteinG")).toBe(targets.proteinG);
    expect(sum("fatG")).toBe(targets.fatG);
    expect(targets.kcal).toBe(targets.carbsG * 4 + targets.proteinG * 4 + targets.fatG * 9);
    expect(plan.workouts.map((w) => w.workout.id)).toEqual(["a", "b"]);
    expect(plan.workouts[1].fueling.carbsPerHour).toBe(60);
  });

  it("never leaves meals without carbs on very long days", () => {
    const plan = computeDayPlan({
      profile: PROFILE,
      date: "2026-11-09",
      workouts: [workout({ startTime: "06:00", durationMin: 600, intensity: "race" })],
    });
    const mealCarbs = plan.meals.reduce((s, m) => s + m.carbsG, 0);
    expect(mealCarbs).toBeGreaterThanOrEqual(2 * PROFILE.weightKg - 1);
  });
});
