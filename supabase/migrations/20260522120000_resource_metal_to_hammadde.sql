-- Kaynak kimliği: metal → hammadde (enum + JSON pariteler)

do $$ begin
  alter type public.resource_id rename value 'metal' to 'hammadde';
exception
  when undefined_object then null;
  when duplicate_object then null;
end $$;

update public.server_admin_state
set central_bank = (
  central_bank
  - 'parities'
  || jsonb_build_object(
    'parities',
    (central_bank->'parities') - 'metal'
      || jsonb_build_object(
        'hammadde',
        coalesce(central_bank->'parities'->'hammadde', central_bank->'parities'->'metal', '1'::jsonb)
      )
  )
)
where central_bank->'parities' ? 'metal';
