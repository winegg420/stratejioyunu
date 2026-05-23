import { useMemo } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getCurrentPlayerName } from '../lib/playerIdentity';

/** Gelen saldırı / yağma / casus seferi — tüm üsler için */
export function useIncomingThreat() {
  const playerName = getCurrentPlayerName();
  const playerCities = useGameStore((s) => s.playerCities);
  const expeditions = useGameStore((s) => s.expeditions);
  const incomingAttacks = useGameStore((s) => s.incomingAttacks);

  return useMemo(() => {
    const ownNames = new Set(playerCities.map((c) => c.name));
    const ownIds = new Set(playerCities.map((c) => c.id));

    if ((incomingAttacks ?? []).some((a) => ownIds.has(a.targetCityId))) {
      return true;
    }

    for (const exp of expeditions ?? []) {
      if (exp.direction !== 'outgoing') continue;
      const hitsUs = ownNames.has(exp.target) || ownIds.has(exp.targetCityId);
      if (!hitsUs) continue;
      if (exp.player === playerName) continue;
      if (exp.mode === 'attack' || exp.mode === 'spy' || exp.mode === 'cyber') return true;
      const type = String(exp.type ?? '').toLowerCase();
      if (type.includes('saldır') || type.includes('fetih') || type.includes('yağma')) return true;
    }

    return false;
  }, [playerCities, expeditions, incomingAttacks, playerName]);
}
