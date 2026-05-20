alter table public.cities
  add column if not exists kbrn_effects jsonb not null default '[]'::jsonb;
