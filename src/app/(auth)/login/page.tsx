import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/data";
import { safePath } from "@/lib/forms";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Accedi" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, errore } = await searchParams;
  if (await getUserId()) redirect(safePath(next, "/oggi"));
  return (
    <>
      <h1 className="mb-1 text-xl font-bold">Bentornato</h1>
      <p className="mb-5 text-sm text-muted">Accedi per vedere il piano di oggi.</p>
      {errore && (
        <p className="mb-4 rounded-xl bg-carb-high-bg px-3 py-2 text-sm text-carb-high">
          Il link non è valido o è scaduto. Riprova.
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </>
  );
}
