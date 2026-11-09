import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Pagina non trovata</h1>
      <p className="text-muted">Il contenuto che cerchi non esiste o è stato eliminato.</p>
      <LinkButton href="/oggi">Torna a oggi</LinkButton>
    </div>
  );
}
