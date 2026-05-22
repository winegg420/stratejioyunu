import { genId } from './gameUtils';

export const CYBER_OPS_BUILDING_ID = 'cyber_ops';

/** Siber Operasyon Merkezi — dört standart operasyon */
export const CYBER_ABILITIES = [
  {
    id: 'infra_sabotage',
    name: 'Altyapı Sabotajı',
    mapCode: 'SABOTAJ_ENERJI[01]',
    desc: 'Hedef üssün enerji üretimini geçici olarak durdurur.',
    effectType: 'energy_halt',
    energyHalt: true,
    minLevel: 1,
    cost: '1.400 hammadde · 900 enerji',
  },
  {
    id: 'comms_cut',
    name: 'İletişim Kesme',
    mapCode: 'COMMS_CUT[02]',
    desc: 'Düşman komuta bildirimlerini geciktirir — %10 iletişim etkisi.',
    effectType: 'comms_delay',
    notificationDelayPct: 0.1,
    minLevel: 1,
    cost: '1.200 hammadde · 700 enerji',
  },
  {
    id: 'disinformation',
    name: 'Dezenformasyon',
    mapCode: 'DEZEN_OPS[03]',
    desc: 'Hedef şehirde nüfus mutluluğunu düşürür.',
    effectType: 'happiness',
    happinessDebuffPercent: 0.28,
    minLevel: 1,
    cost: '1.000 hammadde · 600 enerji',
  },
  {
    id: 'data_leak',
    name: 'Veri Sızıntısı',
    mapCode: 'DATA_LEAK[04]',
    desc: 'Başarılı sızmadaki düşmanın tüm kaynak stoklarını görünür kılar.',
    effectType: 'resource_intel',
    minLevel: 1,
    cost: '1.600 hammadde · 1.100 enerji',
  },
];

export function getCyberOpsLevel(city) {
  const building = city?.buildings?.find((b) => b.id === CYBER_OPS_BUILDING_ID);
  return building?.level ?? 0;
}

export function getUnlockedCyberCapabilities(city) {
  const level = getCyberOpsLevel(city);
  return CYBER_ABILITIES.filter((a) => level >= a.minLevel);
}

export function getCyberAbilityById(abilityId) {
  return CYBER_ABILITIES.find((a) => a.id === abilityId) ?? null;
}

export function canLaunchCyberAbility(city, abilityId) {
  const ability = getCyberAbilityById(abilityId);
  if (!ability) return { ok: false, reason: 'Bilinmeyen operasyon' };
  const level = getCyberOpsLevel(city);
  if (level < ability.minLevel) {
    return { ok: false, reason: `Siber Operasyon Merkezi Sv.${ability.minLevel} gerekli` };
  }
  return { ok: true, ability };
}

export const CYBER_VIRUS_DURATION_MS = 60 * 60 * 1000;

export function createCyberEffect(ability, { sourceCityName, sourcePlayer }) {
  const endsAt = Date.now() + CYBER_VIRUS_DURATION_MS;
  const base = {
    id: genId('cyber'),
    abilityId: ability.id,
    name: ability.name,
    sourceCityName,
    sourcePlayer,
    startedAt: Date.now(),
    endsAt,
  };

  if (ability.effectType === 'energy_halt' || ability.energyHalt) {
    return { ...base, energyHalt: true };
  }
  if (ability.effectType === 'comms_delay' || ability.notificationDelayPct) {
    return {
      ...base,
      notificationDelayPct: ability.notificationDelayPct ?? 0.1,
    };
  }
  if (ability.effectType === 'resource_intel') {
    return { ...base, resourceIntelLeak: true };
  }
  if (ability.effectType === 'happiness' || ability.happinessDebuffPercent) {
    return { ...base, happinessDebuffPercent: ability.happinessDebuffPercent ?? 0.28 };
  }
  if (ability.effectType === 'production' || ability.productionDebuff) {
    return { ...base, productionDebuff: ability.productionDebuff ?? 0.3 };
  }
  return {
    ...base,
    barracksSlow: ability.barracksSlow ?? 0,
    productionDebuff: ability.productionDebuff ?? 0,
  };
}

export function buildCyberOpsLogEntry({ ability, originCityName, targetCityName, success = true }) {
  return {
    id: genId('cylog'),
    abilityId: ability.id,
    abilityName: ability.name,
    originCityName,
    targetCityName,
    success,
    at: Date.now(),
  };
}
