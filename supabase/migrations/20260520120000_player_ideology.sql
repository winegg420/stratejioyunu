-- Jeopolitik ideoloji — profiles.ideology + koruma penceresi

do $$ begin
  create type public.player_ideology as enum (
    'socialist',
    'capitalist',
    'technocrat',
    'nationalist'
  );
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists ideology public.player_ideology;

comment on column public.profiles.ideology is
  'Oyuncu siyasi ideolojisi: socialist | capitalist | technocrat | nationalist';

-- Yeni hesaplar: 7 gün koruma + ideoloji değiştirme penceresi
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
  set
    active_city_id = coalesce(active_city_id, p_city_id),
    protection_ends_at = coalesce(
      protection_ends_at,
      timezone('utc', now()) + interval '7 days'
    )
  where id = p_profile_id;
end;
$$;
