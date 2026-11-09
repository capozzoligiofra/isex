"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/data";
import type { FormState } from "@/lib/forms";
import { StravaError } from "@/lib/strava/client";
import { disconnectStrava, syncStrava } from "@/lib/strava/sync";

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export async function syncStravaNow(): Promise<FormState> {
  await requireUserId();
  try {
    const result = await syncStrava({ force: true });
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
  await requireUserId();
  await disconnectStrava();
  revalidatePath("/", "layout");
}
