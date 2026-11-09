import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Password dimenticata" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-bold">Password dimenticata</h1>
      <p className="mb-5 text-sm text-muted">
        Inserisci la tua email: ti mandiamo un link per sceglierne una nuova.
      </p>
      <ResetForm />
    </>
  );
}
