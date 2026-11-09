import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CARB_CODES } from "@/lib/labels";
import type { CarbCode } from "@/lib/nutrition";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const buttonClass = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary-hover disabled:opacity-60",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-2 disabled:opacity-60",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-text",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-surface-2",
};

export const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function Card({
  className,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={cx("rounded-2xl border border-border bg-surface p-4", className)}
      {...props}
    />
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

const CARB_STYLE: Record<CarbCode, string> = {
  low: "bg-carb-low-bg text-carb-low",
  medium: "bg-carb-medium-bg text-carb-medium",
  high: "bg-carb-high-bg text-carb-high",
};

const CARB_DOTS: Record<CarbCode, number> = { low: 1, medium: 2, high: 3 };

export function CarbBadge({ code, compact }: { code: CarbCode; compact?: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        CARB_STYLE[code],
      )}
      title={CARB_CODES[code].label}
    >
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cx(
              "h-1.5 w-1.5 rounded-full bg-current",
              i > CARB_DOTS[code] && "opacity-25",
            )}
          />
        ))}
      </span>
      {compact ? CARB_CODES[code].short : CARB_CODES[code].label}
    </span>
  );
}

export function MacroBar({
  label,
  value,
  target,
  colorClass,
  unit = "g",
}: {
  label: string;
  value: number;
  target: number;
  colorClass: string;
  unit?: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = target > 0 && value > target * 1.1;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular text-muted">
          <span className={cx("font-semibold text-text", over && "text-danger")}>
            {Math.round(value)}
          </span>{" "}
          / {target} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className={cx("h-full rounded-full transition-all", colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function EnergyRing({ value, target }: { value: number; target: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const remaining = Math.round(target - value);
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" strokeWidth="10" className="stroke-surface-2" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-primary transition-all"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="tabular text-2xl font-bold leading-none">{Math.abs(remaining)}</span>
        <span className="mt-1 text-[11px] leading-tight text-muted">
          kcal
          <br />
          {remaining >= 0 ? "rimanenti" : "in più"}
        </span>
      </div>
    </div>
  );
}

/** Button-styled link. Doesn't prefetch: every target page is rendered on demand. */
export function LinkButton({
  variant = "primary",
  className,
  prefetch = false,
  ...props
}: ComponentProps<typeof Link> & { variant?: keyof typeof buttonClass }) {
  return <Link prefetch={prefetch} className={cx(buttonClass[variant], className)} {...props} />;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="tabular text-base font-semibold">{value}</div>
      {hint && <div className="text-[11px] text-muted">{hint}</div>}
    </div>
  );
}
