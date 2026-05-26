import { useGameStore } from '../stores/gameStore';

const PLAYER_KEY = 'strateji_player_name';
const GENERIC = 'Oyuncu';

function readStoredName() {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(PLAYER_KEY)?.trim();
  if (stored && stored !== GENERIC) return stored;
  return null;
}

export function getCurrentPlayerName() {
  if (typeof window === 'undefined') return 'Komutan_Alpha';

  const state = useGameStore?.getState?.();
  if (!state) return readStoredName() || 'Komutan_Alpha';
  const fromStore = state.profileDisplayName?.trim() || state.profilePlayerName?.trim();
  if (fromStore && fromStore !== GENERIC) return fromStore;

  return readStoredName() || 'Komutan_Alpha';
}
