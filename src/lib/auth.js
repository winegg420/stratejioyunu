import { supabase, isSupabaseConfigured } from './supabase';

/** Gerçek kayıt henüz kapalı — yalnızca mevcut hesaplarla giriş. */
export const SIGNUP_ENABLED = false;

const AUTH_EMAIL_DOMAIN = 'players.stratejioyunu.local';

const AUTH_ERROR_MESSAGES = {
  'Invalid login credentials': 'Oyuncu ID veya şifre hatalı.',
  'Email not confirmed': 'E-posta henüz doğrulanmadı. Gelen kutunuzu kontrol edin.',
  'User not found': 'Bu oyuncu ID ile kayıtlı hesap bulunamadı.',
};

export function toAuthEmail(playerId) {
  const id = playerId.trim().toLowerCase();
  if (!id) return '';
  if (id.includes('@')) return id;
  const safe = id.replace(/[^a-z0-9._-]/g, '') || 'oyuncu';
  return `${safe}@${AUTH_EMAIL_DOMAIN}`;
}

export function getDisplayName(user) {
  if (!user) return 'Oyuncu';
  return (
    user.user_metadata?.display_name
    || user.user_metadata?.player_name
    || user.email?.split('@')[0]
    || 'Oyuncu'
  );
}

function mapAuthError(error) {
  if (!error?.message) return 'Giriş başarısız. Lütfen tekrar deneyin.';
  return AUTH_ERROR_MESSAGES[error.message] || error.message;
}

export async function signInWithPassword(playerId, password) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase yapılandırılmamış. .env dosyasına anahtarları ekleyin veya Hızlı Giriş kullanın.');
  }

  const email = toAuthEmail(playerId);
  if (!email) {
    throw new Error('Oyuncu ID girin veya Hızlı Giriş kullanın.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(mapAuthError(error));
  return data;
}

export async function signUp(playerId, password, displayName) {
  if (!SIGNUP_ENABLED) {
    throw new Error('Kayıt şu an aktif değil. Hızlı giriş ile oyuna devam edebilirsiniz.');
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase yapılandırılmamış.');
  }

  const email = toAuthEmail(playerId);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || playerId.trim() || 'Oyuncu',
        player_name: displayName || playerId.trim() || 'Oyuncu',
      },
    },
  });

  if (error) throw new Error(mapAuthError(error));
  return data;
}

export async function signOutSupabase() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange(callback);
}
