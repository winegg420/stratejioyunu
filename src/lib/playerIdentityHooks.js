import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';

import { isDemoOrPlaceholderPlayerName } from './playerIdentity';

const PLAYER_KEY = 'strateji_player_name';
const GENERIC = 'Oyuncu';

function readStoredName() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(PLAYER_KEY)?.trim();
  if (stored && !isDemoOrPlaceholderPlayerName(stored)) return stored;
  return null;
}

function resolveNameFromState(state) {
  if (!state) return null;
  if (state._supabaseHydrated) {
    const fromStore = state.profileDisplayName?.trim() || state.profilePlayerName?.trim();
    if (fromStore && !isDemoOrPlaceholderPlayerName(fromStore)) return fromStore;
  }
  return readStoredName();
}

/** Supabase profil adı gelince re-render olabilsin diye hook. */
export function usePlayerDisplayName() {
  const profileDisplayName = useGameStore((s) => s.profileDisplayName);
  const profilePlayerName = useGameStore((s) => s.profilePlayerName);
  const hydrated = useGameStore((s) => s._supabaseHydrated);

  return useMemo(() => {
    const state = {
      profileDisplayName,
      profilePlayerName,
      _supabaseHydrated: hydrated,
    };
    return resolveNameFromState(state) || GENERIC;
  }, [profileDisplayName, profilePlayerName, hydrated]);
}

