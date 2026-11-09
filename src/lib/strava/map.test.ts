import { describe, expect, it } from "vitest";
import {
  estimateIntensity,
  mapSport,
  matchPlanned,
  toWorkout,
  type PlannedCandidate,
  type StravaActivity,
} from "./map";

function activity(partial: Partial<StravaActivity>): StravaActivity {
  return {
    id: 1001,
    name: "Giro del mattino",
    sport_type: "Ride",
    start_date_local: "2026-11-09T09:30:00Z",
    moving_time: 7200,
    elapsed_time: 7800,
    ...partial,
  };
}

describe("mapSport", () => {
  it("maps Strava sport types", () => {
    expect(mapSport({ sport_type: "GravelRide" })).toBe("cycling");
    expect(mapSport({ sport_type: "VirtualRide" })).toBe("cycling");
    expect(mapSport({ sport_type: "TrailRun" })).toBe("running");
    expect(mapSport({ sport_type: "Swim" })).toBe("swimming");
    expect(mapSport({ sport_type: "WeightTraining" })).toBe("strength");
    expect(mapSport({ sport_type: "Hike" })).toBe("other");
    expect(mapSport({ type: "Run" })).toBe("running");
  });
});

describe("estimateIntensity", () => {
  it("uses Strava's race and workout flags", () => {
    expect(estimateIntensity(activity({ workout_type: 11 }))).toBe("race");
    expect(estimateIntensity(activity({ workout_type: 1, sport_type: "Run" }))).toBe("race");
    expect(estimateIntensity(activity({ workout_type: 12 }))).toBe("threshold");
  });

  it("falls back to Relative Effort per hour", () => {
    expect(estimateIntensity(activity({ suffer_score: 260 }))).toBe("threshold"); // 130/h
    expect(estimateIntensity(activity({ suffer_score: 180 }))).toBe("tempo"); // 90/h
    expect(estimateIntensity(activity({ suffer_score: 100 }))).toBe("endurance"); // 50/h
    expect(estimateIntensity(activity({ suffer_score: 30 }))).toBe("recovery"); // 15/h
    expect(estimateIntensity(activity({}))).toBe("endurance");
  });
});

describe("toWorkout", () => {
  it("converts an activity using its local start time", () => {
    expect(toWorkout(activity({ kilojoules: 1534.6 }))).toEqual({
      date: "2026-11-09",
      start_time: "09:30",
      duration_min: 120,
      sport: "cycling",
      intensity: "endurance",
      title: "Giro del mattino",
      energy_kj: 1535,
      completed: true,
      source: "strava",
      external_id: "1001",
    });
  });

  it("skips activities shorter than 5 minutes", () => {
    expect(toWorkout(activity({ moving_time: 200, elapsed_time: 240 }))).toBeNull();
  });

  it("uses elapsed time when moving time is missing", () => {
    expect(toWorkout(activity({ moving_time: 0, elapsed_time: 1800 }))?.duration_min).toBe(30);
  });
});

describe("matchPlanned", () => {
  const planned: PlannedCandidate[] = [
    { id: "a", date: "2026-11-09", startTime: "08:00", sport: "cycling", completed: false, source: "manual" },
    { id: "b", date: "2026-11-09", startTime: "10:00", sport: "cycling", completed: false, source: "manual" },
    { id: "c", date: "2026-11-09", startTime: "09:30", sport: "running", completed: false, source: "manual" },
    { id: "d", date: "2026-11-09", startTime: "09:30", sport: "cycling", completed: true, source: "manual" },
  ];
  const ride = { date: "2026-11-09", start_time: "09:30", sport: "cycling" as const };

  it("picks the closest open plan of the same sport and day", () => {
    expect(matchPlanned(ride, planned)).toBe("b");
  });

  it("ignores plans already matched in this sync", () => {
    expect(matchPlanned(ride, planned, new Set(["b"]))).toBe("a");
  });

  it("does not match across days, sports or far-apart times", () => {
    expect(matchPlanned({ ...ride, date: "2026-11-10" }, planned)).toBeNull();
    expect(matchPlanned({ ...ride, sport: "swimming" }, planned)).toBeNull();
    expect(matchPlanned({ ...ride, start_time: "18:00" }, planned)).toBeNull();
  });
});
