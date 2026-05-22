import { createClient } from '@supabase/supabase-js';

function sanitizeEnv(value) {
  if (value == null) return '';
  return String(value).trim().replace(/^["']|["']$/g, '');
}

const supabaseUrl = sanitizeEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = sanitizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

if (supabaseAnonKey && !/^[\x00-\xff]*$/.test(supabaseAnonKey)) {
  console.error(
    '[supabase] VITE_SUPABASE_ANON_KEY gecersiz karakter iceriyor (Turkce harf/bosluk olmamali). .env dosyasini kontrol edin.',
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
