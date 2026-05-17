import { createContext, useContext, useMemo, useState } from 'react';

const AUTH_KEY = 'strateji_auth_demo';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(AUTH_KEY) === '1',
  );

  const value = useMemo(
    () => ({
      isAuthed,
      login: () => {
        localStorage.setItem(AUTH_KEY, '1');
        setIsAuthed(true);
      },
      logout: () => {
        localStorage.removeItem(AUTH_KEY);
        setIsAuthed(false);
      },
    }),
    [isAuthed],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth AuthProvider içinde kullanılmalı');
  return ctx;
}
