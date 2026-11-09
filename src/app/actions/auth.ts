"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, formObject, safePath, type FormState } from "@/lib/forms";

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

function authMessage(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "Email o password non corretti.";
    case "email_not_confirmed":
      return "Conferma prima il tuo indirizzo email: controlla la casella di posta.";
    case "user_already_exists":
      return "Esiste già un account con questa email.";
    case "email_address_invalid":
      return "Indirizzo email non valido: usane uno reale.";
    case "email_address_not_authorized":
      return "Al momento non possiamo inviare email a questo indirizzo. Riprova più tardi.";
    case "weak_password":
      return "Password troppo debole: usa almeno 8 caratteri con lettere e numeri.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Troppi tentativi. Riprova tra qualche minuto.";
    default:
      return `Si è verificato un errore: ${error.message}`;
  }
}

const emailField = z.email("Inserisci un indirizzo email valido.");
const passwordField = z
  .string()
  .min(8, "La password deve avere almeno 8 caratteri.")
  .max(72, "La password può avere al massimo 72 caratteri.");

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      email: emailField,
      password: z.string().min(1, "Inserisci la password."),
      next: z.string().optional(),
    })
    .safeParse(formObject(formData));
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: authMessage(error), values };
  redirect(safePath(parsed.data.next, "/oggi"));
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Come ti chiami?").max(60),
      email: emailField,
      password: passwordField,
    })
    .safeParse(formObject(formData));
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.name },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/onboarding`,
    },
  });
  if (error) return { error: authMessage(error), values };
  if (data.session) redirect("/onboarding");
  return {
    message:
      "Ti abbiamo inviato un'email di conferma. Apri il link per attivare l'account.",
  };
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z.object({ email: emailField }).safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/nuova-password`,
  });
  if (error && error.code?.startsWith("over_")) return { error: authMessage(error) };
  return {
    message:
      "Se esiste un account con questa email, riceverai un link per impostare una nuova password.",
  };
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({ password: passwordField, confirm: z.string() })
    .refine((v) => v.password === v.confirm, {
      message: "Le due password non coincidono.",
      path: ["confirm"],
    })
    .safeParse(formObject(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authMessage(error) };
  redirect("/oggi");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
