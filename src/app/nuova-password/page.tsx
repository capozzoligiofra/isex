import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { requireUserId } from "@/lib/data";
import { NewPasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Nuova password" };

export default async function NewPasswordPage() {
  await requireUserId();
  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-bold">Scegli una nuova password</h1>
        <p className="mb-5 text-sm text-muted">La userai dal prossimo accesso.</p>
        <NewPasswordForm />
      </div>
    </div>
  );
}
