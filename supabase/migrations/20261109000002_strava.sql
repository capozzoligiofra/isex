-- Collegamento Strava: token OAuth per utente e origine degli allenamenti.

create table public.strava_connections (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  athlete_id bigint not null,
  athlete_name text,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.strava_connections enable row level security;

create policy "Strava: lettura propria" on public.strava_connections
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Strava: inserimento proprio" on public.strava_connections
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Strava: modifica propria" on public.strava_connections
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Strava: eliminazione propria" on public.strava_connections
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.strava_connections to authenticated;

create trigger strava_connections_set_updated_at
  before update on public.strava_connections
  for each row execute function public.set_updated_at();

-- Origine degli allenamenti: inseriti a mano o importati da Strava.
alter table public.workouts
  add column source text not null default 'manual' check (source in ('manual', 'strava')),
  add column external_id text check (char_length(external_id) <= 40);

-- Un'attività Strava può essere importata una sola volta per utente.
create unique index workouts_user_source_external_idx
  on public.workouts (user_id, source, external_id)
  where external_id is not null;
