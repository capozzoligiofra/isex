"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { saveProfile } from "@/app/actions/profile";
import type { ProfileRow } from "@/lib/db";
import { ACTIVITY_LEVELS, GOALS, SPORTS } from "@/lib/labels";
import type { ActivityLevel, Goal, MealSlot, Sport } from "@/lib/nutrition";
import { Field, FormMessage, SubmitButton } from "./form";
import { buttonClass, cx, inputClass } from "./ui";

const DEFAULT_MEALS: MealSlot[] = [
  { id: "colazione", name: "Colazione", time: "07:30", kind: "main" },
  { id: "pranzo", name: "Pranzo", time: "12:30", kind: "main" },
  { id: "spuntino", name: "Spuntino", time: "16:30", kind: "snack" },
  { id: "cena", name: "Cena", time: "20:00", kind: "main" },
];

function newMealId() {
  return `pasto-${Math.random().toString(36).slice(2, 8)}`;
}

function ChoiceGroup<T extends string>({
  name,
  options,
  value,
  error,
  legend,
}: {
  name: string;
  options: Record<T, { label: string; hint: string }>;
  value: T;
  error?: string;
  legend: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {(Object.keys(options) as T[]).map((key) => (
          <label
            key={key}
            className="cursor-pointer rounded-xl border border-border bg-surface p-3 text-sm transition has-[:checked]:border-primary has-[:checked]:bg-primary/10"
          >
            <input type="radio" name={name} value={key} defaultChecked={value === key} className="sr-only" />
            <span className="block font-semibold">{options[key].label}</span>
            <span className="block text-xs text-muted">{options[key].hint}</span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </fieldset>
  );
}

export function ProfileForm({
  profile,
  redirectTo,
  submitLabel = "Salva profilo",
}: {
  profile: ProfileRow | null;
  redirectTo?: string;
  submitLabel?: string;
}) {
  const [state, action] = useActionState(saveProfile, undefined);
  const [meals, setMeals] = useState<MealSlot[]>(
    profile?.meals?.length ? profile.meals : DEFAULT_MEALS,
  );
  const err = state?.fieldErrors ?? {};
  // After a failed submit React resets the form: refill it with what was sent.
  const v = (key: keyof ProfileRow) =>
    state?.values?.[key] ?? (profile?.[key] as string | number | null | undefined) ?? "";

  const updateMeal = (id: string, patch: Partial<MealSlot>) =>
    setMeals((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  return (
    <form action={action} className="space-y-6">
      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}
      <input type="hidden" name="meals" value={JSON.stringify(meals)} />

      <section className="space-y-4">
        <h2 className="font-semibold">Dati personali</h2>
        <Field label="Nome" htmlFor="display_name" error={err.display_name}>
          <input
            id="display_name"
            name="display_name"
            defaultValue={v("display_name")}
            maxLength={60}
            className={inputClass}
          />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Sesso</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["female", "Donna"],
                ["male", "Uomo"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="cursor-pointer rounded-xl border border-border bg-surface p-3 text-center text-sm font-semibold transition has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input
                  type="radio"
                  name="sex"
                  value={value}
                  defaultChecked={v("sex") === value}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">Serve per stimare il metabolismo basale.</p>
          {err.sex && <p className="mt-1 text-sm text-danger">{err.sex}</p>}
        </fieldset>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Nascita" htmlFor="birth_date" error={err.birth_date} className="col-span-3 sm:col-span-1">
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              required
              defaultValue={v("birth_date")}
              className={inputClass}
            />
          </Field>
          <Field label="Altezza (cm)" htmlFor="height_cm" error={err.height_cm} className="col-span-3 sm:col-span-1">
            <input
              id="height_cm"
              name="height_cm"
              inputMode="decimal"
              required
              defaultValue={v("height_cm")}
              className={inputClass}
            />
          </Field>
          <Field label="Peso (kg)" htmlFor="weight_kg" error={err.weight_kg} className="col-span-3 sm:col-span-1">
            <input
              id="weight_kg"
              name="weight_kg"
              inputMode="decimal"
              required
              defaultValue={v("weight_kg")}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold">Allenamento e obiettivi</h2>
        <Field label="Sport principale" htmlFor="main_sport" error={err.main_sport}>
          <select
            id="main_sport"
            name="main_sport"
            defaultValue={v("main_sport") || "cycling"}
            className={inputClass}
          >
            {(Object.keys(SPORTS) as Sport[]).map((s) => (
              <option key={s} value={s}>
                {SPORTS[s]}
              </option>
            ))}
          </select>
        </Field>
        <ChoiceGroup<Goal>
          legend="Obiettivo"
          name="goal"
          options={GOALS}
          value={(v("goal") || "maintain") as Goal}
          error={err.goal}
        />
        <ChoiceGroup<ActivityLevel>
          legend="Attività fuori dagli allenamenti"
          name="activity_level"
          options={ACTIVITY_LEVELS}
          value={(v("activity_level") || "light") as ActivityLevel}
          error={err.activity_level}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">I tuoi pasti</h2>
          <p className="text-xs text-muted">
            Orari tipici: servono per capire quali pasti cadono prima o dopo gli allenamenti.
          </p>
        </div>
        <ul className="space-y-2">
          {meals.map((meal) => (
            <li key={meal.id} className="flex items-center gap-2">
              <input
                aria-label="Nome del pasto"
                value={meal.name}
                onChange={(e) => updateMeal(meal.id, { name: e.target.value })}
                maxLength={40}
                className={cx(inputClass, "min-w-0 flex-1")}
              />
              <input
                aria-label="Orario"
                type="time"
                value={meal.time}
                onChange={(e) => updateMeal(meal.id, { time: e.target.value })}
                className={cx(inputClass, "w-28")}
              />
              <select
                aria-label="Tipo di pasto"
                value={meal.kind}
                onChange={(e) => updateMeal(meal.id, { kind: e.target.value as MealSlot["kind"] })}
                className={cx(inputClass, "w-28")}
              >
                <option value="main">Pasto</option>
                <option value="snack">Spuntino</option>
              </select>
              <button
                type="button"
                onClick={() => setMeals((ms) => ms.filter((m) => m.id !== meal.id))}
                disabled={meals.length <= 1}
                className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-danger disabled:opacity-30"
                aria-label={`Rimuovi ${meal.name}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        {err.meals && <p className="text-sm text-danger">{err.meals}</p>}
        {meals.length < 8 && (
          <button
            type="button"
            onClick={() =>
              setMeals((ms) => [...ms, { id: newMealId(), name: "Spuntino", time: "10:30", kind: "snack" }])
            }
            className={cx(buttonClass.ghost, "text-primary")}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Aggiungi pasto
          </button>
        )}
      </section>

      <FormMessage state={state} />
      <SubmitButton className="w-full">{submitLabel}</SubmitButton>
    </form>
  );
}
