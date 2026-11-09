import Link from "next/link";
import { ChevronRight, Droplets, Plus, Trash2 } from "lucide-react";
import { deleteFoodEntry } from "@/app/actions/food";
import type { FoodEntry } from "@/lib/db";
import { fmt } from "@/lib/format";
import { INTENSITIES, SPORTS, formatDuration } from "@/lib/labels";
import type { MealPlan, WorkoutPlan } from "@/lib/nutrition";
import { SportIcon } from "./sport-icon";
import { CarbBadge, Card, cx } from "./ui";

export function sumEntries(entries: FoodEntry[]) {
  return entries.reduce(
    (t, e) => ({
      kcal: t.kcal + e.kcal,
      carbs: t.carbs + e.carbsG,
      protein: t.protein + e.proteinG,
      fat: t.fat + e.fatG,
    }),
    { kcal: 0, carbs: 0, protein: 0, fat: 0 },
  );
}

function MacroCell({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-2 py-1.5 text-center">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="tabular text-sm">
        <span className={cx("font-semibold", value > 0 && color)}>{fmt(value)}</span>
        <span className="text-muted">/{fmt(target)} g</span>
      </div>
    </div>
  );
}

function EntryList({ entries }: { entries: FoodEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="mt-3 divide-y divide-border border-t border-border">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center gap-2 py-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{e.name}</div>
            <div className="tabular truncate text-xs text-muted">
              {e.brand ? `${e.brand} · ` : ""}
              {fmt(e.grams)} g · {fmt(e.kcal)} kcal · C {fmt(e.carbsG)} · P {fmt(e.proteinG)} · G {fmt(e.fatG)}
            </div>
          </div>
          <form action={deleteFoodEntry}>
            <input type="hidden" name="id" value={e.id} />
            <button
              type="submit"
              className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-danger"
              aria-label={`Elimina ${e.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

function AddFoodLink({ date, slot, label = "Aggiungi alimento" }: { date: string; slot: string; label?: string }) {
  return (
    <Link
      href={`/diario/aggiungi?data=${date}&pasto=${slot}`}
      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
    >
      <Plus className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}

export function MealCard({ meal, entries, date }: { meal: MealPlan; entries: FoodEntry[]; date: string }) {
  const eaten = sumEntries(entries);
  return (
    <Card id={`pasto-${meal.slot.id}`} className="scroll-mt-4">
      <div className="flex items-start gap-3">
        <span className="tabular pt-0.5 text-sm text-muted">{meal.slot.time}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{meal.slot.name}</h3>
            <CarbBadge code={meal.code} compact />
          </div>
          <p className="mt-0.5 text-xs text-muted">{meal.reasons.join(" · ")}</p>
        </div>
        <div className="tabular text-right text-sm">
          <div className="font-semibold">{fmt(eaten.kcal)}</div>
          <div className="text-xs text-muted">/ {fmt(meal.kcal)} kcal</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MacroCell label="Carboidrati" value={eaten.carbs} target={meal.carbsG} color="text-macro-carbs" />
        <MacroCell label="Proteine" value={eaten.protein} target={meal.proteinG} color="text-macro-protein" />
        <MacroCell label="Grassi" value={eaten.fat} target={meal.fatG} color="text-macro-fat" />
      </div>
      <EntryList entries={entries} />
      <AddFoodLink date={date} slot={meal.slot.id} />
    </Card>
  );
}

export function WorkoutCard({
  plan,
  completed,
  fromStrava,
}: {
  plan: WorkoutPlan;
  completed?: boolean;
  fromStrava?: boolean;
}) {
  const { workout: w, fueling: f } = plan;
  return (
    <Link href={`/allenamenti/${w.id}`} className="block">
      <Card className="border-primary/30 bg-primary/5 transition hover:border-primary/60">
        <div className="flex items-start gap-3">
          <span className="tabular pt-0.5 text-sm text-muted">{w.startTime}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 font-semibold">
              <SportIcon sport={w.sport} className="h-4 w-4 text-primary" />
              <span className="truncate">{w.title || SPORTS[w.sport]}</span>
            </div>
            <p className="text-xs text-muted">
              {formatDuration(w.durationMin)} · {INTENSITIES[w.intensity].label} · ~{fmt(plan.kcal)} kcal
              {completed ? " · completato" : ""}
              {fromStrava ? " · da Strava" : ""}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-surface px-2.5 py-1 font-medium">
            {f.carbsPerHour > 0
              ? `Carbo ${f.carbsPerHour} g/h · ${f.totalCarbsG} g totali`
              : "Nessun carbo necessario durante"}
          </span>
          {f.fluidMlPerHour > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 font-medium">
              <Droplets className="h-3.5 w-3.5" aria-hidden />
              {f.fluidMlPerHour} ml/h
            </span>
          )}
          {f.sodiumMgPerHour > 0 && (
            <span className="rounded-full bg-surface px-2.5 py-1 font-medium">
              Sodio {f.sodiumMgPerHour} mg/h
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function FuelingLogCard({
  targetCarbs,
  entries,
  date,
}: {
  targetCarbs: number;
  entries: FoodEntry[];
  date: string;
}) {
  const eaten = sumEntries(entries);
  return (
    <Card id="pasto-allenamento" className="scroll-mt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Durante l&apos;allenamento</h3>
          <p className="text-xs text-muted">Gel, barrette, bevande e altro preso durante le sessioni.</p>
        </div>
        <div className="tabular text-right text-sm">
          <div className="font-semibold">{fmt(eaten.carbs)} g</div>
          <div className="text-xs text-muted">/ {fmt(targetCarbs)} g carbo</div>
        </div>
      </div>
      <EntryList entries={entries} />
      <AddFoodLink date={date} slot="allenamento" label="Registra rifornimento" />
    </Card>
  );
}
