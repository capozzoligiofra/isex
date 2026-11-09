import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { ProfileForm } from "@/components/profile-form";
import { getProfileRow } from "@/lib/data";
import { toProfile } from "@/lib/db";

export const metadata: Metadata = { title: "Benvenuto" };

export default async function OnboardingPage() {
  const row = await getProfileRow();
  if (row && toProfile(row)) redirect("/oggi");

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <Logo />
      <h1 className="mt-6 text-2xl font-bold tracking-tight">
        {row?.display_name ? `Benvenuto, ${row.display_name.split(" ")[0]}!` : "Benvenuto!"}
      </h1>
      <p className="mb-6 mt-1 text-muted">
        Raccontaci qualcosa di te: con questi dati calcoliamo il fabbisogno di ogni giornata.
        Potrai cambiarli quando vuoi dal profilo.
      </p>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <ProfileForm profile={row} redirectTo="/oggi" submitLabel="Inizia" />
      </div>
    </div>
  );
}
