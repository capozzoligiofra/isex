"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { inputClass } from "@/components/ui";

export function SignupForm() {
  const [state, action] = useActionState(signUp, undefined);
  if (state?.message) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <Field label="Nome" htmlFor="name" error={state?.fieldErrors?.name}>
        <input id="name" name="name" autoComplete="given-name" required defaultValue={state?.values?.name} className={inputClass} />
      </Field>
      <Field label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} className={inputClass} />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={state?.fieldErrors?.password}
        hint="Almeno 8 caratteri."
      >
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingLabel="Creazione account…">
        Crea account
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        Hai già un account?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Accedi
        </Link>
      </p>
    </form>
  );
}
