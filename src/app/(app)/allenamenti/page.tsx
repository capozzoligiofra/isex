import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DateNav } from "@/components/date-nav";
import { SportIcon } from "@/components/sport-icon";
import { CarbBadge, Card, LinkButton, PageHeader, cx } from "@/components/ui";
import { getToday, getWorkouts, requireProfile } from "@/lib/data";
import { addDays, formatDayShort, formatRange, isIsoDate, startOfWeek } from "@/lib/dates";
import { fmt } from "@/lib/format";
import { INTENSITIES, SOURCES, SPORTS, dayLoadLabel, formatDuration } from "@/lib/labels";
import { computeDayPlan } from "@/lib/nutrition";
import { scheduleIntegrationSync } from "@/lib/integrations/auto-sync";

export const metadata: Metadata = { title: "Allenamenti" };

export default async function WorkoutsPage({ searchParams }: PageProps<"/allenamenti">) {
  const today = await getToday();
  const { settimana } = await searchParams;
  const monday = startOfWeek(isIsoDate(settimana) ? settimana : today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  // One extra day so Sunday knows about Monday's sessions.
  const [profile, workouts] = await Promise.all([
    requireProfile(),
    getWorkouts(monday, addDays(monday, 7)),
    scheduleIntegrationSync(),
  ]);

  const totalMin = workouts
    .filter((w) => w.date <= days[6])
    .reduce((s, w) => s + w.durationMin, 0);

  return (
    <>
      <PageHeader
        title="Allenamenti"
        subtitle={`Totale settimana: ${formatDuration(totalMin)}`}
        action={
          <LinkButton href={`/allenamenti/nuovo?data=${days.includes(today) ? today : monday}`}>
            <Plus className="h-4 w-4" aria-hidden />
            Nuovo
          </LinkButton>
        }
      />
      <DateNav
        label={formatRange(days[0], days[6])}
        prevHref={`/allenamenti?settimana=${addDays(monday, -7)}`}
        nextHref={`/allenamenti?settimana=${addDays(monday, 7)}`}
        todayHref={days.includes(today) ? undefined : "/allenamenti"}
      />

      <div className="space-y-3">
        {days.map((day) => {
          const dayWorkouts = workouts.filter((w) => w.date === day);
          const plan = computeDayPlan({
            profile,
            date: day,
            workouts: dayWorkouts,
            tomorrowWorkouts: workouts.filter((w) => w.date === addDays(day, 1)),
          });
          return (
            <Card key={day} className={cx(day === today && "border-primary/60")}>
              <div className="flex items-start justify-between gap-3">
                <Link prefetch={false} href={`/oggi?data=${day}`} className="min-w-0">
                  <div className="font-semibold">
                    {formatDayShort(day)}
                    {day === today && <span className="ml-2 text-xs font-medium text-primary">oggi</span>}
                  </div>
                  <div className="text-xs text-muted">
                    {dayLoadLabel(plan.load)} · {fmt(plan.targets.carbsPerKg, 1)} g/kg carbo · {fmt(plan.targets.kcal)} kcal
                  </div>
                </Link>
                <Link prefetch={false}
                  href={`/allenamenti/nuovo?data=${day}`}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-primary"
                  aria-label={`Aggiungi allenamento ${formatDayShort(day)}`}
                >
                  <Plus className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Carboidrati per pasto">
                {plan.meals.map((m) => (
                  <span key={m.slot.id} className="flex items-center gap-1 text-[11px] text-muted">
                    {m.slot.name}
                    <CarbBadge code={m.code} compact />
                  </span>
                ))}
              </div>

              {dayWorkouts.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {dayWorkouts.map((w) => (
                    <li key={w.id}>
                      <Link prefetch={false}
                        href={`/allenamenti/${w.id}`}
                        className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2 transition hover:bg-primary/10"
                      >
                        <SportIcon sport={w.sport} className="h-4 w-4 text-primary" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold">{w.title || SPORTS[w.sport]}</div>
                          <div className="text-xs text-muted">
                            {w.startTime} · {formatDuration(w.durationMin)} · {INTENSITIES[w.intensity].label}
                            {w.source !== "manual" && ` · ${SOURCES[w.source].label}`}
                          </div>
                        </div>
                        {w.completed && <span className="text-xs font-medium text-primary">✓</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
