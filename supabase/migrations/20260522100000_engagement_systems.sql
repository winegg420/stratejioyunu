-- Sezon, günlük görev ve istihbarat takip verileri player_meta JSON içinde tutulur.
-- Bu migration dokümantasyon ve opsiyonel indeks içindir.

comment on column public.profiles.player_meta is
  'Oyun meta: VIP, kriz, daily_quests, watchlist, season_engagement, season_stats, cosmetic_titles, intel_feed';
