-- Dünya şehir mimarisi: il/ilçe, Ana Merkez rolü, game_config

alter table public.cities
  add column if not exists district text,
  add column if not exists city_role text not null default 'colony'
    check (city_role in ('main_hq', 'colony')),
  add column if not exists is_unlosable boolean not null default false;

comment on column public.cities.district is 'İlçe adı — ilçe genişlemesi için rezerv';
comment on column public.cities.city_role is 'main_hq = Ana Merkez (kaybedilemez), colony = fethedilen koloni';
comment on column public.cities.is_unlosable is 'Ana Merkez: yalnızca yağmalanabilir, fethedilemez';

create table if not exists public.game_config (
  id uuid primary key default gen_random_uuid(),
  server_id text not null default 'turkiye-1',
  config_key text not null,
  config_value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (server_id, config_key)
);

create index if not exists game_config_server_idx on public.game_config (server_id);

drop trigger if exists game_config_set_updated_at on public.game_config;
create trigger game_config_set_updated_at
  before update on public.game_config
  for each row execute function public.set_updated_at();

alter table public.game_config enable row level security;

drop policy if exists game_config_read_all on public.game_config;
create policy game_config_read_all on public.game_config
  for select to authenticated, anon
  using (true);

-- Varsayılan yapılandırma
insert into public.game_config (server_id, config_key, config_value, description)
values
  (
    'turkiye-1',
    'player_open_provinces',
    '"all_inland"'::jsonb,
    'Oyuncuya açık başlangıç/kolonileşme illeri'
  ),
  (
    'turkiye-1',
    'coastal_bots_enabled',
    'true'::jsonb,
    '28 kıyı şehri bot kontrolü'
  ),
  (
    'turkiye-1',
    'capital_bot_enabled',
    'true'::jsonb,
    'Ankara bot başkent'
  ),
  (
    'turkiye-1',
    'max_active_world_slots',
    '52'::jsonb,
    'Aktif dünya şehir üst sınırı'
  )
on conflict (server_id, config_key) do nothing;
