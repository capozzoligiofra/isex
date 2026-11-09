"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/data";
import { fieldErrors, formObject, type FormState } from "@/lib/forms";
import { IntervalsError, getAthlete } from "@/lib/intervals/client";
import { normalizeAthleteId } from "@/lib/intervals/map";
import { disconnectIntervals, syncIntervals, type IntervalsSyncResult } from "@/lib/intervals/sync";
import { timeOfDay } from "@/lib/validation";

function summary(r: IntervalsSyncResult | null): string {
  if (!r) return "intervals.icu non è collegato.";
  const parts: string[] = [];
  if (r.activitiesImported) parts.push(`${r.activitiesImported} attività importate`);
  if (r.plansCompleted) parts.push(`${r.plansCompleted} allenamenti completati`);
  if (r.plansAdded) parts.push(`${r.plansAdded} allenamenti pianificati aggiunti`);
  if (r.plansUpdated) parts.push(`${r.plansUpdated} aggiornati`);
  if (r.plansRemoved) parts.push(`${r.plansRemoved} rimossi`);
  return parts.length ? `Sincronizzato: ${parts.join(", ")}.` : "Tutto aggiornato: nessuna novità.";
}

function errorMessage(e: unknown): string {
  if (e instanceof IntervalsError) {
    if (e.status === 401 || e.status === 403) {
      return "intervals.icu non accetta la chiave API: controlla ID atleta e chiave nelle impostazioni di intervals.icu.";
    }
    if (e.status === 404) return "ID atleta non trovato su intervals.icu.";
    if (e.status === 429) return "intervals.icu ha ricevuto troppe richieste: riprova tra poco.";
    return `intervals.icu non risponde (errore ${e.status}). Riprova più tardi.`;
  }
  return e instanceof Error ? e.message : "Operazione non riuscita.";
}

const connectSchema = z.object({
  athlete_id: z
    .string()
    .transform((v, ctx) => {
      const id = normalizeAthleteId(v);
      if (!id) ctx.addIssue({ code: "custom", message: "L'ID atleta è tipo i12345." });
      return id ?? "";
    }),
  api_key: z.string().trim().min(10, "Incolla la chiave API completa.").max(200),
  default_time: timeOfDay,
});

export async function connectIntervals(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const raw = formObject(formData);
  const values = { athlete_id: raw.athlete_id ?? "", default_time: raw.default_time ?? "" };
  const parsed = connectSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { athlete_id, api_key, default_time } = parsed.data;
  let athleteName: string | null = null;
  try {
    // Checks the key before saving it.
    const athlete = await getAthlete({ athleteId: athlete_id, apiKey: api_key });
    athleteName =
      athlete.name || [athlete.firstname, athlete.lastname].filter(Boolean).join(" ") || null;
  } catch (e) {
    return { error: errorMessage(e), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("intervals_connections").upsert({
    user_id: userId,
    athlete_id,
    athlete_name: athleteName,
    api_key,
    default_time,
    last_synced_at: null,
  });
  if (error) return { error: `Salvataggio non riuscito: ${error.message}`, values };

  let message = "intervals.icu collegato.";
  try {
    message = `intervals.icu collegato. ${summary(await syncIntervals({ force: true }))}`;
  } catch (e) {
    message = `intervals.icu collegato, ma la prima sincronizzazione non è riuscita: ${errorMessage(e)}`;
  }
  revalidatePath("/", "layout");
  return { message };
}

export async function syncIntervalsNow(): Promise<FormState> {
  await requireUserId();
  try {
    const result = await syncIntervals({ force: true });
    revalidatePath("/", "layout");
    return result ? { message: summary(result) } : { error: summary(result) };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function updateIntervalsTime(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const parsed = z.object({ default_time: timeOfDay }).safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase
    .from("intervals_connections")
    .update({ default_time: parsed.data.default_time })
    .eq("user_id", userId);
  if (error) return { error: `Salvataggio non riuscito: ${error.message}` };
  // Re-place planned workouts that use the usual time.
  try {
    await syncIntervals({ force: true });
  } catch {
    // The next sync will apply it.
  }
  revalidatePath("/", "layout");
  return { message: "Orario salvato." };
}

export async function disconnectIntervalsAction() {
  await requireUserId();
  await disconnectIntervals();
  revalidatePath("/", "layout");
}
