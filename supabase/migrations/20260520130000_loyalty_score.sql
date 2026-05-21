-- İdeoloji Sadakat Puanı — küresel sıralama
alter table public.profiles
  add column if not exists loyalty_score bigint not null default 0;

alter table public.profiles
  drop constraint if exists profiles_loyalty_score_nonneg;

alter table public.profiles
  add constraint profiles_loyalty_score_nonneg check (loyalty_score >= 0);

create index if not exists profiles_loyalty_score_idx
  on public.profiles (server_id, loyalty_score desc);
