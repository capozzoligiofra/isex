import { describe, expect, it } from "vitest";
import { addDays, formatDayLong, formatDayShort, isIsoDate, startOfWeek } from "./dates";

describe("dates", () => {
  it("validates ISO dates", () => {
    expect(isIsoDate("2026-11-09")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("09/11/2026")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("finds the Monday of the week", () => {
    expect(startOfWeek("2026-11-09")).toBe("2026-11-09"); // Monday
    expect(startOfWeek("2026-11-15")).toBe("2026-11-09"); // Sunday
    expect(startOfWeek("2026-11-11")).toBe("2026-11-09");
  });

  it("formats Italian day names with only the first letter capitalised", () => {
    expect(formatDayLong("2026-11-09")).toBe("Lunedì 9 novembre");
    expect(formatDayShort("2026-11-09")).toBe("Lun 9");
  });
});
