import { useGameStore } from '../stores/gameStore';
import { saveGameStateNow } from './supabaseSync';

/** Store aksiyonundan sonra Supabase kaydını tamamlar (veya offline ise atlar). */
export async function flushGameSave(options = {}) {
  const state = useGameStore.getState();
  if (!state._supabaseHydrated) return { ok: true, skipped: true };
  const cityId = options.cityId ?? state.activeCityId;
  return saveGameStateNow(state, { cityId, ...options });
}
