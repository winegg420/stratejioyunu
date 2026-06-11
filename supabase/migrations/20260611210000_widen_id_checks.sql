-- Frontend katalogları büyüdü; DB id kısıtları geride kaldı ve saveGameState 23514 ile düşüyordu.
-- Binalar: + ai_center · Araştırmalar: + r5..r12 (kbrn_* eski satırlar için korunur)

alter table public.city_buildings drop constraint if exists city_buildings_id_check;
alter table public.city_buildings add constraint city_buildings_id_check check (
  building_id in (
    'hq', 'farm', 'refinery', 'factory', 'depot', 'plant', 'tax',
    'barracks', 'airport', 'shipyard', 'intel', 'wall', 'market', 'research',
    'cyber_ops', 'ai_center'
  )
);

alter table public.player_researches drop constraint if exists player_researches_id_check;
alter table public.player_researches add constraint player_researches_id_check check (
  research_id in (
    'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10', 'r11', 'r12',
    'kbrn_weapon', 'kbrn_decon', 'kbrn_detect', 'kbrn_chem'
  )
);
