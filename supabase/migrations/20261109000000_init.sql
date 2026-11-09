-- Schema iniziale: profili atleta, allenamenti, diario alimentare.
-- Ogni utente vede e modifica solo le proprie righe (Row Level Security).

-- ---------------------------------------------------------------------------
-- Profili
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  sex text check (sex in ('male', 'female')),
  birth_date date,
  height_cm numeric(5, 1) check (height_cm between 100 and 250),
  weight_kg numeric(5, 1) check (weight_kg between 30 and 250),
  activity_level text not null default 'light'
    check (activity_level in ('sedentary', 'light', 'active', 'very_active')),
  goal text not null default 'maintain'
    check (goal in ('lose', 'maintain', 'gain')),
  main_sport text not null default 'cycling'
    check (main_sport in ('cycling', 'running', 'swimming', 'strength', 'other')),
  meals jsonb not null default '[
    {"id": "colazione", "name": "Colazione", "time": "07:30", "kind": "main"},
    {"id": "pranzo", "name": "Pranzo", "time": "12:30", "kind": "main"},
    {"id": "spuntino", "name": "Spuntino", "time": "16:30", "kind": "snack"},
    {"id": "cena", "name": "Cena", "time": "20:00", "kind": "main"}
  ]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Allenamenti
-- ---------------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  start_time time not null,
  duration_min integer not null check (duration_min between 5 and 1440),
  sport text not null
    check (sport in ('cycling', 'running', 'swimming', 'strength', 'other')),
  intensity text not null
    check (intensity in ('recovery', 'endurance', 'tempo', 'threshold', 'vo2max', 'race')),
  title text check (char_length(title) <= 120),
  energy_kj integer check (energy_kj >= 0),
  hot_conditions boolean not null default false,
  completed boolean not null default false,
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create index workouts_user_date_idx on public.workouts (user_id, date);

-- ---------------------------------------------------------------------------
-- Diario alimentare
-- ---------------------------------------------------------------------------
create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  meal_slot text not null,
  name text not null check (char_length(name) between 1 and 200),
  brand text check (char_length(brand) <= 200),
  source text not null default 'manual'
    check (source in ('manual', 'generic', 'openfoodfacts')),
  source_id text,
  grams numeric(7, 1) not null check (grams > 0),
  kcal numeric(7, 1) not null check (kcal >= 0),
  carbs_g numeric(7, 1) not null default 0 check (carbs_g >= 0),
  protein_g numeric(7, 1) not null default 0 check (protein_g >= 0),
  fat_g numeric(7, 1) not null default 0 check (fat_g >= 0),
  created_at timestamptz not null default now()
);

create index food_entries_user_date_idx on public.food_entries (user_id, date);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.food_entries enable row level security;

create policy "Profilo: lettura propria" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Profilo: inserimento proprio" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "Profilo: modifica propria" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Allenamenti: lettura propri" on public.workouts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Allenamenti: inserimento propri" on public.workouts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Allenamenti: modifica propri" on public.workouts
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Allenamenti: eliminazione propri" on public.workouts
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Diario: lettura proprio" on public.food_entries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Diario: inserimento proprio" on public.food_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Diario: modifica proprio" on public.food_entries
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Diario: eliminazione proprio" on public.food_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.food_entries to authenticated;

-- ---------------------------------------------------------------------------
-- Trigger: profilo creato alla registrazione, updated_at automatico
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
