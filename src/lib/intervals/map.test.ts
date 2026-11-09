import { describe, expect, it } from "vitest";
import {
  activityToWorkout,
  eventToWorkout,
  intensityFromData,
  normalizeAthleteId,
  type IcuActivity,
  type IcuEvent,
} from "./map";

function event(partial: Partial<IcuEvent>): IcuEvent {
  return {
    id: 501,
    start_date_local: "2026-11-10T00:00:00",
    category: "WORKOUT",
    type: "Ride",
    name: "Sweet spot 3x15",
    moving_time: 5400,
    ...partial,
  };
}

function activity(partial: Partial<IcuActivity>): IcuActivity {
  return {
    id: "i9000001",
    start_date_local: "2026-11-09T17:05:12",
    type: "Ride",
    name: "Uscita serale",
    moving_time: 5520,
    elapsed_time: 6000,
    ...partial,
  };
}

describe("intensityFromData", () => {
  it("maps Intensity Factor to zones", () => {
    expect(intensityFromData({ icuIntensity: 55, seconds: 3600 })).toBe("recovery");
    expect(intensityFromData({ icuIntensity: 70, seconds: 3600 })).toBe("endurance");
    expect(intensityFromData({ icuIntensity: 80, seconds: 3600 })).toBe("tempo");
    expect(intensityFromData({ icuIntensity: 90, seconds: 3600 })).toBe("threshold");
    expect(intensityFromData({ icuIntensity: 101, seconds: 3600 })).toBe("vo2max");
  });

  it("derives it from training load when IF is missing", () => {
    // 2 h at 100 load → IF 0.71
    expect(intensityFromData({ trainingLoad: 100, seconds: 7200 })).toBe("endurance");
    // 1 h at 81 load → IF 0.9
    expect(intensityFromData({ trainingLoad: 81, seconds: 3600 })).toBe("threshold");
  });

  it("returns null without data", () => {
    expect(intensityFromData({ seconds: 3600 })).toBeNull();
  });
});

describe("eventToWorkout", () => {
  it("imports a planned workout, using the usual time when none is set", () => {
    expect(eventToWorkout(event({ icu_intensity: 88, joules: 1_150_000 }), "18:30")).toEqual({
      date: "2026-11-10",
      start_time: "18:30",
      duration_min: 90,
      sport: "cycling",
      intensity: "threshold",
      title: "Sweet spot 3x15",
      energy_kj: 1150,
      completed: false,
      source: "intervals",
      plan_external_id: "e501",
    });
  });

  it("keeps an explicit start time and marks races", () => {
    const race = eventToWorkout(
      event({ category: "RACE_A", start_date_local: "2026-11-15T09:00:00", name: null }),
      "18:00",
    );
    expect(race).toMatchObject({ start_time: "09:00", intensity: "race", title: "Gara" });
  });

  it("skips notes and events without a duration", () => {
    expect(eventToWorkout(event({ category: "NOTE" }), "18:00")).toBeNull();
    expect(eventToWorkout(event({ moving_time: null }), "18:00")).toBeNull();
  });
});

describe("activityToWorkout", () => {
  it("imports a recorded activity with work and pairing", () => {
    expect(
      activityToWorkout(activity({ icu_joules: 1_302_400, icu_intensity: 72.5, paired_event_id: 501 })),
    ).toEqual({
      date: "2026-11-09",
      start_time: "17:05",
      duration_min: 92,
      sport: "cycling",
      intensity: "endurance",
      title: "Uscita serale",
      energy_kj: 1302,
      completed: true,
      source: "intervals",
      external_id: "i9000001",
      pairedPlanId: "e501",
    });
  });

  it("leaves intensity unknown without power or heart rate", () => {
    expect(activityToWorkout(activity({}))?.intensity).toBeNull();
  });

  it("marks races and skips very short activities", () => {
    expect(activityToWorkout(activity({ sub_type: "RACE" }))?.intensity).toBe("race");
    expect(activityToWorkout(activity({ moving_time: 120, elapsed_time: 150 }))).toBeNull();
  });
});

describe("normalizeAthleteId", () => {
  it("accepts the formats shown in intervals.icu settings", () => {
    expect(normalizeAthleteId("i12345")).toBe("i12345");
    expect(normalizeAthleteId(" 12345 ")).toBe("i12345");
    expect(normalizeAthleteId("I12345")).toBe("i12345");
    expect(normalizeAthleteId("abc")).toBeNull();
  });
});
