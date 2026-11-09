import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { deleteWorkout } from "@/app/actions/workouts";
import { ConfirmButton } from "@/components/confirm-button";
import { SportIcon } from "@/components/sport-icon";
import { Card, LinkButton, Stat, buttonClass, cx } from "@/components/ui";
import { WorkoutForm } from "@/components/workout-form";
import { getWorkout, getWorkouts, requireProfile } from "@/lib/data";
import { addDays, formatDayLong } from "@/lib/dates";
import { fmt } from "@/lib/format";
import { INTENSITIES, SPORTS, formatDuration } from "@/lib/labels";
import { computeDayPlan, formatTime, toMinutes } from "@/lib/nutrition";

export const metadata: Metadata = { title: "Allenamento" };

export default async function WorkoutPage({ params, searchParams }: PageProps<"/allenamenti/[id]">) {
  const { id } = await params;
  const { modifica } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const profile = await requireProfile();
  const workout = await getWorkout(id);
  if (!workout) notFound();

  const nextDay = addDays(workout.date, 1);
  const around = await getWorkouts(workout.date, nextDay);
  const day = computeDayPlan({
    profile,
    date: workout.date,
    workouts: around.filter((w) => w.date === workout.date),
    tomorrowWorkouts: around.filter((w) => w.date === nextDay),
  });
  const plan = day.workouts.find((p) => p.workout.id === id);
  if (!plan) notFound();
  const f = plan.fueling;
  const start = toMinutes(workout.startTime);
  const end = start + workout.durationMin;

  return (
    <>
      <Link href={`/oggi?data=${workout.date}`} className={cx(buttonClass.ghost, "-ml-3 mb-2")}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span>{formatDayLong(workout.date)}</span>
      </Link>

      <header className="mb-4 flex items-start gap-3">
        <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <SportIcon sport={workout.sport} className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{workout.title || SPORTS[workout.sport]}</h1>
          <p className="text-sm text-muted">
            {workout.startTime}–{formatTime(end)} · {formatDuration(workout.durationMin)} ·{" "}
            {INTENSITIES[workout.intensity].label}
            {workout.completed && " · completato"}
          </p>
        </div>
      </header>

      {modifica ? (
        <Card>
          <h2 className="mb-4 font-semibold">Modifica allenamento</h2>
          <WorkoutForm workout={workout} date={workout.date} defaultSport={workout.sport} />
          <LinkButton href={`/allenamenti/${id}`} variant="ghost" className="mt-2 w-full">
            Annulla
          </LinkButton>
        </Card>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Energia" value={`~${fmt(plan.kcal)} kcal`} hint={workout.energyKj ? `da ${fmt(workout.energyKj)} kJ` : "stima"} />
            <Stat label="Carboidrati" value={f.carbsPerHour > 0 ? `${f.carbsPerHour} g/h` : "—"} hint={f.totalCarbsG > 0 ? `${f.totalCarbsG} g in totale` : "non necessari"} />
            <Stat label="Liquidi" value={f.fluidMlPerHour > 0 ? `${f.fluidMlPerHour} ml/h` : "a sete"} hint={workout.hotConditions ? "condizioni calde" : undefined} />
            <Stat label="Sodio" value={f.sodiumMgPerHour > 0 ? `${f.sodiumMgPerHour} mg/h` : "—"} />
          </div>

          <Card className="mb-4">
            <h2 className="font-semibold">Piano di rifornimento</h2>
            {f.feeds.length > 0 ? (
              <ol className="mt-3 space-y-1.5">
                {f.feeds.map((feed) => (
                  <li key={feed.atMin} className="tabular flex items-center gap-3 text-sm">
                    <span className="w-14 text-muted">+{formatDuration(feed.atMin)}</span>
                    <span className="h-px flex-1 bg-border" aria-hidden />
                    <span className="font-semibold">{feed.carbsG} g carbo</span>
                    <span className="w-12 text-right text-xs text-muted">{formatTime(start + feed.atMin)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-muted">Nessuna assunzione programmata durante la sessione.</p>
            )}
            {f.notes.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
                {f.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </Card>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <Card>
              <h2 className="font-semibold">Prima</h2>
              <p className="mt-1 text-sm text-muted">
                {f.preCarbsG > 0
                  ? `Circa ${f.preCarbsG} g di carboidrati nelle 1–4 ore prima, in un pasto povero di grassi e fibre.`
                  : "Nessuna preparazione particolare: un pasto normale qualche ora prima va bene."}
              </p>
            </Card>
            <Card>
              <h2 className="font-semibold">Dopo</h2>
              <p className="mt-1 text-sm text-muted">
                {f.postCarbsG > 0
                  ? `Circa ${f.postCarbsG} g di carboidrati e ${f.postProteinG} g di proteine nelle prime ore.`
                  : f.postProteinG > 0
                    ? `Un pasto normale con circa ${f.postProteinG} g di proteine.`
                    : "Nessun recupero specifico necessario."}
              </p>
            </Card>
          </div>

          {workout.notes && (
            <Card className="mb-4">
              <h2 className="font-semibold">Note</h2>
              <p className="mt-1 whitespace-pre-line text-sm text-muted">{workout.notes}</p>
            </Card>
          )}

          <div className="flex gap-2">
            <LinkButton href={`/allenamenti/${id}?modifica=1`} variant="secondary" className="flex-1">
              <Pencil className="h-4 w-4" aria-hidden />
              Modifica
            </LinkButton>
            <form action={deleteWorkout} className="flex-1">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="date" value={workout.date} />
              <ConfirmButton message="Eliminare questo allenamento?" className="w-full">
                <Trash2 className="h-4 w-4" aria-hidden />
                Elimina
              </ConfirmButton>
            </form>
          </div>
        </>
      )}
    </>
  );
}
