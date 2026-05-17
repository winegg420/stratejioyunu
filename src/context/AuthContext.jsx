import { createContext, useContext, useMemo, useState } from 'react';

const AUTH_KEY = 'strateji_auth_demo';
const PLAYER_KEY = 'strateji_player_name';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(AUTH_KEY) === '1',
  );
  const [playerName, setPlayerName] = useState(
    () => (typeof window !== 'undefined' && localStorage.getItem(PLAYER_KEY)) || 'Komutan_Alpha',
  );

  const value = useMemo(
    () => ({
      isAuthed,
      playerName,
      login: (name = 'Oyuncu') => {
        const displayName = name.trim() || 'Oyuncu';
        localStorage.setItem(AUTH_KEY, '1');
        localStorage.setItem(PLAYER_KEY, displayName);
        setPlayerName(displayName);
        setIsAuthed(true);
      },
      logout: () => {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(PLAYER_KEY);
        setIsAuthed(false);
      },
    }),
    [isAuthed, playerName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
}
