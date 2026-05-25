-- Savunma envanteri ve kuyruk (şehir bazlı JSONB)
alter table public.cities
  add column if not exists defense_inventory jsonb not null default '{}'::jsonb,
  add column if not exists defense_queue jsonb not null default '[]'::jsonb;

comment on column public.cities.defense_inventory is 'Savunma sistemleri: { systemId: { count, level } }';
comment on column public.cities.defense_queue is 'Savunma üretim / kademe kuyruğu';
