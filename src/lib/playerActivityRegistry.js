import { getCurrentPlayerName } from './playerIdentity';

const REGISTRY_KEY = 'strateji_player_activity_registry';

const INACTIVE_MS = 14 * 24 * 60 * 60 * 1000;

function readRegistry() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeRegistry(registry) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

/** Haritadaki sahipleri kayıt defterine işler (demo dünya simülasyonu). */
export function syncRegistryFromMap(mapCities, now = Date.now()) {
  const registry = readRegistry();
  const current = getCurrentPlayerName();
  let changed = false;

  for (const city of mapCities ?? []) {
    const owner = city.owner;
    if (!owner || owner === current) continue;
    if (city.status === 'bot' || city.status === 'empty') continue;

    if (!registry[owner]) {
      registry[owner] = {
        lastActiveAt: now - INACTIVE_MS - 24 * 60 * 60 * 1000,
        seeded: true,
      };
      changed = true;
    }
  }

  if (changed) writeRegistry(registry);
  return registry;
}

export function touchPlayerActivity(playerName = getCurrentPlayerName(), now = Date.now()) {
  const registry = readRegistry();
  registry[playerName] = {
    ...registry[playerName],
    lastActiveAt: now,
    seeded: false,
  };
  writeRegistry(registry);
  return registry[playerName];
}

export function getInactiveOwners(now = Date.now()) {
  const registry = readRegistry();
  const current = getCurrentPlayerName();
  const inactive = [];

  for (const [owner, entry] of Object.entries(registry)) {
    if (owner === current) continue;
    const last = entry?.lastActiveAt ?? 0;
    if (now - last >= INACTIVE_MS) {
      inactive.push(owner);
    }
  }

  return inactive;
}

export const INACTIVITY_THRESHOLD_MS = INACTIVE_MS;
