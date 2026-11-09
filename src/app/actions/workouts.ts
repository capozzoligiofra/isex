"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/data";
import { startOfWeek } from "@/lib/dates";
import { fieldErrors, formObject, type FormState } from "@/lib/forms";
import { isoDate, workoutSchema } from "@/lib/validation";

export async function saveWorkout(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await requireUserId();
  const raw = formObject(formData);
  const parsed = workoutSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Controlla i campi evidenziati.",
      fieldErrors: fieldErrors(parsed.error),
      values: raw,
    };
  }

  const w = parsed.data;
  const values = {
    date: w.date,
    start_time: w.start_time,
    duration_min: w.duration_h * 60 + w.duration_m,
    sport: w.sport,
    intensity: w.intensity,
    title: w.title || null,
    energy_kj: w.energy_kj ?? null,
    hot_conditions: w.hot_conditions === "on",
    completed: w.completed === "on",
    notes: w.notes || null,
  };

  const supabase = await createClient();
  let id = w.id;
  if (id) {
    const { error } = await supabase
      .from("workouts")
      .update(values)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { error: `Salvataggio non riuscito: ${error.message}`, values: raw };
  } else {
    const { data, error } = await supabase
      .from("workouts")
      .insert({ ...values, user_id: userId })
      .select("id")
      .single();
    if (error) return { error: `Salvataggio non riuscito: ${error.message}`, values: raw };
    id = data.id as string;
  }

  revalidatePath("/oggi");
  revalidatePath("/allenamenti", "layout");
  redirect(`/allenamenti/${id}`);
}

export async function deleteWorkout(formData: FormData) {
  const userId = await requireUserId();
  const parsed = z
    .object({ id: z.uuid(), date: isoDate })
    .safeParse(formObject(formData));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("workouts").delete().eq("id", parsed.data.id).eq("user_id", userId);
  revalidatePath("/oggi");
  revalidatePath("/allenamenti", "layout");
  redirect(`/allenamenti?settimana=${startOfWeek(parsed.data.date)}`);
}
