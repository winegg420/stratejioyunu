/**
 * Uzak Supabase'e migration SQL uygular.
 *
 * Gerekli (birini sağlayın):
 *   SUPABASE_DB_PASSWORD — Dashboard → Database → connection string şifresi
 *   veya SUPABASE_SERVICE_ROLE_KEY + DATABASE_URL
 *
 * Kullanım: npm run supabase:migrate
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const MIGRATION = resolve(
  root,
  'supabase/migrations/20260522120000_resource_metal_to_hammadde.sql',
);

const PROJECT_REF = 'pzxzjudmfajrruabpfmh';

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return vars;
}

async function runViaPg(password) {
  const { default: pg } = await import('pg');
  const host = `aws-0-eu-central-1.pooler.supabase.com`;
  const client = new pg.Client({
    host,
    port: 5432,
    database: 'postgres',
    user: `postgres.${PROJECT_REF}`,
    password,
    ssl: { rejectUnauthorized: false },
  });
  const sql = readFileSync(MIGRATION, 'utf8');
  await client.connect();
  try {
    await client.query(sql);
    console.log('✓ Migration SQL uygulandı (doğrudan Postgres)');
  } finally {
    await client.end();
  }
}

async function runViaRpc(serviceKey, url) {
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: metalRows, error: selErr } = await admin
    .from('city_resources')
    .select('*')
    .eq('resource_id', 'metal');
  if (selErr && !selErr.message?.includes('invalid input value')) {
    throw new Error(`city_resources okuma: ${selErr.message}`);
  }

  if (metalRows?.length) {
    for (const row of metalRows) {
      const { data: existing } = await admin
        .from('city_resources')
        .select('current_amount, max_amount')
        .eq('profile_id', row.profile_id)
        .eq('city_id', row.city_id)
        .eq('resource_id', 'hammadde')
        .maybeSingle();

      const payload = {
        profile_id: row.profile_id,
        city_id: row.city_id,
        resource_id: 'hammadde',
        current_amount:
          Number(existing?.current_amount ?? 0) + Number(row.current_amount ?? 0),
        max_amount: Math.max(
          Number(existing?.max_amount ?? 0),
          Number(row.max_amount ?? 0),
        ) || null,
        rate_display: row.rate_display,
      };

      const { error: upErr } = await admin
        .from('city_resources')
        .upsert(payload, { onConflict: 'profile_id,city_id,resource_id' });
      if (upErr) throw new Error(`hammadde upsert: ${upErr.message}`);

      await admin
        .from('city_resources')
        .delete()
        .eq('profile_id', row.profile_id)
        .eq('city_id', row.city_id)
        .eq('resource_id', 'metal');
    }
    console.log(`✓ ${metalRows.length} city_resources satırı metal → hammadde taşındı`);
  } else {
    console.log('✓ city_resources içinde metal satırı yok (veya enum zaten güncel)');
  }

  const { data: states } = await admin.from('server_admin_state').select('*');
  for (const st of states ?? []) {
    const parities = st.central_bank?.parities;
    if (!parities?.metal) continue;
    const next = {
      ...parities,
      hammadde: parities.hammadde ?? parities.metal,
    };
    delete next.metal;
    const { error } = await admin
      .from('server_admin_state')
      .update({
        central_bank: { ...st.central_bank, parities: next },
      })
      .eq('server_id', st.server_id);
    if (error) console.warn(`server_admin_state ${st.server_id}: ${error.message}`);
    else console.log(`✓ Merkez bankası pariteleri güncellendi (${st.server_id})`);
  }
}

async function main() {
  const env = {
    ...loadEnvFile(resolve(root, '.env')),
    ...loadEnvFile(resolve(root, '.env.supabase')),
    ...process.env,
  };

  const password = env.SUPABASE_DB_PASSWORD;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const url = env.VITE_SUPABASE_URL;

  if (password) {
    await runViaPg(password);
    return;
  }

  if (serviceKey && url) {
    console.log('DB şifresi yok — service role ile veri migrasyonu…');
    await runViaRpc(serviceKey, url);
    console.log(
      '\nNot: Enum rename için Dashboard → SQL Editor\'da migration dosyasını da çalıştırın.',
    );
    return;
  }

  console.error(`
Supabase migration için kimlik bilgisi gerekli.

.env.supabase dosyasına ekleyin (Dashboard → Settings → API / Database):
  SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
veya
  SUPABASE_DB_PASSWORD=veritabani_sifreniz

Sonra: npm run supabase:migrate
`);
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
