/**
 * Supabase "strateji oyunu" projesini yerel .env ile bağlar.
 *
 * Kullanım:
 *   npm run supabase:connect -- <PROJECT_URL> <ANON_KEY> [SERVICE_ROLE_KEY]
 *
 * veya .env.supabase dosyası oluşturup:
 *   npm run supabase:connect
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, '.env');
const envSupabasePath = resolve(root, '.env.supabase');

const TEST_EMAIL = 'komutan@players.stratejioyunu.local';
const TEST_PASSWORD = 'Strateji2026!';
const TEST_DISPLAY = 'Komutan_Alpha';

function loadFromEnvSupabaseFile() {
  if (!existsSync(envSupabasePath)) return null;
  const lines = readFileSync(envSupabasePath, 'utf8').split('\n');
  const vars = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return vars;
}

function writeEnv(url, anonKey) {
  const content = `# Supabase — strateji oyunu projesi (otomatik oluşturuldu)
VITE_SUPABASE_URL=${url}
VITE_SUPABASE_ANON_KEY=${anonKey}
`;
  writeFileSync(envPath, content, 'utf8');
  console.log('✓ .env dosyası güncellendi');
}

async function testConnection(url, anonKey) {
  const client = createClient(url, anonKey);
  const { error } = await client.auth.getSession();
  if (error && !error.message?.includes('session')) {
    throw new Error(`Bağlantı hatası: ${error.message}`);
  }
  console.log('✓ Supabase API erişilebilir');
}

async function ensureTestUser(url, serviceKey) {
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const exists = list?.users?.some((u) => u.email === TEST_EMAIL);

  if (exists) {
    console.log(`✓ Test kullanıcısı zaten var: ${TEST_EMAIL}`);
    return;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: TEST_DISPLAY,
      player_name: TEST_DISPLAY,
    },
  });

  if (error) throw new Error(`Test kullanıcısı oluşturulamadı: ${error.message}`);
  console.log(`✓ Test kullanıcısı oluşturuldu: ${data.user?.email}`);
  console.log(`  Oyuncu ID: komutan  veya  ${TEST_EMAIL}`);
  console.log(`  Şifre: ${TEST_PASSWORD}`);
}

async function main() {
  const fileVars = loadFromEnvSupabaseFile();
  const url = process.argv[2] || fileVars?.VITE_SUPABASE_URL;
  const anonKey = process.argv[3] || fileVars?.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.argv[4] || fileVars?.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    console.log(`
Supabase anahtarları gerekli.

1) https://supabase.com/dashboard → "strateji oyunu" projesi
2) Project Settings → API
3) Şunları kopyalayın: Project URL, anon public key

Yöntem A — komut satırı:
  npm run supabase:connect -- "https://XXXX.supabase.co" "eyJhbG...anon..." "eyJhbG...service..."

Yöntem B — dosya:
  .env.supabase.example dosyasını .env.supabase olarak kopyalayın, doldurun, sonra:
  npm run supabase:connect

Dashboard (Authentication → URL Configuration):
  Site URL: https://stratejioyunu.vercel.app
  Redirect URLs:
    http://localhost:5173
    https://stratejioyunu.vercel.app

Vercel → Settings → Environment Variables (Production):
  VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
`);
    process.exit(1);
  }

  if (!url.includes('supabase.co')) {
    console.error('Geçersiz Project URL. Örnek: https://abcdefgh.supabase.co');
    process.exit(1);
  }

  writeEnv(url, anonKey);
  await testConnection(url, anonKey);

  if (serviceKey) {
    await ensureTestUser(url, serviceKey);
  } else {
    console.log('\nİpucu: Service role key ile test kullanıcısı oluşturmak için 3. argümanı ekleyin.');
  }

  console.log('\nTamam. npm run dev ile giriş ekranında şifreyle test edebilirsiniz.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
