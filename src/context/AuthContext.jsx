import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  getDisplayName,
  getSession,
  onAuthStateChange,
  signInWithGoogle,
  signInWithPassword,
  signOutSupabase,
  signUp,
} from '../lib/auth';
import { stopSyncPolling } from '../lib/supabaseSync';
import { fetchUserProfile, resolvePlayerDisplayName, resolveProfileIsAdmin } from '../lib/profileApi';
import { isGameAdmin } from '../lib/adminAccess';
import { useGameStore } from '../stores/gameStore';
import { PAGE_SESSION_TIMEOUT_MS } from '../components/PageSessionGate';
import { refreshSessionIfNeeded, startSessionKeeper } from '../lib/sessionKeeper';

const PLAYER_IDENTITY_KEY = 'strateji_player_name';

function syncPlayerIdentityKeys(displayName, playerName) {
  if (typeof window === 'undefined') return;
  const label = displayName?.trim() || playerName?.trim();
  if (label) localStorage.setItem(PLAYER_IDENTITY_KEY, label);
}

const AUTH_KEY = 'strateji_auth_demo';
const PLAYER_KEY = 'strateji_player_name';

const AuthContext = createContext(null);

function readDemoPlayerName() {
  if (typeof window === 'undefined') return 'Komutan_Alpha';
  return localStorage.getItem(PLAYER_KEY) || 'Komutan_Alpha';
}

function isDemoAuthed() {
  return typeof window !== 'undefined' && localStorage.getItem(AUTH_KEY) === '1';
}

function clearDemoAuth() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(PLAYER_KEY);
}

function setDemoAuth(name) {
  const displayName = name.trim() || 'Oyuncu';
  localStorage.setItem(AUTH_KEY, '1');
  localStorage.setItem(PLAYER_KEY, displayName);
  return displayName;
}

export function AuthProvider({ children }) {
  const [authReady, setAuthReady] = useState(() => {
    if (typeof window === 'undefined') return false;
    return isDemoAuthed() && !isSupabaseConfigured;
  });
  const [session, setSession] = useState(null);
  const [isDemo, setIsDemo] = useState(() => isDemoAuthed());
  const [playerName, setPlayerName] = useState(() =>
    isDemoAuthed() ? readDemoPlayerName() : 'Komutan_Alpha',
  );
  const hydratedUserRef = useRef(null);

  const applyProfileIdentity = useCallback((user, profile) => {
    const displayName = resolvePlayerDisplayName({
      profile,
      user,
      playerName: getDisplayName(user),
    });
    setPlayerName(displayName);
    syncPlayerIdentityKeys(displayName, profile?.player_name);
    useGameStore.setState({
      profileDisplayName: displayName,
      profilePlayerName: profile?.player_name?.trim() || displayName,
    });
    const isAdmin = resolveProfileIsAdmin(profile, user);
    if (isAdmin) {
      useGameStore.setState({ isAdminUser: true });
    }
  }, []);

  const hydrateGameForUser = useCallback(async (user) => {
    if (!user?.id) return;
    if (hydratedUserRef.current === user.id) return;

    const profile = await fetchUserProfile(user.id);
    applyProfileIdentity(user, profile);

    const fallbackName = resolvePlayerDisplayName({
      profile,
      user,
      playerName: getDisplayName(user),
    });
    const result = await useGameStore.getState().hydrateFromSupabase(user.id, fallbackName);
    if (result?.ok) {
      hydratedUserRef.current = user.id;
      if (result.displayName) {
        setPlayerName(result.displayName);
        syncPlayerIdentityKeys(result.displayName, result.playerName);
      }
      if (result.isAdminUser) {
        useGameStore.setState({ isAdminUser: true });
      }
    }
  }, [applyProfileIdentity]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let hydrateUser = null;
      try {
        if (isSupabaseConfigured) {
          const existing = await Promise.race([
            getSession(),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Oturum zaman aşımı')), 14000);
            }),
          ]);
          if (!cancelled && existing) {
            setSession(existing);
            setIsDemo(false);
            clearDemoAuth();
            hydrateUser = existing.user;
            const profile = await fetchUserProfile(existing.user.id);
            if (!cancelled) applyProfileIdentity(existing.user, profile);
          } else if (!cancelled && isDemoAuthed()) {
            setIsDemo(true);
            setPlayerName(readDemoPlayerName());
          }
        } else if (!cancelled && isDemoAuthed()) {
          setIsDemo(true);
          setPlayerName(readDemoPlayerName());
        }
      } catch (err) {
        console.warn('Oturum başlatılamadı, demo moda geçiliyor:', err);
        if (!cancelled && isDemoAuthed()) {
          setIsDemo(true);
          setPlayerName(readDemoPlayerName());
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }

      if (!cancelled && hydrateUser) {
        hydrateGameForUser(hydrateUser).catch((err) => {
          console.warn('[auth] Supabase hydrate arka planda başarısız', err);
        });
      }
    }

    init();

    const { data } = onAuthStateChange((event, nextSession) => {
      if (cancelled) return;
      setAuthReady(true);
      if (nextSession?.user) {
        setSession(nextSession);
        setIsDemo(false);
        clearDemoAuth();
        const userId = nextSession.user.id;
        const shouldHydrate = event === 'SIGNED_IN'
          || event === 'INITIAL_SESSION'
          || hydratedUserRef.current !== userId;
        if (shouldHydrate) {
          if (event !== 'TOKEN_REFRESHED') {
            hydratedUserRef.current = null;
          }
          hydrateGameForUser(nextSession.user);
        }
        return;
      }
      if (event === 'SIGNED_OUT') {
        hydratedUserRef.current = null;
        stopSyncPolling();
        useGameStore.setState({
          _supabaseHydrated: false,
          profileDisplayName: null,
          profilePlayerName: null,
          isAdminUser: false,
          authEmail: null,
        });
        setSession(null);
        return;
      }
      if (!nextSession && event !== 'SIGNED_OUT') {
        refreshSessionIfNeeded().catch(() => {});
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [hydrateGameForUser, applyProfileIdentity]);

  useEffect(() => {
    const unlock = window.setTimeout(() => setAuthReady(true), PAGE_SESSION_TIMEOUT_MS);
    return () => window.clearTimeout(unlock);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    return startSessionKeeper();
  }, []);

  const loginDemo = useCallback((name = 'Oyuncu') => {
    hydratedUserRef.current = null;
    stopSyncPolling();
    useGameStore.setState({ _supabaseHydrated: false });
    const displayName = setDemoAuth(name);
    setSession(null);
    setIsDemo(true);
    setPlayerName(displayName);
    setAuthReady(true);
    signOutSupabase();
  }, []);

  const signIn = useCallback(async (playerId, password) => {
    const id = playerId.trim();
    const pwd = password.trim();

    if (!pwd) {
      loginDemo(id || 'Oyuncu');
      return { mode: 'demo' };
    }

    if (!isSupabaseConfigured) {
      loginDemo(id || 'Oyuncu');
      return { mode: 'demo' };
    }

    const data = await signInWithPassword(id, pwd);
    const nextSession = data.session;
    setSession(nextSession);
    setIsDemo(false);
    clearDemoAuth();
    hydratedUserRef.current = null;
    if (nextSession?.user) {
      await hydrateGameForUser(nextSession.user);
    }
    setAuthReady(true);
    return { mode: 'supabase' };
  }, [loginDemo, hydrateGameForUser]);

  const register = useCallback(async (playerId, password, displayName) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase yapılandırılmamış.');
    }
    const data = await signUp(playerId, password, displayName);
    const nextSession = data.session;
    if (nextSession?.user) {
      setSession(nextSession);
      setIsDemo(false);
      clearDemoAuth();
      hydratedUserRef.current = null;
      await hydrateGameForUser(nextSession.user);
      return { mode: 'supabase', needsEmailConfirm: false };
    }
    setAuthReady(true);
    return { mode: 'supabase', needsEmailConfirm: true };
  }, [hydrateGameForUser]);

  const loginWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase yapılandırılmamış. Hızlı Giriş kullanın.');
    }
    await signInWithGoogle();
    return { mode: 'oauth' };
  }, []);

  const logout = useCallback(async () => {
    clearDemoAuth();
    hydratedUserRef.current = null;
    stopSyncPolling();
    useGameStore.setState({
      _supabaseHydrated: false,
      profileDisplayName: null,
      profilePlayerName: null,
      isAdminUser: false,
      authEmail: null,
    });
    setSession(null);
    setIsDemo(false);
    setPlayerName('Komutan_Alpha');
    await signOutSupabase();
  }, []);

  const value = useMemo(
    () => ({
      authReady,
      isAuthed: Boolean(session) || isDemo,
      authMode: session ? 'supabase' : isDemo ? 'demo' : null,
      session,
      playerName,
      isSupabaseConfigured,
      loginDemo,
      signIn,
      register,
      loginWithGoogle,
      login: loginDemo,
      logout,
    }),
    [authReady, session, isDemo, playerName, loginDemo, signIn, register, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
}
