import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  getDisplayName,
  getSession,
  onAuthStateChange,
  signInWithPassword,
  signOutSupabase,
} from '../lib/auth';

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
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);
  const [isDemo, setIsDemo] = useState(() => isDemoAuthed());
  const [playerName, setPlayerName] = useState(() =>
    isDemoAuthed() ? readDemoPlayerName() : 'Komutan_Alpha',
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (isSupabaseConfigured) {
        const existing = await getSession();
        if (!cancelled && existing) {
          setSession(existing);
          setPlayerName(getDisplayName(existing.user));
          setIsDemo(false);
          clearDemoAuth();
        }
      } else if (!cancelled && isDemoAuthed()) {
        setIsDemo(true);
        setPlayerName(readDemoPlayerName());
      }

      if (!cancelled) setAuthReady(true);
    }

    init();

    const { data } = onAuthStateChange((_event, nextSession) => {
      if (cancelled) return;
      setSession(nextSession);
      if (nextSession) {
        setIsDemo(false);
        clearDemoAuth();
        setPlayerName(getDisplayName(nextSession.user));
      }
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const loginDemo = useCallback((name = 'Oyuncu') => {
    const displayName = setDemoAuth(name);
    setSession(null);
    setIsDemo(true);
    setPlayerName(displayName);
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
    setPlayerName(getDisplayName(nextSession?.user));
    return { mode: 'supabase' };
  }, [loginDemo]);

  const logout = useCallback(async () => {
    clearDemoAuth();
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
      login: loginDemo,
      logout,
    }),
    [authReady, session, isDemo, playerName, loginDemo, signIn, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
}
