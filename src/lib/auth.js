import { supabase, isSupabaseConfigured } from './supabase';

/** E-posta/şifre ile kayıt açık (Gmail OAuth ayrı). */
export const SIGNUP_ENABLED = true;

const AUTH_EMAIL_DOMAIN = 'players.stratejioyunu.local';

const AUTH_ERROR_MESSAGES = {
  'Invalid login credentials': 'Oyuncu ID veya şifre hatalı.',
  'Email not confirmed': 'E-posta henüz doğrulanmadı. Gelen kutunuzu kontrol edin.',
  'User not found': 'Bu oyuncu ID ile kayıtlı hesap bulunamadı.',
  'User already registered': 'Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin.',
  'Signup requires a valid password': 'Şifre en az 6 karakter olmalı.',
};

export function resolveAuthEmail(playerId) {
  const id = playerId.trim().toLowerCase();
  if (!id) return '';
  if (id.includes('@')) return id;
  const safe = id.replace(/[^a-z0-9._-]/g, '') || 'oyuncu';
  return `${safe}@${AUTH_EMAIL_DOMAIN}`;
}

/** @deprecated resolveAuthEmail kullanın */
export function toAuthEmail(playerId) {
  return resolveAuthEmail(playerId);
}

/** Auth kullanıcısından görünen ad — username, display_name, e-posta öneki. */
export function getDisplayName(user) {
  if (!user) return 'Oyuncu';

  const username = user.user_metadata?.username?.trim();
  if (username && username.toLowerCase() !== 'oyuncu') return username;

  const metaName = user.user_metadata?.display_name?.trim()
    || user.user_metadata?.player_name?.trim();
  if (metaName && metaName.toLowerCase() !== 'oyuncu') return metaName;

  const email = user.email?.trim();
  if (email?.includes('@')) {
    const [local, domain] = email.split('@');
    const emailLocal = local?.trim();
    if (emailLocal) {
      if (domain === AUTH_EMAIL_DOMAIN) {
        const formatted = emailLocal.replace(/[._-]+/g, ' ').trim() || emailLocal;
        if (formatted.toLowerCase() !== 'oyuncu') return formatted;
      } else {
        const isSynthetic = emailLocal.endsWith('.stratejioyunu.local');
        if (!isSynthetic) {
          const formatted = emailLocal.replace(/[._-]+/g, ' ').trim() || emailLocal;
          if (formatted.toLowerCase() !== 'oyuncu') return formatted;
        }
      }
    }
  }

  const idHint = user.id?.replace(/-/g, '').slice(0, 8);
  if (idHint) return `Komutan_${idHint}`;

  return 'Oyuncu';
}

/** Oturum kullanıcısını taze meta ile getir (profil başlığı vb.). */
export async function getAuthUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.warn('[auth] getUser', error);
    return null;
  }
  return data.user ?? null;
}

function mapAuthError(error) {
  if (!error?.message) return 'Giriş başarısız. Lütfen tekrar deneyin.';
  return AUTH_ERROR_MESSAGES[error.message] || error.message;
}

export async function signInWithPassword(playerId, password) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase yapılandırılmamış. .env dosyasına anahtarları ekleyin veya Hızlı Giriş kullanın.');
  }

  const email = resolveAuthEmail(playerId);
  if (!email) {
    throw new Error('Oyuncu ID veya e-posta girin.');
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

  const pwd = String(password ?? '').trim();
  if (pwd.length < 6) {
    throw new Error('Şifre en az 6 karakter olmalı.');
  }

  const rawId = playerId.trim();
  const email = resolveAuthEmail(rawId);
  const label = displayName?.trim() || rawId.split('@')[0] || 'Oyuncu';

  const { data, error } = await supabase.auth.signUp({
    email,
    password: pwd,
    options: {
      data: {
        username: rawId.split('@')[0] || label,
        display_name: label,
        player_name: label,
      },
    },
  });

  if (error) throw new Error(mapAuthError(error));
  return data;
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase yapılandırılmamış. Hızlı Giriş kullanın.');
  }

  const redirectTo = `${window.location.origin}/giris`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { prompt: 'select_account' },
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
