create table if not exists public.tournament_settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.sports (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.players (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  team_id text generated always as (data ->> 'teamId') stored,
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  sport text generated always as (data ->> 'sport') stored,
  status text generated always as (data ->> 'status') stored,
  stage text generated always as (data ->> 'stage') stored,
  revision integer generated always as (coalesce(nullif(data ->> 'revision', ''), '0')::integer) stored,
  updated_at timestamptz not null default now()
);

create table if not exists public.awards (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.standings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.leaderboards (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.brackets (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.command_receipts (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists players_team_id_idx on public.players (team_id);
create index if not exists matches_sport_status_idx on public.matches (sport, status);
create index if not exists matches_stage_idx on public.matches (stage);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tournament_settings_touch_updated_at on public.tournament_settings;
create trigger tournament_settings_touch_updated_at before update on public.tournament_settings for each row execute function public.touch_updated_at();

drop trigger if exists sports_touch_updated_at on public.sports;
create trigger sports_touch_updated_at before update on public.sports for each row execute function public.touch_updated_at();

drop trigger if exists teams_touch_updated_at on public.teams;
create trigger teams_touch_updated_at before update on public.teams for each row execute function public.touch_updated_at();

drop trigger if exists players_touch_updated_at on public.players;
create trigger players_touch_updated_at before update on public.players for each row execute function public.touch_updated_at();

drop trigger if exists matches_touch_updated_at on public.matches;
create trigger matches_touch_updated_at before update on public.matches for each row execute function public.touch_updated_at();

drop trigger if exists awards_touch_updated_at on public.awards;
create trigger awards_touch_updated_at before update on public.awards for each row execute function public.touch_updated_at();

drop trigger if exists standings_touch_updated_at on public.standings;
create trigger standings_touch_updated_at before update on public.standings for each row execute function public.touch_updated_at();

drop trigger if exists leaderboards_touch_updated_at on public.leaderboards;
create trigger leaderboards_touch_updated_at before update on public.leaderboards for each row execute function public.touch_updated_at();

drop trigger if exists brackets_touch_updated_at on public.brackets;
create trigger brackets_touch_updated_at before update on public.brackets for each row execute function public.touch_updated_at();

drop trigger if exists command_receipts_touch_updated_at on public.command_receipts;
create trigger command_receipts_touch_updated_at before update on public.command_receipts for each row execute function public.touch_updated_at();

alter table public.tournament_settings enable row level security;
alter table public.sports enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.awards enable row level security;
alter table public.standings enable row level security;
alter table public.leaderboards enable row level security;
alter table public.brackets enable row level security;
alter table public.command_receipts enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.tournament_settings to anon, authenticated;
grant select on public.sports to anon, authenticated;
grant select on public.teams to anon, authenticated;
grant select on public.players to anon, authenticated;
grant select on public.matches to anon, authenticated;
grant select on public.awards to anon, authenticated;
grant select on public.standings to anon, authenticated;
grant select on public.leaderboards to anon, authenticated;
grant select on public.brackets to anon, authenticated;
grant all on public.tournament_settings to service_role;
grant all on public.sports to service_role;
grant all on public.teams to service_role;
grant all on public.players to service_role;
grant all on public.matches to service_role;
grant all on public.awards to service_role;
grant all on public.standings to service_role;
grant all on public.leaderboards to service_role;
grant all on public.brackets to service_role;
grant all on public.command_receipts to service_role;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'tournament_settings',
    'sports',
    'teams',
    'players',
    'matches',
    'awards',
    'standings',
    'leaderboards',
    'brackets',
    'command_receipts'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_read_all', table_name);
    execute format('create policy %I on public.%I for select using (true)', table_name || '_read_all', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_write_all', table_name);
    execute format('create policy %I on public.%I for all using (true) with check (true)', table_name || '_write_all', table_name);
  end loop;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tournament_settings;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.sports;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.teams;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.players;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.matches;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.awards;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.standings;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.leaderboards;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.brackets;
exception when duplicate_object then null;
end $$;
