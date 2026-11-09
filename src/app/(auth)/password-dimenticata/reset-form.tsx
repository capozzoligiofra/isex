"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { inputClass } from "@/components/ui";

export function ResetForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  if (state?.message) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingLabel="Invio…">
        Inviami il link
      </SubmitButton>
      <p className="text-center text-sm">
        <Link prefetch={false} href="/login" className="text-muted hover:text-text">
          Torna all&apos;accesso
        </Link>
      </p>
    </form>
  );
}
