import { redirect } from "next/navigation";
import { Activity, CalendarDays, NotebookPen, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { SetupNotice } from "@/components/setup-notice";
import { CarbBadge, LinkButton } from "@/components/ui";
import { getUserId } from "@/lib/data";
import { APP_NAME } from "@/lib/app";

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Fabbisogno che cambia ogni giorno",
    text: "Calorie, carboidrati, proteine e grassi ricalcolati in base agli allenamenti di oggi e di domani.",
  },
  {
    icon: Activity,
    title: "Ogni pasto ha il suo livello di carbo",
    text: "Basso, medio o alto: carichi prima e dopo le sessioni dure, resti leggero nei giorni di scarico.",
  },
  {
    icon: Zap,
    title: "Rifornimento durante l'allenamento",
    text: "Grammi di carboidrati all'ora, quando assumerli, quanti liquidi e quanto sodio.",
  },
  {
    icon: NotebookPen,
    title: "Diario alimentare",
    text: "Cerca tra milioni di prodotti o negli alimenti di base e confronta quello che mangi con i tuoi obiettivi.",
  },
];

const EXAMPLE = [
  { time: "07:30", name: "Colazione", code: "high", note: "Prima di: Uscita lunga (09:00)" },
  { time: "09:00", name: "Uscita lunga · 3 h fondo", workout: "60 g/h · 1 borraccia/h" },
  { time: "12:30", name: "Pranzo", code: "high", note: "Recupero dopo l'uscita" },
  { time: "16:30", name: "Spuntino", code: "medium", note: "Recupero dopo l'uscita" },
  { time: "20:00", name: "Cena", code: "medium", note: "Nessun allenamento vicino" },
] as const;

export default async function Home() {
  if (await getUserId()) redirect("/oggi");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-12 sm:px-6">
      <header className="flex items-center justify-between py-5">
        <Logo />
        <LinkButton href="/login" variant="ghost">
          Accedi
        </LinkButton>
      </header>

      <main className="grid flex-1 grid-cols-1 items-center gap-10 py-6 md:grid-cols-2 md:py-14">
        <div>
          <p className="mb-3 inline-block rounded-full bg-accent/30 px-3 py-1 text-xs font-semibold text-text">
            Per ciclisti, runner e triatleti
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Mangia in base a come ti alleni.
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            {APP_NAME} calcola ogni giorno quanta energia e quanti carboidrati ti servono,
            ti dice come distribuirli nei pasti e come rifornirti durante la sessione.
          </p>
          <div className="mt-6 max-w-md">
            <SetupNotice />
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <LinkButton href="/registrati" className="px-6 py-3 text-base">
              Crea un account gratuito
            </LinkButton>
            <LinkButton href="/login" variant="secondary" className="px-6 py-3 text-base">
              Ho già un account
            </LinkButton>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="font-semibold">Sabato</span>
            <span className="text-sm text-muted">8,2 g/kg di carbo · 3.450 kcal</span>
          </div>
          <ol className="space-y-2">
            {EXAMPLE.map((item) => (
              <li
                key={item.time}
                className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5"
              >
                <span className="tabular w-11 text-sm text-muted">{item.time}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{item.name}</div>
                  <div className="truncate text-xs text-muted">
                    {"workout" in item ? item.workout : item.note}
                  </div>
                </div>
                {"code" in item ? (
                  <CarbBadge code={item.code} compact />
                ) : (
                  <Zap className="h-4 w-4 text-primary" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        </div>
      </main>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-border bg-surface p-4">
            <Icon className="mb-3 h-6 w-6 text-primary" aria-hidden />
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>

      <p className="mt-10 text-center text-xs text-muted">
        Le indicazioni si basano sulle linee guida di nutrizione sportiva (IOC, ACSM) e non
        sostituiscono il parere di un medico o di un nutrizionista.
      </p>
    </div>
  );
}
