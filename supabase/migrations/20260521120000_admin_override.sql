-- Admin müdahale: sunucu yayını + şeffaf loglar
create table if not exists public.server_broadcast (
  server_id text primary key default 'turkiye-1',
  central_bank jsonb not null default '{"fuelBasePrice":1,"parities":{"food":1,"fuel":1,"metal":1,"money":1,"energy":1}}'::jsonb,
  regional_incentive jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into public.server_broadcast (server_id, central_bank)
values ('turkiye-1', '{"fuelBasePrice":1,"parities":{"food":1,"fuel":1,"metal":1,"money":1,"energy":1}}'::jsonb)
on conflict (server_id) do nothing;

create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  server_id text not null default 'turkiye-1',
  actor_name text not null,
  action_type text not null,
  log_text text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_logs_server_created_idx
  on public.admin_logs (server_id, created_at desc);

alter table public.server_broadcast enable row level security;
alter table public.admin_logs enable row level security;

drop policy if exists server_broadcast_select_all on public.server_broadcast;
create policy server_broadcast_select_all on public.server_broadcast
  for select to authenticated
  using (true);

drop policy if exists server_broadcast_upsert_auth on public.server_broadcast;
create policy server_broadcast_upsert_auth on public.server_broadcast
  for all to authenticated
  using (true)
  with check (true);

drop policy if exists admin_logs_select_all on public.admin_logs;
create policy admin_logs_select_all on public.admin_logs
  for select to authenticated
  using (true);

drop policy if exists admin_logs_insert_auth on public.admin_logs;
create policy admin_logs_insert_auth on public.admin_logs
  for insert to authenticated
  with check (true);
