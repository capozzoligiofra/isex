-- Collegamento intervals.icu (che a sua volta riceve le attività da Garmin).

create table public.intervals_connections (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  athlete_id text not null check (athlete_id ~ '^i[0-9]{1,12}$'),
  athlete_name text,
  api_key text not null check (char_length(api_key) between 10 and 200),
  -- Ora usata per gli allenamenti pianificati senza orario.
  default_time time not null default '18:00',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.intervals_connections enable row level security;

create policy "Intervals: lettura propria" on public.intervals_connections
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Intervals: inserimento proprio" on public.intervals_connections
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Intervals: modifica propria" on public.intervals_connections
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Intervals: eliminazione propria" on public.intervals_connections
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.intervals_connections to authenticated;

create trigger intervals_connections_set_updated_at
  before update on public.intervals_connections
  for each row execute function public.set_updated_at();

-- Gli allenamenti possono arrivare anche da intervals.icu.
alter table public.workouts drop constraint workouts_source_check;
alter table public.workouts
  add constraint workouts_source_check check (source in ('manual', 'strava', 'intervals'));

-- Id dell'allenamento pianificato sul calendario esterno (external_id resta
-- l'id dell'attività svolta): così un piano completato non viene ricreato.
alter table public.workouts
  add column plan_external_id text check (char_length(plan_external_id) <= 40);

create unique index workouts_user_source_plan_idx
  on public.workouts (user_id, source, plan_external_id)
  where plan_external_id is not null;
