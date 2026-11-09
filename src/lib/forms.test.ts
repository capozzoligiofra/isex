import { describe, expect, it } from "vitest";
import { safePath } from "./forms";

describe("safePath", () => {
  it("accepts relative paths", () => {
    expect(safePath("/oggi?data=2026-11-09", "/")).toBe("/oggi?data=2026-11-09");
  });

  it("rejects open redirects", () => {
    expect(safePath("https://evil.example", "/oggi")).toBe("/oggi");
    expect(safePath("//evil.example", "/oggi")).toBe("/oggi");
    expect(safePath("/\\evil.example", "/oggi")).toBe("/oggi");
    expect(safePath(undefined, "/oggi")).toBe("/oggi");
  });
});
