"use client";

import { useActionState, type ReactNode } from "react";
import { syncStravaNow } from "@/app/actions/strava";
import { FormMessage, SubmitButton } from "./form";

export function StravaSyncButton({ icon }: { icon: ReactNode }) {
  const [state, action] = useActionState(syncStravaNow, undefined);
  return (
    <form action={action} className="contents">
      <SubmitButton variant="secondary" pendingLabel="Sincronizzazione…">
        {icon}
        Sincronizza ora
      </SubmitButton>
      {state && (
        <div className="basis-full">
          <FormMessage state={state} />
        </div>
      )}
    </form>
  );
}
