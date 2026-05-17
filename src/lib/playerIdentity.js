const PLAYER_KEY = 'strateji_player_name';

export function getCurrentPlayerName() {
  if (typeof window === 'undefined') return 'Komutan_Alpha';
  return localStorage.getItem(PLAYER_KEY) || 'Komutan_Alpha';
}
