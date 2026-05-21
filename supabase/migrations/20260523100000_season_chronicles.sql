-- Devlet Tarih Kitabı — küresel sezon kronikleri
create table if not exists public.season_chronicles (
  id uuid primary key default gen_random_uuid(),
  server_id text not null default 'turkiye-1',
  season_id text not null,
  chronicle_type text not null check (
    chronicle_type in ('war', 'regime', 'betrayal')
  ),
  occurred_at timestamptz not null,
  headline text not null,
  body text not null,
  actors jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists season_chronicles_server_season_idx
  on public.season_chronicles (server_id, season_id, occurred_at desc);

create index if not exists season_chronicles_type_idx
  on public.season_chronicles (chronicle_type, occurred_at desc);

alter table public.season_chronicles enable row level security;

drop policy if exists season_chronicles_read on public.season_chronicles;
create policy season_chronicles_read on public.season_chronicles
  for select to authenticated
  using (true);

drop policy if exists season_chronicles_insert on public.season_chronicles;
create policy season_chronicles_insert on public.season_chronicles
  for insert to authenticated
  with check (true);

comment on table public.season_chronicles is
  'Devlet Tarih Kitabı — savaş, rejim ve ihanet kronikleri (sunucu geneli)';
