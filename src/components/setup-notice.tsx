import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Shown instead of auth forms while the database isn't connected yet. */
export function SetupNotice() {
  if (isSupabaseConfigured()) return null;
  return (
    <div role="status" className="rounded-xl bg-carb-medium-bg px-4 py-3 text-sm text-carb-medium">
      <p className="font-semibold">App in configurazione</p>
      <p className="mt-1">
        Il database non è ancora collegato, quindi registrazione e accesso non sono disponibili.
        Riprova tra poco.
      </p>
    </div>
  );
}
