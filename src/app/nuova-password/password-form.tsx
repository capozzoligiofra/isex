"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { inputClass } from "@/components/ui";

export function NewPasswordForm() {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="Nuova password" htmlFor="password" error={state?.fieldErrors?.password} hint="Almeno 8 caratteri.">
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
      </Field>
      <Field label="Ripeti la password" htmlFor="confirm" error={state?.fieldErrors?.confirm}>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full">Salva password</SubmitButton>
    </form>
  );
}
