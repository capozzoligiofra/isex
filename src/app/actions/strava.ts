"use server";

import { revalidatePath } from "next/cache";
import { getToday, requireActionUser } from "@/lib/data";
import type { SyncContext } from "@/lib/integrations/context";
import type { FormState } from "@/lib/forms";
import { StravaError } from "@/lib/strava/client";
import { disconnectStrava, syncStrava } from "@/lib/strava/sync";

async function actionContext(): Promise<SyncContext> {
  const [{ userId, supabase }, today] = await Promise.all([requireActionUser(), getToday()]);
  return { userId, supabase, today };
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export async function syncStravaNow(): Promise<FormState> {
  const ctx = await actionContext();
  try {
    const result = await syncStrava({ force: true, ctx });
    revalidatePath("/", "layout");
    if (!result) return { error: "Strava non è collegato." };
    if (result.imported === 0 && result.linked === 0) {
      return { message: "Nessuna nuova attività da Strava." };
    }
    const parts = [];
    if (result.imported) parts.push(plural(result.imported, "attività importata", "attività importate"));
    if (result.linked) {
      parts.push(plural(result.linked, "allenamento pianificato completato", "allenamenti pianificati completati"));
    }
    return { message: `Sincronizzato: ${parts.join(", ")}.` };
  } catch (e) {
    if (e instanceof StravaError && e.status === 429) {
      return { error: "Strava ha ricevuto troppe richieste: riprova tra qualche minuto." };
    }
    return { error: e instanceof Error ? e.message : "Sincronizzazione non riuscita." };
  }
}

export async function disconnectStravaAction() {
  await disconnectStrava(await actionContext());
  revalidatePath("/", "layout");
}
