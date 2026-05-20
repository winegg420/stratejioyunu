-- =============================================================================
-- Strateji Oyunu — Kalıcı oyun verisi (Supabase / PostgreSQL)
-- =============================================================================
-- Kaynak: src/data/gameInit.js, gameStore.js, combatEngine.js, spyEngine.js
-- Auth: src/lib/auth.js (auth.users + profiles)
--
-- Uygulama: Dashboard SQL Editor veya:
--   supabase db reset   (config.toml → schema_paths)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions & helpers
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Enums (oyundaki sabit kimliklerle uyumlu)
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.resource_id as enum (
    'food', 'fuel', 'metal', 'energy', 'money'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.unit_domain as enum ('land', 'air', 'sea');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.expedition_mode as enum (
    'attack', 'spy', 'found', 'trade', 'return'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.expedition_direction as enum ('outgoing', 'returning');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.expedition_status as enum (
    'active', 'completed', 'cancelled', 'recalled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_filter_type as enum ('battle', 'spy', 'trade');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 1) profiles — auth.users ile 1:1 oyuncu kaydı
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  player_name text not null,
  display_name text not null default 'Oyuncu',
  alliance_name text,
  rank_title text default 'Teğmen',
  rank_score bigint not null default 0 check (rank_score >= 0),
  server_id text not null default 'turkiye-1',
  active_city_id text,
  protection_ends_at timestamptz,
  player_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_player_name_len check (char_length(player_name) between 2 and 32),
  constraint profiles_player_name_format check (player_name ~ '^[A-Za-z0-9_\-]+$')
);

create unique index if not exists profiles_player_name_server_uidx
  on public.profiles (server_id, lower(player_name));

create index if not exists profiles_rank_score_idx
  on public.profiles (server_id, rank_score desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Yeni auth kaydı → profil satırı
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_name text;
  v_display_name text;
begin
  v_display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'player_name',
    split_part(new.email, '@', 1),
    'Oyuncu'
  );
  v_player_name := coalesce(
    new.raw_user_meta_data ->> 'player_name',
    split_part(new.email, '@', 1),
    'oyuncu'
  );

  insert into public.profiles (id, player_name, display_name)
  values (new.id, v_player_name, v_display_name)
  on conflict (id) do update set
    display_name = excluded.display_name,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2) cities — oyuncu üsleri (harita: lat/lng, oyun içi slug id)
-- ---------------------------------------------------------------------------
create table if not exists public.cities (
  id text not null,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  city_name text not null,
  province_code text,
  province_name text,
  city_type text,
  lat double precision not null,
  lng double precision not null,
  is_starter boolean not null default false,
  idle_spies integer not null default 0 check (idle_spies >= 0),
  idle_agents integer not null default 0 check (idle_agents >= 0),
  idle_population integer not null default 0 check (idle_population >= 0),
  population integer not null default 2400 check (population >= 0),
  happiness numeric(5, 2) not null default 72 check (happiness >= 0 and happiness <= 100),
  tax_rate numeric(4, 2) not null default 15 check (tax_rate >= 5 and tax_rate <= 45),
  cyber_effects jsonb not null default '[]'::jsonb,
  kbrn_effects jsonb not null default '[]'::jsonb,
  cbrn_quarantine boolean not null default false,
  last_tick_at timestamptz not null default timezone('utc', now()),
  construction_queue jsonb not null default '[]'::jsonb,
  production_queue jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (profile_id, id),
  constraint cities_coords_valid check (
    lat between -90 and 90 and lng between -180 and 180
  ),
  constraint cities_name_len check (char_length(city_name) between 1 and 64)
);

create index if not exists cities_profile_idx on public.cities (profile_id);
create index if not exists cities_last_tick_idx on public.cities (last_tick_at);

drop trigger if exists cities_set_updated_at on public.cities;
create trigger cities_set_updated_at
  before update on public.cities
  for each row execute function public.set_updated_at();

alter table public.profiles
  drop constraint if exists profiles_active_city_fkey;

alter table public.profiles
  add constraint profiles_active_city_fkey
  foreign key (id, active_city_id)
  references public.cities (profile_id, id)
  on delete set null
  deferrable initially deferred;

-- ---------------------------------------------------------------------------
-- 2b) city_resources — anlık depolar + üretim tick
-- ---------------------------------------------------------------------------
create table if not exists public.city_resources (
  city_id text not null,
  profile_id uuid not null,
  resource_id public.resource_id not null,
  current_amount numeric(18, 2) not null default 0 check (current_amount >= 0),
  max_amount numeric(18, 2),
  rate_display text,
  primary key (profile_id, city_id, resource_id),
  foreign key (profile_id, city_id)
    references public.cities (profile_id, id) on delete cascade
);

create index if not exists city_resources_city_idx
  on public.city_resources (profile_id, city_id);

-- ---------------------------------------------------------------------------
-- 3a) city_buildings — üs başına bina seviyeleri
--     (hq, farm, factory, barracks, intel, wall, …)
-- ---------------------------------------------------------------------------
create table if not exists public.city_buildings (
  city_id text not null,
  profile_id uuid not null,
  building_id text not null,
  level integer not null default 0 check (level >= 0),
  max_level integer,
  meta jsonb not null default '{}'::jsonb,
  primary key (profile_id, city_id, building_id),
  foreign key (profile_id, city_id)
    references public.cities (profile_id, id) on delete cascade,
  constraint city_buildings_id_check check (
    building_id in (
      'hq', 'farm', 'refinery', 'factory', 'depot', 'plant', 'tax',
      'barracks', 'airport', 'shipyard', 'intel', 'wall', 'market', 'research', 'cyber_ops'
    )
  )
);

-- ---------------------------------------------------------------------------
-- 3b) player_researches — global teknoloji (r1–r4, r3 casusluk)
-- ---------------------------------------------------------------------------
create table if not exists public.player_researches (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  research_id text not null,
  level integer not null default 0 check (level >= 0),
  max_level integer not null default 15 check (max_level > 0),
  is_active boolean not null default false,
  is_queued boolean not null default false,
  ends_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  primary key (profile_id, research_id),
  constraint player_researches_id_check check (
    research_id in ('r1', 'r2', 'r3', 'r4')
  )
);

-- ---------------------------------------------------------------------------
-- 4) city_units — kara / hava / deniz envanter (Siber-Gölge, Karasu APC, …)
-- ---------------------------------------------------------------------------
create table if not exists public.city_units (
  city_id text not null,
  profile_id uuid not null,
  unit_id text not null,
  domain public.unit_domain not null default 'land',
  quantity integer not null default 0 check (quantity >= 0),
  primary key (profile_id, city_id, unit_id),
  foreign key (profile_id, city_id)
    references public.cities (profile_id, id) on delete cascade,
  constraint city_units_id_check check (
    unit_id in (
      'infantry', 'armor', 'tank', 'airdefense', 'sniper', 'special', 'colonist',
      'scout', 'fighter', 'bomber', 'drone',
      'patrol', 'frigate', 'sub'
    )
  )
);

create index if not exists city_units_domain_idx
  on public.city_units (profile_id, city_id, domain);

-- ---------------------------------------------------------------------------
-- 5a) expeditions — haritada aktif seferler
-- ---------------------------------------------------------------------------
create table if not exists public.expeditions (
  id text primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  origin_city_id text not null,
  origin_city_name text,
  target_city_name text not null,
  source_map_city_name text,
  target_lat double precision,
  target_lng double precision,
  mode public.expedition_mode not null,
  expedition_type text not null,
  direction public.expedition_direction not null default 'outgoing',
  status public.expedition_status not null default 'active',
  troop_payload jsonb not null default '{}'::jsonb,
  trade_payload jsonb,
  troops_summary text,
  unit_count integer not null default 0 check (unit_count >= 0),
  distance_label text,
  distance_km numeric(10, 2),
  air_rush boolean not null default false,
  started_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds > 0),
  completed_at timestamptz,
  result jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (profile_id, origin_city_id)
    references public.cities (profile_id, id) on delete cascade,
  constraint expeditions_coords_valid check (
    (target_lat is null and target_lng is null)
    or (target_lat between -90 and 90 and target_lng between -180 and 180)
  )
);

create index if not exists expeditions_profile_active_idx
  on public.expeditions (profile_id, status, ends_at)
  where status = 'active';

drop trigger if exists expeditions_set_updated_at on public.expeditions;
create trigger expeditions_set_updated_at
  before update on public.expeditions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5b) game_reports — [ COMBAT LEDGER ], [ INTELLIGENCE REPORT ], ticaret
--     Tam rapor gövdesi JSONB (UI ile birebir)
-- ---------------------------------------------------------------------------
create table if not exists public.game_reports (
  id text primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  filter_type public.report_filter_type not null,
  report_type text not null,
  title text not null,
  preview text,
  report_date text,
  origin_city_id text,
  target_city_name text,
  winner text,
  is_read boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  foreign key (profile_id, origin_city_id)
    references public.cities (profile_id, id) on delete set null
);

create index if not exists game_reports_profile_created_idx
  on public.game_reports (profile_id, created_at desc);

create index if not exists game_reports_filter_idx
  on public.game_reports (profile_id, filter_type, created_at desc);

-- JSON indeksleri (ledger sorguları için isteğe bağlı)
create index if not exists game_reports_payload_gin_idx
  on public.game_reports using gin (payload jsonb_path_ops);

-- ---------------------------------------------------------------------------
-- Yardımcı: profil + şehir sahipliği (RLS)
-- ---------------------------------------------------------------------------
create or replace function public.owns_city(p_profile_id uuid, p_city_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cities c
    where c.profile_id = p_profile_id
      and c.id = p_city_id
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.city_resources enable row level security;
alter table public.city_buildings enable row level security;
alter table public.player_researches enable row level security;
alter table public.city_units enable row level security;
alter table public.expeditions enable row level security;
alter table public.game_reports enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

-- Sıralama: diğer oyuncuların kamuya açık alanları (ittifak, puan)
drop policy if exists profiles_select_leaderboard on public.profiles;
create policy profiles_select_leaderboard on public.profiles
  for select to authenticated
  using (true);

-- cities & children
drop policy if exists cities_all_own on public.cities;
create policy cities_all_own on public.cities
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists city_resources_all_own on public.city_resources;
create policy city_resources_all_own on public.city_resources
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists city_buildings_all_own on public.city_buildings;
create policy city_buildings_all_own on public.city_buildings
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists player_researches_all_own on public.player_researches;
create policy player_researches_all_own on public.player_researches
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists city_units_all_own on public.city_units;
create policy city_units_all_own on public.city_units
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists expeditions_all_own on public.expeditions;
create policy expeditions_all_own on public.expeditions
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists game_reports_all_own on public.game_reports;
create policy game_reports_all_own on public.game_reports
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Örnek: yeni oyuncu için başlangıç üssü (sunucu tarafı seed / edge function)
-- ---------------------------------------------------------------------------
create or replace function public.seed_starter_city(
  p_profile_id uuid,
  p_city_id text default 'izmir',
  p_city_name text default 'İzmir'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_profile_id is distinct from auth.uid()
     and current_setting('role', true) not in ('service_role', 'supabase_admin') then
    raise exception 'seed_starter_city: yetkisiz';
  end if;

  insert into public.cities (
    id, profile_id, city_name, province_code, province_name, city_type,
    lat, lng, is_starter, idle_spies, idle_agents, idle_population,
    population, happiness, tax_rate, cyber_effects, last_tick_at
  ) values (
    p_city_id, p_profile_id, p_city_name, '35', 'İzmir', 'Kıyı Şehri',
    38.42, 27.14, true, 0, 0, 1200, 12500, 72, 15, '[]'::jsonb, timezone('utc', now())
  )
  on conflict (profile_id, id) do nothing;

  insert into public.city_resources (profile_id, city_id, resource_id, current_amount, max_amount, rate_display)
  values
    (p_profile_id, p_city_id, 'food', 8000, 20000, '+42/sa'),
    (p_profile_id, p_city_id, 'fuel', 5000, 15000, '+28/sa'),
    (p_profile_id, p_city_id, 'metal', 6000, 18000, '+35/sa'),
    (p_profile_id, p_city_id, 'energy', 3000, null, '+18/sa'),
    (p_profile_id, p_city_id, 'money', 12000, 50000, '+55/sa')
  on conflict do nothing;

  insert into public.city_buildings (profile_id, city_id, building_id, level)
  values
    (p_profile_id, p_city_id, 'hq', 1),
    (p_profile_id, p_city_id, 'farm', 1),
    (p_profile_id, p_city_id, 'factory', 1),
    (p_profile_id, p_city_id, 'barracks', 1),
    (p_profile_id, p_city_id, 'airport', 1),
    (p_profile_id, p_city_id, 'shipyard', 1)
  on conflict do nothing;

  insert into public.player_researches (profile_id, research_id, level, is_active)
  values
    (p_profile_id, 'r1', 0, false),
    (p_profile_id, 'r2', 0, false),
    (p_profile_id, 'r3', 0, false),
    (p_profile_id, 'r4', 0, false)
  on conflict do nothing;

  insert into public.city_units (profile_id, city_id, unit_id, domain, quantity)
  values
    (p_profile_id, p_city_id, 'infantry', 'land', 40),
    (p_profile_id, p_city_id, 'armor', 'land', 0),
    (p_profile_id, p_city_id, 'tank', 'land', 0)
  on conflict do nothing;

  update public.profiles
  set active_city_id = p_city_id
  where id = p_profile_id and active_city_id is null;
end;
$$;

revoke all on function public.seed_starter_city(uuid, text, text) from public;
grant execute on function public.seed_starter_city(uuid, text, text) to authenticated;

comment on table public.profiles is
  'Oyuncu profili: auth.users ile 1:1, ittifak, sıralama puanı, VIP meta.';
comment on table public.cities is
  'Oyuncu üsleri. Koordinatlar harita ile uyumlu lat/lng. last_tick_at kaynak üretimi için.';
comment on table public.city_resources is
  'Üs depoları: food, fuel, metal, energy, money.';
comment on table public.city_buildings is
  'Üs binaları: hq, farm, barracks, intel vb. seviye.';
comment on table public.player_researches is
  'Global araştırma: r1 saldırı, r3 casusluk, r4 hava savunma.';
comment on table public.city_units is
  'Kara/hava/deniz birlik stoku (infantry=Siber-Gölge, armor=Karasu APC).';
comment on table public.expeditions is
  'Aktif seferler: Saldırı, Casusluk Sondası, Şehir Kur, ticaret.';
comment on table public.game_reports is
  'Raporlar: payload içinde combatLedger / intelLedger tam JSON.';
