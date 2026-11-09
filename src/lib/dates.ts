const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const DEFAULT_TIMEZONE = "Europe/Rome";

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

export function todayIso(timeZone: string = DEFAULT_TIMEZONE): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: DEFAULT_TIMEZONE,
    }).format(new Date());
  }
}

function toUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function addDays(iso: string, days: number): string {
  const d = toUtc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  const day = toUtc(iso).getUTCDay(); // 0 = Sunday
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Lunedì 9 novembre" */
export function formatDayLong(iso: string): string {
  return capitalizeFirst(new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(toUtc(iso)));
}

/** "Lun 9" */
export function formatDayShort(iso: string): string {
  return capitalizeFirst(new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(toUtc(iso)));
}

export function formatRange(fromIso: string, toIso: string): string {
  const fmt = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${fmt.format(toUtc(fromIso))} – ${fmt.format(toUtc(toIso))}`;
}
