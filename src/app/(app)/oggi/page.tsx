import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DateNav } from "@/components/date-nav";
import { FuelingLogCard, MealCard, WorkoutCard, sumEntries } from "@/components/day-cards";
import { Card, EnergyRing, MacroBar, PageHeader } from "@/components/ui";
import { getFoodEntries, getToday, getWorkouts, requireProfile } from "@/lib/data";
import { addDays, formatDayLong, isIsoDate } from "@/lib/dates";
import { fmt } from "@/lib/format";
import { dayLoadLabel } from "@/lib/labels";
import { computeDayPlan, toMinutes } from "@/lib/nutrition";
import { scheduleIntegrationSync } from "@/lib/integrations/auto-sync";

export const metadata: Metadata = { title: "Oggi" };

const FUELING_SLOT = "allenamento";

export default async function TodayPage({ searchParams }: PageProps<"/oggi">) {
  const [today, { data }] = await Promise.all([getToday(), searchParams]);
  const date = isIsoDate(data) ? data : today;
  const tomorrow = addDays(date, 1);

  // One round trip to the database: these queries run side by side.
  const [profile, workouts, entries] = await Promise.all([
    requireProfile(),
    getWorkouts(date, tomorrow),
    getFoodEntries(date),
    scheduleIntegrationSync(),
  ]);
  const todays = workouts.filter((w) => w.date === date);
  const plan = computeDayPlan({
    profile,
    date,
    workouts: todays,
    tomorrowWorkouts: workouts.filter((w) => w.date === tomorrow),
  });

  const eaten = sumEntries(entries);
  const { targets, energy } = plan;
  const slotIds = new Set(plan.meals.map((m) => m.slot.id));
  const fuelingEntries = entries.filter((e) => e.mealSlot === FUELING_SLOT);
  const orphanEntries = entries.filter(
    (e) => e.mealSlot !== FUELING_SLOT && !slotIds.has(e.mealSlot),
  );
  const records = new Map(todays.map((w) => [w.id, w]));

  type Item =
    | { kind: "meal"; at: number; meal: (typeof plan.meals)[number] }
    | { kind: "workout"; at: number; workout: (typeof plan.workouts)[number] };
  const timeline: Item[] = [
    ...plan.meals.map((meal) => ({ kind: "meal" as const, at: toMinutes(meal.slot.time), meal })),
    ...plan.workouts.map((workout) => ({
      kind: "workout" as const,
      // Workouts sort before a meal at the same minute.
      at: toMinutes(workout.workout.startTime) - 0.5,
      workout,
    })),
  ].sort((a, b) => a.at - b.at);
  const showFuelingLog = plan.fuelingCarbsG > 0 || fuelingEntries.length > 0;
  const lastWorkoutIndex = timeline.findLastIndex((i) => i.kind === "workout");

  const name = profile.displayName?.split(" ")[0];

  return (
    <>
      <PageHeader
        title={date === today && name ? `Ciao ${name}` : "Il tuo piano"}
        subtitle={dayLoadLabel(plan.load)}
      />
      <DateNav
        label={`${formatDayLong(date)}${date === today ? " · oggi" : ""}`}
        prevHref={`/oggi?data=${addDays(date, -1)}`}
        nextHref={`/oggi?data=${tomorrow}`}
        todayHref={date === today ? undefined : "/oggi"}
      />

      <Card className="mb-4">
        <div className="flex items-center gap-4">
          <EnergyRing value={eaten.kcal} target={targets.kcal} />
          <div className="min-w-0 flex-1 space-y-3">
            <MacroBar label="Carboidrati" value={eaten.carbs} target={targets.carbsG} colorClass="bg-macro-carbs" />
            <MacroBar label="Proteine" value={eaten.protein} target={targets.proteinG} colorClass="bg-macro-protein" />
            <MacroBar label="Grassi" value={eaten.fat} target={targets.fatG} colorClass="bg-macro-fat" />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Obiettivo {fmt(targets.kcal)} kcal · carboidrati {fmt(targets.carbsPerKg, 1)} g/kg
          {plan.fuelingCarbsG > 0 && ` (di cui ${plan.fuelingCarbsG} g durante l'allenamento)`}
        </p>
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-primary">
            Come è calcolato
          </summary>
          <dl className="tabular mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <dt className="text-muted">Metabolismo basale</dt>
            <dd className="text-right">{fmt(energy.bmr)} kcal</dd>
            <dt className="text-muted">Vita quotidiana</dt>
            <dd className="text-right">+{fmt(energy.baseline - energy.bmr)} kcal</dd>
            <dt className="text-muted">Allenamenti</dt>
            <dd className="text-right">+{fmt(energy.exercise)} kcal</dd>
            {energy.goalAdjustment !== 0 && (
              <>
                <dt className="text-muted">Obiettivo di peso</dt>
                <dd className="text-right">
                  {energy.goalAdjustment > 0 ? "+" : ""}
                  {fmt(energy.goalAdjustment)} kcal
                </dd>
              </>
            )}
            <dt className="font-semibold">Fabbisogno stimato</dt>
            <dd className="text-right font-semibold">{fmt(energy.total)} kcal</dd>
          </dl>
          <p className="mt-2 text-xs text-muted">
            I carboidrati seguono il carico di allenamento di oggi e di domani, le proteine sono
            fisse per kg di peso e i grassi completano l&apos;energia. L&apos;obiettivo può
            discostarsi dal fabbisogno per garantire carboidrati e grassi minimi.
          </p>
        </details>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">La giornata</h2>
        <Link prefetch={false}
          href={`/allenamenti/nuovo?data=${date}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Allenamento
        </Link>
      </div>

      <div className="space-y-3">
        {timeline.map((item, index) => (
          <div key={item.kind === "meal" ? item.meal.slot.id : item.workout.workout.id} className="space-y-3">
            {item.kind === "meal" ? (
              <MealCard
                meal={item.meal}
                entries={entries.filter((e) => e.mealSlot === item.meal.slot.id)}
                date={date}
              />
            ) : (
              <WorkoutCard
                plan={item.workout}
                completed={records.get(item.workout.workout.id)?.completed}
                source={records.get(item.workout.workout.id)?.source}
              />
            )}
            {showFuelingLog && index === lastWorkoutIndex && (
              <FuelingLogCard targetCarbs={plan.fuelingCarbsG} entries={fuelingEntries} date={date} />
            )}
          </div>
        ))}
        {showFuelingLog && lastWorkoutIndex === -1 && (
          <FuelingLogCard targetCarbs={plan.fuelingCarbsG} entries={fuelingEntries} date={date} />
        )}
        {orphanEntries.length > 0 && (
          <Card>
            <h3 className="font-semibold">Altri alimenti</h3>
            <p className="text-xs text-muted">
              Registrati in pasti che non sono più nel tuo profilo.
            </p>
            <ul className="mt-2 text-sm">
              {orphanEntries.map((e) => (
                <li key={e.id} className="tabular flex justify-between py-1">
                  <span className="truncate">{e.name}</span>
                  <span className="text-muted">{fmt(e.kcal)} kcal</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
