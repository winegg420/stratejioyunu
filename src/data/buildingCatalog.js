import { parseUnitCost } from '../utils/resourceCosts';
import { getResourceCostKeyword } from './resourceCatalog';
import { formatSeconds, parseTimeToSeconds } from '../lib/gameUtils';

const RESOURCE_LABELS = {
  food: getResourceCostKeyword('food'),
  hammadde: getResourceCostKeyword('hammadde'),
  fuel: getResourceCostKeyword('fuel'),
  money: getResourceCostKeyword('money'),
  energy: getResourceCostKeyword('energy'),
  uranium: getResourceCostKeyword('uranium'),
};

/** Seviye bazlı inşaat / yükseltme maliyetleri ve süreleri. */
export const BUILDING_CATALOG = {
  hq: {
    levels: {
      1: { cost: '500 hammadde · 500 bütçe', time: '00:08:00' },
    },
  },
  refinery: {
    levels: {
      1: { cost: '350 hammadde · 150 petrol', time: '00:05:00' },
    },
  },
  plant: {
    levels: {
      1: { cost: '450 hammadde · 200 enerji', time: '00:07:00' },
    },
  },
  barracks: {
    levels: {
      1: { cost: '450 hammadde · 250 nüfus', time: '00:08:00' },
    },
  },
  airport: {
    levels: {
      1: { cost: '800 hammadde · 350 petrol', time: '00:15:00' },
    },
  },
  shipyard: {
    levels: {
      1: { cost: '650 hammadde · 300 petrol', time: '00:12:00' },
    },
  },
  intel: {
    levels: {
      1: { cost: '400 hammadde · 250 bütçe', time: '00:07:00' },
    },
  },
  market: {
    levels: {
      1: { cost: '280 hammadde · 200 bütçe', time: '00:05:00' },
    },
  },
  research: {
    levels: {
      1: { cost: '600 hammadde · 400 bütçe', time: '00:10:00' },
    },
  },
  cyber_ops: {
    levels: {
      1: { cost: '2.200 hammadde · 1.400 enerji', time: '00:09:00' },
    },
  },
  ai_center: {
    maxLevel: 15,
    levels: {
      1: {
        cost: '95.000 hammadde · 62.000 bütçe · 22.000 enerji',
        time: '28:00:00',
      },
    },
  },
};

const AI_CENTER_COST_EXP = 1.78;
const AI_CENTER_TIME_EXP = 1.62;

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

  const maxLevel = catalog?.maxLevel ?? null;
  if (maxLevel != null && targetLevel > maxLevel) return null;

  const base = catalog?.levels?.[1];
  if (base?.cost && base.cost !== '—') {
    if (targetLevel === 1) {
      return { cost: base.cost, time: base.time ?? '00:02:00', targetLevel };
    }
    const isAi = building.id === 'ai_center';
    const mult = isAi
      ? Math.pow(AI_CENTER_COST_EXP, targetLevel - 1)
      : 1 + (targetLevel - 1) * 0.4;
    const timeMult = isAi
      ? Math.pow(AI_CENTER_TIME_EXP, targetLevel - 1)
      : mult;
    return {
      cost: scaleCostString(base.cost, mult),
      time: scaleTimeString(base.time ?? '00:02:00', timeMult),
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

  const levelOne = getLevelOneSpec(building.id);
  if (levelOne?.cost && levelOne.cost !== '—') {
    return {
      cost: levelOne.cost,
      time: levelOne.time ?? '00:02:00',
      targetLevel,
    };
  }

  return null;
}

export function getLevelOneSpec(buildingId) {
  return BUILDING_CATALOG[buildingId]?.levels?.[1] ?? null;
}
