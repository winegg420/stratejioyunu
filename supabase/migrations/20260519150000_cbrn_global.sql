alter table public.cities
  add column if not exists cbrn_quarantine boolean not null default false;
