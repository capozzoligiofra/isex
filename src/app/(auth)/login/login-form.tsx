"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { inputClass } from "@/components/ui";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email" htmlFor="email" error={state?.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} className={inputClass} />
      </Field>
      <Field label="Password" htmlFor="password" error={state?.fieldErrors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingLabel="Accesso…">
        Accedi
      </SubmitButton>
      <div className="flex justify-between text-sm">
        <Link prefetch={false} href="/password-dimenticata" className="text-muted hover:text-text">
          Password dimenticata?
        </Link>
        <Link prefetch={false} href="/registrati" className="font-semibold text-primary">
          Registrati
        </Link>
      </div>
    </form>
  );
}
