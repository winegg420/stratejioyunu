-- expeditions realtime aboneliği "channel error" veriyordu: tablo supabase_realtime yayınında değildi.
do $$ begin
  alter publication supabase_realtime add table public.expeditions;
exception
  when duplicate_object then null;
  when undefined_object then
    create publication supabase_realtime for table public.expeditions;
end $$;
