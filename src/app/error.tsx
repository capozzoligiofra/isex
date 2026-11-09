"use client";

import { buttonClass } from "@/components/ui";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Qualcosa è andato storto</h1>
      <p className="max-w-md text-sm text-muted">{error.message}</p>
      <button type="button" onClick={reset} className={buttonClass.primary}>
        Riprova
      </button>
    </div>
  );
}
