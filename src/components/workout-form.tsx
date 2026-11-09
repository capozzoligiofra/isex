"use client";

import { useActionState } from "react";
import { saveWorkout } from "@/app/actions/workouts";
import type { WorkoutRecord } from "@/lib/db";
import { INTENSITIES, SPORTS } from "@/lib/labels";
import type { Intensity, Sport } from "@/lib/nutrition";
import { Field, FormMessage, SubmitButton } from "./form";
import { cx, inputClass } from "./ui";

export function WorkoutForm({
  workout,
  date,
  defaultSport,
}: {
  workout?: WorkoutRecord;
  date: string;
  defaultSport: Sport;
}) {
  const [state, action] = useActionState(saveWorkout, undefined);
  const err = state?.fieldErrors ?? {};
  const sent = state?.values;
  const duration = workout?.durationMin ?? 60;
  // After a failed submit React resets the form: refill it with what was sent.
  const v = (key: string, fallback: string | number | null | undefined) =>
    sent ? (sent[key] ?? "") : (fallback ?? "");
  const checked = (key: string, fallback?: boolean) => (sent ? sent[key] === "on" : Boolean(fallback));

  return (
    <form action={action} className="space-y-4">
      {workout && <input type="hidden" name="id" value={workout.id} />}
      <Field label="Titolo (facoltativo)" htmlFor="title" error={err.title}>
        <input
          id="title"
          name="title"
          defaultValue={v("title", workout?.title)}
          placeholder="Es. Uscita lunga, Ripetute 4×8'"
          maxLength={120}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data" htmlFor="date" error={err.date}>
          <input id="date" name="date" type="date" required defaultValue={v("date", workout?.date ?? date)} className={inputClass} />
        </Field>
        <Field label="Inizio" htmlFor="start_time" error={err.start_time}>
          <input
            id="start_time"
            name="start_time"
            type="time"
            required
            defaultValue={v("start_time", workout?.startTime ?? "18:00")}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Durata" error={err.duration_m ?? err.duration_h}>
        <div className="flex items-center gap-2">
          <input
            aria-label="Ore"
            name="duration_h"
            type="number"
            inputMode="numeric"
            min={0}
            max={24}
            defaultValue={v("duration_h", Math.floor(duration / 60))}
            className={cx(inputClass, "w-20 text-center")}
          />
          <span className="text-sm text-muted">h</span>
          <input
            aria-label="Minuti"
            name="duration_m"
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            step={5}
            defaultValue={v("duration_m", duration % 60)}
            className={cx(inputClass, "w-20 text-center")}
          />
          <span className="text-sm text-muted">min</span>
        </div>
      </Field>

      <Field label="Sport" htmlFor="sport" error={err.sport}>
        <select id="sport" name="sport" defaultValue={v("sport", workout?.sport ?? defaultSport)} className={inputClass}>
          {(Object.keys(SPORTS) as Sport[]).map((s) => (
            <option key={s} value={s}>
              {SPORTS[s]}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Intensità</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(Object.keys(INTENSITIES) as Intensity[]).map((i) => (
            <label
              key={i}
              className="cursor-pointer rounded-xl border border-border bg-surface p-2.5 text-sm transition has-[:checked]:border-primary has-[:checked]:bg-primary/10"
            >
              <input
                type="radio"
                name="intensity"
                value={i}
                defaultChecked={v("intensity", workout?.intensity ?? "endurance") === i}
                className="sr-only"
              />
              <span className="block font-semibold">{INTENSITIES[i].label}</span>
              <span className="block text-xs text-muted">{INTENSITIES[i].hint}</span>
            </label>
          ))}
        </div>
        {err.intensity && <p className="mt-1 text-sm text-danger">{err.intensity}</p>}
      </fieldset>

      <Field
        label="Lavoro in kJ (facoltativo)"
        htmlFor="energy_kj"
        error={err.energy_kj}
        hint="Se usi un misuratore di potenza: rende più precisa la stima delle calorie."
      >
        <input
          id="energy_kj"
          name="energy_kj"
          type="number"
          inputMode="numeric"
          min={0}
          max={20000}
          defaultValue={v("energy_kj", workout?.energyKj)}
          className={inputClass}
        />
      </Field>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="hot_conditions" defaultChecked={checked("hot_conditions", workout?.hotConditions)} className="h-4 w-4 accent-[var(--primary)]" />
          Condizioni calde (oltre 25 °C o molto umido)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="completed" defaultChecked={checked("completed", workout?.completed)} className="h-4 w-4 accent-[var(--primary)]" />
          Allenamento completato
        </label>
      </div>

      <Field label="Note" htmlFor="notes" error={err.notes}>
        <textarea id="notes" name="notes" rows={3} maxLength={2000} defaultValue={v("notes", workout?.notes)} className={inputClass} />
      </Field>

      <FormMessage state={state} />
      <SubmitButton className="w-full">{workout ? "Salva modifiche" : "Aggiungi allenamento"}</SubmitButton>
    </form>
  );
}
