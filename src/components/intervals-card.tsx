"use client";

import { useActionState } from "react";
import { Activity, RefreshCw, Unplug } from "lucide-react";
import {
  connectIntervals,
  disconnectIntervalsAction,
  syncIntervalsNow,
  updateIntervalsTime,
} from "@/app/actions/intervals";
import type { FormState } from "@/lib/forms";
import type { IntervalsStatus } from "@/lib/intervals/sync";
import { ConfirmButton } from "./confirm-button";
import { Field, FormMessage, SubmitButton } from "./form";
import { Card, cx, inputClass } from "./ui";

function ConnectForm({
  state,
  action,
}: {
  state: FormState;
  action: (formData: FormData) => void;
}) {
  const err = state?.fieldErrors ?? {};
  return (
    <form action={action} className="mt-4 space-y-3">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
        <li>
          Su{" "}
          <a href="https://intervals.icu" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary">
            intervals.icu
          </a>{" "}
          collega il tuo account Garmin dalle impostazioni.
        </li>
        <li>
          In fondo alle{" "}
          <a
            href="https://intervals.icu/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary"
          >
            Impostazioni
          </a>
          , sezione <em>Developer Settings</em>, trovi ID atleta e chiave API.
        </li>
      </ol>
      <div className="grid grid-cols-2 gap-3">
        <Field label="ID atleta" htmlFor="icu-athlete" error={err.athlete_id}>
          <input
            id="icu-athlete"
            name="athlete_id"
            placeholder="i12345"
            autoComplete="off"
            required
            defaultValue={state?.values?.athlete_id}
            className={inputClass}
          />
        </Field>
        <Field label="Ti alleni di solito alle" htmlFor="icu-time" error={err.default_time}>
          <input
            id="icu-time"
            name="default_time"
            type="time"
            required
            defaultValue={state?.values?.default_time || "18:00"}
            className={inputClass}
          />
        </Field>
      </div>
      <Field
        label="Chiave API"
        htmlFor="icu-key"
        error={err.api_key}
        hint="Resta sul server e serve solo a leggere i tuoi allenamenti."
      >
        <input id="icu-key" name="api_key" type="password" autoComplete="off" required className={inputClass} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingLabel="Collegamento…">Collega intervals.icu</SubmitButton>
    </form>
  );
}

function ConnectedPanel({ status }: { status: IntervalsStatus }) {
  const [syncState, syncAction] = useActionState(syncIntervalsNow, undefined);
  const [timeState, timeAction] = useActionState(updateIntervalsTime, undefined);
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm">
        Collegato{status.athleteName ? ` come ${status.athleteName}` : ""} ({status.athleteId}) ·
        ultima sincronizzazione: {status.lastSyncedLabel}
      </p>
      <form action={timeAction} className="flex items-end gap-2">
        <Field
          label="Orario per i pianificati senza ora"
          htmlFor="icu-time-edit"
          error={timeState?.fieldErrors?.default_time}
          className="flex-1"
        >
          <input
            id="icu-time-edit"
            name="default_time"
            type="time"
            defaultValue={status.defaultTime}
            className={inputClass}
          />
        </Field>
        <SubmitButton variant="secondary" pendingLabel="…">
          Salva
        </SubmitButton>
      </form>
      {timeState?.message && <FormMessage state={timeState} />}
      <div className="flex flex-wrap gap-2">
        <form action={syncAction}>
          <SubmitButton variant="secondary" pendingLabel="Sincronizzazione…">
            <RefreshCw className="h-4 w-4" aria-hidden />
            Sincronizza ora
          </SubmitButton>
        </form>
        <form action={disconnectIntervalsAction}>
          <ConfirmButton message="Scollegare intervals.icu? Gli allenamenti già svolti restano; quelli pianificati importati vengono rimossi.">
            <Unplug className="h-4 w-4" aria-hidden />
            Scollega
          </ConfirmButton>
        </form>
      </div>
      <FormMessage state={syncState} />
    </div>
  );
}

export function IntervalsCard({ status }: { status: IntervalsStatus }) {
  // Lives here, not in ConnectForm: on success the form is replaced by the
  // connected panel and its outcome message must survive the swap.
  const [connectState, connectAction] = useActionState(connectIntervals, undefined);
  return (
    <Card className="mb-4" id="intervals">
      <div className="flex items-start gap-3">
        <span
          className={cx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            status.connected ? "bg-primary/10 text-primary" : "bg-surface-2 text-muted",
          )}
          aria-hidden
        >
          <Activity className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Garmin tramite intervals.icu</h2>
          <p className="text-sm text-muted">
            Importa gli allenamenti pianificati e quelli fatti con l&apos;orologio. intervals.icu è
            gratuito e riceve le attività da Garmin in automatico.
          </p>
        </div>
      </div>
      {status.connected ? (
        <>
          {connectState?.message && (
            <div className="mt-3">
              <FormMessage state={connectState} />
            </div>
          )}
          <ConnectedPanel status={status} />
        </>
      ) : (
        <ConnectForm state={connectState} action={connectAction} />
      )}
    </Card>
  );
}
