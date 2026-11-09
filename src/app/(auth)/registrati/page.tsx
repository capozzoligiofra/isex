import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/data";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Registrati" };

export default async function SignupPage() {
  if (await getUserId()) redirect("/oggi");
  return (
    <>
      <h1 className="mb-1 text-xl font-bold">Crea il tuo account</h1>
      <p className="mb-5 text-sm text-muted">Ti servono due minuti per impostare il profilo.</p>
      <SignupForm />
    </>
  );
}
