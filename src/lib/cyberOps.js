import { genId } from './gameUtils';

export const CYBER_OPS_BUILDING_ID = 'cyber_ops';

/**
 * Siber Operasyon Merkezi seviyesine göre açılan yetenekler.
 * Store: launchCyberAttack → hedef şehir cyberEffects + cyberOpsLog
 */
/** Siber virüs / ajan operasyonları (Casusluk sekmesi + harita modal) */
export const CYBER_ABILITIES = [
  {
    id: 'infra_sabotage',
    name: 'Altyapı Sabotajı',
    subtitle: 'İletişim kesme',
    desc: 'Komuta haberleşmesi ve kışla hatlarına baskı — üretim hızı geçici düşer.',
    effectType: 'comms',
    minLevel: 1,
    barracksSlow: 0.3,
    cost: '1.200 metal · 800 enerji',
  },
  {
    id: 'disinformation',
    name: 'Dezenformasyon',
    subtitle: 'Mutluluk düşürme',
    desc: 'Hedef üste psikolojik operasyon — halk moralini geçici baltalar.',
    effectType: 'happiness',
    minLevel: 1,
    happinessDebuffPercent: 0.3,
    cost: '1.000 metal · 600 enerji',
  },
  {
    id: 'economic_paralysis',
    name: 'Ekonomik Siber Felç',
    subtitle: 'Üretim verimi azaltma',
    desc: 'Sanayi ve kaynak hatlarına müdahale — saatlik üretim verimi düşer.',
    effectType: 'production',
    minLevel: 2,
    productionDebuff: 0.3,
    cost: '1.600 metal · 1.000 enerji',
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

/** Başarılı siber virüs debuff süresi (1 saat) */
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

  if (ability.effectType === 'happiness' || ability.happinessDebuffPercent) {
    return { ...base, happinessDebuffPercent: ability.happinessDebuffPercent ?? 0.3 };
  }
  if (ability.effectType === 'production' || (ability.productionDebuff && !ability.barracksSlow)) {
    return { ...base, productionDebuff: ability.productionDebuff ?? 0.3 };
  }
  return {
    ...base,
    barracksSlow: ability.barracksSlow ?? 0.3,
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
