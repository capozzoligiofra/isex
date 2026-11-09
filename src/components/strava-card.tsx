import { Link2, RefreshCw, Unplug } from "lucide-react";
import { disconnectStravaAction } from "@/app/actions/strava";
import type { StravaStatus } from "@/lib/strava/sync";
import { ConfirmButton } from "./confirm-button";
import { StravaSyncButton } from "./strava-sync-button";
import { Card } from "./ui";

const FLASH: Record<string, { text: string; ok: boolean }> = {
  collegato: { text: "Strava collegato: le tue attività recenti sono state importate.", ok: true },
  negato: { text: "Hai annullato il collegamento a Strava.", ok: false },
  permessi: {
    text: "Per importare gli allenamenti serve il permesso di lettura delle attività: ricollega Strava e lascialo selezionato.",
    ok: false,
  },
  errore: { text: "Collegamento a Strava non riuscito. Riprova.", ok: false },
  "non-configurato": { text: "L'integrazione con Strava non è ancora configurata.", ok: false },
};

function formatSync(iso: string | null) {
  if (!iso) return "mai";
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Rome",
  }).format(new Date(iso));
}

export function StravaCard({ status, flash }: { status: StravaStatus; flash?: string }) {
  const message = flash ? FLASH[flash] : undefined;
  return (
    <Card className="mb-4" id="strava">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted" aria-hidden>
          <Link2 className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Strava</h2>
          <p className="text-sm text-muted">
            Importa le attività completate. Con Garmin, collega Garmin Connect a Strava e le
            uscite arriveranno qui da sole.
          </p>
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={`mt-3 rounded-xl px-3 py-2 text-sm ${message.ok ? "bg-primary/10 text-primary" : "bg-carb-high-bg text-carb-high"}`}
        >
          {message.text}
        </p>
      )}

      {!status.configured ? (
        <p className="mt-3 text-sm text-muted">
          Integrazione non ancora configurata sul server.
        </p>
      ) : status.connected ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm">
            Collegato{status.athleteName ? ` come ${status.athleteName}` : ""} · ultima
            sincronizzazione: {formatSync(status.lastSyncedAt)}
          </p>
          <div className="flex flex-wrap gap-2">
            <StravaSyncButton icon={<RefreshCw className="h-4 w-4" aria-hidden />} />
            <form action={disconnectStravaAction}>
              <ConfirmButton message="Scollegare Strava? Gli allenamenti già importati restano.">
                <Unplug className="h-4 w-4" aria-hidden />
                Scollega
              </ConfirmButton>
            </form>
          </div>
        </div>
      ) : (
        // A plain link: the route redirects to Strava's consent page.
        <a
          href="/api/strava/connect"
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#fc4c02] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e04300]"
        >
          Collega Strava
        </a>
      )}
    </Card>
  );
}
