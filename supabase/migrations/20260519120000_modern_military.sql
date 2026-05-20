-- Modern askeri strateji: nüfus, mutluluk, siber operasyon merkezi

alter table public.cities
  add column if not exists population integer not null default 2400 check (population >= 0);

alter table public.cities
  add column if not exists happiness numeric(5, 2) not null default 72 check (happiness >= 0 and happiness <= 100);

alter table public.cities
  add column if not exists tax_rate numeric(4, 2) not null default 15 check (tax_rate >= 5 and tax_rate <= 45);

alter table public.cities
  add column if not exists cyber_effects jsonb not null default '[]'::jsonb;

alter table public.city_buildings drop constraint if exists city_buildings_id_check;

alter table public.city_buildings add constraint city_buildings_id_check check (
  building_id in (
    'hq', 'farm', 'refinery', 'factory', 'depot', 'plant', 'tax',
    'barracks', 'airport', 'shipyard', 'intel', 'wall', 'market', 'research', 'cyber_ops'
  )
);
