import { getVipBadgeForTier } from './vipPrestige';
import { getCurrentPlayerName } from './playerIdentity';

const META_KEY_PREFIX = 'strateji_player_meta_';

export function createDefaultPlayerMeta() {
  return {
    vipTier: 0,
    badges: [],
    totalAscensions: 0,
    lastActiveAt: Date.now(),
    diamonds: 30,
  };
}

export function loadPlayerMeta(playerName = getCurrentPlayerName()) {
  if (typeof window === 'undefined') return createDefaultPlayerMeta();
  try {
    const raw = localStorage.getItem(`${META_KEY_PREFIX}${playerName}`);
    if (!raw) return createDefaultPlayerMeta();
    return { ...createDefaultPlayerMeta(), ...JSON.parse(raw) };
  } catch {
    return createDefaultPlayerMeta();
  }
}

export function savePlayerMeta(meta, playerName = getCurrentPlayerName()) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${META_KEY_PREFIX}${playerName}`, JSON.stringify(meta));
}

export function applyVipAscensionToMeta(meta) {
  const nextTier = (meta.vipTier ?? 0) + 1;
  const badge = getVipBadgeForTier(nextTier);
  const badges = meta.badges?.includes(badge) ? meta.badges : [...(meta.badges ?? []), badge];

  return {
    ...meta,
    vipTier: nextTier,
    badges,
    totalAscensions: (meta.totalAscensions ?? 0) + 1,
    lastAscensionAt: Date.now(),
  };
}
