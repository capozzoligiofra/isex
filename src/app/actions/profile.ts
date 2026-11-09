"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActionUser } from "@/lib/data";
import { fieldErrors, formObject, safePath, type FormState } from "@/lib/forms";
import { profileSchema } from "@/lib/validation";

export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const { userId, supabase } = await requireActionUser();
  const raw = formObject(formData);
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Controlla i campi evidenziati.",
      fieldErrors: fieldErrors(parsed.error),
      values: raw,
    };
  }

  const p = parsed.data;
  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    display_name: p.display_name || null,
    sex: p.sex,
    birth_date: p.birth_date,
    height_cm: p.height_cm,
    weight_kg: p.weight_kg,
    activity_level: p.activity_level,
    goal: p.goal,
    main_sport: p.main_sport,
    meals: [...p.meals].sort((a, b) => a.time.localeCompare(b.time)),
  });
  if (error) return { error: `Salvataggio non riuscito: ${error.message}`, values: raw };

  revalidatePath("/", "layout");
  if (raw.redirect_to) redirect(safePath(raw.redirect_to, "/oggi"));
  return { message: "Profilo salvato." };
}
