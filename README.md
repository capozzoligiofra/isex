# Carbura

Web app (PWA) di **nutrizione periodizzata per atleti di endurance**: calcola ogni giorno
calorie e macronutrienti in base agli allenamenti, assegna a ogni pasto un livello di
carboidrati (basso / medio / alto) e prepara il piano di rifornimento per ogni sessione.

> "Carbura" è un nome provvisorio: si cambia in `src/lib/app.ts`.

## Funzionalità

- **Profilo atleta**: sesso, età, altezza, peso, sport, obiettivo (perdere peso, mantenere,
  aumentare massa), attività fuori dagli allenamenti, orari dei pasti.
- **Fabbisogno giornaliero**: metabolismo basale (Mifflin-St Jeor) × attività quotidiana
  + costo degli allenamenti (MET oppure kJ del misuratore di potenza).
- **Carboidrati periodizzati**: da 3 g/kg nei giorni di riposo fino a 12 g/kg nei giorni
  più duri, con carico extra il giorno prima di una sessione importante.
- **Livello di carboidrati per pasto**: ogni pasto è *basso*, *medio* o *alto* in base agli
  allenamenti prima e dopo, con la spiegazione del perché ("Prima di: Uscita lunga",
  "Carica per domani", ...). Pochi grassi nel pasto che precede una sessione.
- **Rifornimento in allenamento**: g/h di carboidrati (0–90), programma delle assunzioni
  ogni 20 minuti, liquidi, sodio, indicazioni per prima e dopo.
- **Allenamenti**: vista settimanale con il fabbisogno di ogni giorno, inserimento e
  modifica di sessioni pianificate o completate.
- **Diario alimentare**: ricerca negli alimenti di base integrati (valori medi CREA/USDA)
  e in [Open Food Facts](https://world.openfoodfacts.org) (anche per codice a barre),
  porzioni rapide, alimenti recenti, inserimento manuale.
- **Account** con Supabase Auth (email e password, conferma email, recupero password)
  e dati protetti da Row Level Security.
- **PWA** installabile, tema chiaro e scuro, interfaccia in italiano pensata per il telefono.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, `after()`), React 19, TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- [Supabase](https://supabase.com): Postgres, Auth, Row Level Security (`@supabase/ssr`)
- [Zod](https://zod.dev) per la validazione, [Vitest](https://vitest.dev) per i test

## Avvio

### 1. Progetto Supabase

1. Crea un progetto su [supabase.com](https://supabase.com/dashboard).
2. Applica lo schema del database, in uno dei due modi:
   - incolla `supabase/migrations/20261109000000_init.sql` nel **SQL Editor** ed eseguilo;
   - oppure con la CLI: `npx supabase link --project-ref <ref>` e poi `npx supabase db push`.
3. In **Authentication → URL Configuration** imposta:
   - *Site URL*: l'indirizzo dell'app (es. `http://localhost:3000` in sviluppo);
   - *Redirect URLs*: `http://localhost:3000/**` e l'URL di produzione con `/**`.

### 2. Variabili d'ambiente

```bash
cp .env.example .env.local
```

Inserisci `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(Project Settings → API Keys). Va bene anche la vecchia *anon key* in
`NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 3. Sviluppo

```bash
npm install
npm run dev
```

Apri <http://localhost:3000>, crea un account e completa il profilo.

### Supabase in locale (facoltativo)

Con Docker puoi usare uno stack Supabase locale al posto di quello in cloud:

```bash
npx supabase start          # applica anche le migrazioni in supabase/migrations
```

Copia `API_URL` e `PUBLISHABLE_KEY` stampati dal comando in `.env.local`.
In locale la conferma email è disattivata (vedi `supabase/config.toml`).

## Produzione

| Cosa | Dove |
| --- | --- |
| App | <https://carbura-spkv.netlify.app> (Netlify, progetto `carbura-spkv`) |
| Database e Auth | Supabase, progetto `carbura` (`qbtwaqpnbgcpyinwvqnr`, eu-central-1) |

- Su Netlify sono impostate `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  e `NEXT_PUBLIC_SITE_URL`. Dopo ogni modifica alle variabili serve un nuovo deploy.
- Auth: *Site URL* `https://carbura-spkv.netlify.app`, redirect consentiti
  `https://carbura-spkv.netlify.app/**` e `http://localhost:3000/**`.
- **La conferma email è disattivata**: senza un server SMTP proprio, Supabase invia email solo
  ai membri del team del progetto. Per riattivarla (e far funzionare il recupero password per
  tutti) configura un SMTP in Authentication → Emails → SMTP Settings, poi riattiva
  *Confirm email*.
- Le migrazioni in `supabase/migrations/` sono già applicate al progetto.
- **Sessione senza proxy**: niente middleware (su Netlify girerebbe come edge function con avvii a
  freddo di 1–3 s). Le pagine verificano il token del cookie in locale e interrogano il database
  con quel token, senza mai rinnovarlo; le Server Action possono rinnovarlo; il browser
  (`components/session-refresher.tsx`) mantiene la sessione aggiornata e, dopo una scadenza, la
  rinnova dalla pagina di login riportando l'utente dove voleva andare.
- **Prestazioni**: le funzioni Netlify girano in us-east-2 (Ohio), il database a Francoforte. Le
  pagine fanno una sola andata e ritorno verso il database (query in parallelo) e le
  sincronizzazioni con intervals.icu/Strava girano dopo l'invio della pagina (`after()`). La
  funzione programmata `netlify/functions/keep-warm.mts` chiama `/api/health` ogni 5 minuti (due
  richieste in parallelo) per evitare gli avvii a freddo, e i link alle pagine dinamiche non fanno
  prefetch (ogni prefetch avvierebbe un'altra istanza a freddo). Per avere server e database vicini serve spostare le funzioni a
  Francoforte (Netlify → Cloud compute → Functions → Region, piano Pro) e poi ripubblicare.

## Garmin: intervals.icu e Strava

Garmin ha sospeso l'accesso alle sue API per i nuovi sviluppatori, quindi gli allenamenti
Garmin arrivano tramite un servizio intermedio. Le due integrazioni condividono la stessa logica:
un'attività che corrisponde a un allenamento pianificato (stesso giorno e sport, inizio entro 3
ore) lo **completa** invece di creare un doppione, e le attività già importate non vengono mai
sovrascritte. La sincronizzazione parte aprendo *Oggi* o *Allenamenti* (con un intervallo minimo)
o con *Sincronizza ora*.

### intervals.icu (consigliato)

Gratuito, riceve le attività da Garmin in automatico e ha anche il calendario degli allenamenti
pianificati. Nessuna configurazione lato server: ogni atleta inserisce nel **Profilo** il proprio
ID atleta e la chiave API (intervals.icu → Settings → Developer Settings).

- **Pianificati**: gli allenamenti e le gare dei prossimi 14 giorni vengono importati e restano
  allineati al calendario (spostati, modificati o rimossi) finché non sono svolti. Quelli senza
  orario usano l'"ora abituale" impostata nel profilo.
- **Svolti**: le attività completano il loro piano (prima con l'abbinamento fatto da
  intervals.icu, `paired_event_id`, poi per giorno/sport/orario) oppure vengono aggiunte. Intensità
  dall'Intensity Factor (o dal carico), lavoro in kJ da `icu_joules`.
- Le attività arrivate su intervals.icu da Strava non sono esposte dalla sua API e vengono saltate.
- *Scollega* elimina la chiave e gli allenamenti pianificati futuri importati; quelli svolti restano.
- La chiave API resta nel database protetta da RLS e non viene mai inviata al browser.

### Strava (facoltativo)

Disattivato finché non imposti `STRAVA_CLIENT_ID` e `STRAVA_CLIENT_SECRET` (app creata su
<https://www.strava.com/settings/api>, *Authorization Callback Domain* = dominio dell'app). Importa
solo attività svolte (OAuth, `activity:read_all`). Le app Strava nuove accettano solo l'atleta che le
ha create (fino a 10 dalla pagina dell'app; oltre serve una revisione di Strava). Prima di aprirla ad
altri, usa il pulsante ufficiale "Connect with Strava".

## Script

| Comando             | Cosa fa                                  |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | server di sviluppo                       |
| `npm run build`     | build di produzione                      |
| `npm start`         | avvia la build di produzione             |
| `npm test`          | test unitari (motore nutrizionale, ecc.) |
| `npm run lint`      | ESLint                                   |
| `npm run typecheck` | genera i tipi delle route e lancia `tsc` |

## Come sono fatti i calcoli

Tutta la logica è in `src/lib/nutrition/`, in funzioni pure coperte da test.

| Cosa | Regola | File |
| --- | --- | --- |
| Metabolismo basale | Mifflin-St Jeor | `energy.ts` |
| Vita quotidiana | BMR × 1,2 / 1,35 / 1,5 / 1,7 | `energy.ts` |
| Costo allenamento | (MET − 1) × kg × ore, oppure kJ × 1,04 | `energy.ts` |
| Carico | ore × fattore d'intensità (recupero 0,5 … gara 1,7) | `energy.ts` |
| Carboidrati/giorno | 3 → 12 g/kg in funzione del carico (IOC/ACSM), +0,5–1,5 g/kg la vigilia di una sessione dura | `macros.ts` |
| Proteine | 1,6 / 1,8 / 2,0 g/kg (mantenere / massa / dimagrire) | `macros.ts` |
| Grassi | completano l'energia, tra 0,8 e 1,5 g/kg | `macros.ts` |
| Obiettivo peso | −15% (max 500 kcal) o +10% solo sull'energia della vita quotidiana | `energy.ts` |
| Livello pasto | punteggio dagli allenamenti nelle 4 h prima e nelle 8 h dopo, più la cena prima di una sessione mattutina | `meals.ts` |
| Rifornimento | 0 / 20–30 / 30–60 / 60–90 g/h in base a durata e intensità (Jeukendrup 2014) | `fueling.ts` |

Riferimenti principali: Burke et al. 2011 (*J Sports Sci*), Thomas, Erdman & Burke 2016
(ACSM/AND/DC position stand), Jeukendrup 2014 (*Sports Med*).

Le indicazioni dell'app sono generali e **non sostituiscono il parere di un medico o di un
nutrizionista**.

## Struttura

```
src/
  app/
    (auth)/            login, registrazione, password dimenticata
    (app)/             schermate con la navigazione: oggi, allenamenti, diario, profilo
    actions/           Server Actions (auth, profilo, allenamenti, diario)
    api/foods/search/  ricerca alimenti (base + Open Food Facts)
    auth/callback/     link delle email di Supabase
    onboarding/        primo accesso
  components/          componenti UI
  lib/
    nutrition/         motore di calcolo (puro, testato)
    foods/             alimenti di base e client Open Food Facts
    supabase/          client Supabase (azioni, rendering con token, verifica sessione)
    data.ts            accesso ai dati (lato server)
supabase/
  migrations/          schema SQL con Row Level Security
```

## Prossimi passi possibili

- Import automatico degli allenamenti (Strava, intervals.icu, Garmin, TrainingPeaks)
- Scansione del codice a barre con la fotocamera
- Ricette e piani pasto suggeriti per livello di carboidrati
- Storico del peso e andamento settimanale
- Supporto offline (service worker) e notifiche per il rifornimento
- Area coach per seguire più atleti
