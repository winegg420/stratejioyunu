import { parseUnitCost } from '../utils/resourceCosts';
import { formatSeconds, parseTimeToSeconds } from '../lib/gameUtils';

const RESOURCE_LABELS = {
  food: 'yemek',
  metal: 'metal',
  fuel: 'yakıt',
  money: 'para',
  energy: 'enerji',
};

/** Seviye bazlı inşaat / yükseltme maliyetleri ve süreleri. */
export const BUILDING_CATALOG = {
  hq: {
    levels: {
      1: { cost: '500 metal · 500 para', time: '00:08:00' },
    },
  },
  farm: {
    levels: {
      1: { cost: '250 metal · 200 yemek', time: '00:04:00' },
    },
  },
  refinery: {
    levels: {
      1: { cost: '350 metal · 150 yakıt', time: '00:05:00' },
    },
  },
  factory: {
    levels: {
      1: { cost: '400 metal · 200 yemek', time: '00:06:00' },
    },
  },
  depot: {
    levels: {
      1: { cost: '300 metal · 150 yemek', time: '00:05:00' },
    },
  },
  plant: {
    levels: {
      1: { cost: '450 metal · 200 enerji', time: '00:07:00' },
    },
  },
  tax: {
    levels: {
      1: { cost: '200 metal · 150 para', time: '00:04:00' },
    },
  },
  barracks: {
    levels: {
      1: { cost: '450 metal · 250 yemek', time: '00:08:00' },
    },
  },
  airport: {
    levels: {
      1: { cost: '800 metal · 350 yakıt', time: '00:15:00' },
    },
  },
  shipyard: {
    levels: {
      1: { cost: '650 metal · 300 yakıt', time: '00:12:00' },
    },
  },
  intel: {
    levels: {
      1: { cost: '400 metal · 250 para', time: '00:07:00' },
    },
  },
  wall: {
    levels: {
      1: { cost: '350 metal · 150 yemek', time: '00:06:00' },
    },
  },
  market: {
    levels: {
      1: { cost: '280 metal · 200 para', time: '00:05:00' },
    },
  },
  research: {
    levels: {
      1: { cost: '600 metal · 400 para', time: '00:10:00' },
    },
  },
  cyber_ops: {
    levels: {
      1: { cost: '2.200 metal · 1.400 enerji', time: '00:09:00' },
    },
  },
};

function scaleCostString(costStr, multiplier) {
  const parts = parseUnitCost(costStr);
  if (!parts.length) return costStr;
  return parts
    .map(({ resourceId, amount }) => {
      const label = RESOURCE_LABELS[resourceId] ?? resourceId;
      const scaled = Math.max(1, Math.round(amount * multiplier));
      return `${scaled.toLocaleString('tr-TR')} ${label}`;
    })
    .join(' · ');
}

function scaleTimeString(timeStr, multiplier) {
  const seconds = parseTimeToSeconds(timeStr);
  if (!seconds) return timeStr;
  return formatSeconds(seconds * multiplier);
}

/**
 * Bir sonraki seviye (level 0 → 1 dahil) inşaat maliyeti ve süresi.
 * @returns {{ cost: string, time: string, targetLevel: number } | null}
 */
export function resolveNextConstructionSpec(building) {
  if (!building?.id) return null;

  const currentLevel = building.level ?? 0;
  const targetLevel = currentLevel + 1;
  const catalog = BUILDING_CATALOG[building.id];
  const direct = catalog?.levels?.[targetLevel];

  if (direct?.cost && direct.cost !== '—') {
    return {
      cost: direct.cost,
      time: direct.time ?? '00:02:00',
      targetLevel,
    };
  }

  const base = catalog?.levels?.[1];
  if (base?.cost && base.cost !== '—') {
    if (targetLevel === 1) {
      return { cost: base.cost, time: base.time ?? '00:02:00', targetLevel };
    }
    const mult = 1 + (targetLevel - 1) * 0.4;
    return {
      cost: scaleCostString(base.cost, mult),
      time: scaleTimeString(base.time ?? '00:02:00', mult),
      targetLevel,
    };
  }

  if (building.cost && building.cost !== '—') {
    return {
      cost: building.cost,
      time: building.time && building.time !== '—' ? building.time : '00:02:00',
      targetLevel,
    };
  }

  return null;
}

export function getLevelOneSpec(buildingId) {
  return BUILDING_CATALOG[buildingId]?.levels?.[1] ?? null;
}
