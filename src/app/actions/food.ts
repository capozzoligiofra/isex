"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireActionUser } from "@/lib/data";
import { fieldErrors, formObject, type FormState } from "@/lib/forms";
import { foodEntrySchema } from "@/lib/validation";

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function addFoodEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const { userId, supabase } = await requireActionUser();
  const raw = formObject(formData);
  const parsed = foodEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Controlla i campi evidenziati.",
      fieldErrors: fieldErrors(parsed.error),
      values: raw,
    };
  }

  const f = parsed.data;
  const factor = f.basis === "per100" ? f.grams / 100 : 1;
  const { error } = await supabase.from("food_entries").insert({
    user_id: userId,
    date: f.date,
    meal_slot: f.meal_slot,
    name: f.name,
    brand: f.brand || null,
    source: f.source,
    source_id: f.source_id || null,
    grams: round1(f.grams),
    kcal: round1(f.kcal * factor),
    carbs_g: round1(f.carbs * factor),
    protein_g: round1(f.protein * factor),
    fat_g: round1(f.fat * factor),
  });
  if (error) return { error: `Salvataggio non riuscito: ${error.message}`, values: raw };

  revalidatePath("/oggi");
  redirect(`/oggi?data=${f.date}#pasto-${f.meal_slot}`);
}

export async function deleteFoodEntry(formData: FormData) {
  const { userId, supabase } = await requireActionUser();
  const parsed = z.object({ id: z.uuid() }).safeParse(formObject(formData));
  if (!parsed.success) return;

  await supabase
    .from("food_entries")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", userId);
  revalidatePath("/oggi");
}
