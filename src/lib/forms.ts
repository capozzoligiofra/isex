import type { z } from "zod";

export type FormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string>;
      message?: string;
      /** Submitted values, to refill the form after React resets it. */
      values?: Record<string, string>;
    }
  | undefined;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    out[key] ??= issue.message;
  }
  return out;
}

/** Only allow same-site relative paths as redirect targets. */
export function safePath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}

export function formObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}
