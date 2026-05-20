/**
 * Küresel Başkanlık — mutlak otorite, siyasi yelpaze, State Mail.
 * Üretim, mutluluk ve askeri güç üzerinde doğrudan etki.
 */

export const GOVERNANCE_LIBERAL = 'liberal';
export const GOVERNANCE_STATIST = 'statist';

export const GOVERNANCE_PROFILES = {
  [GOVERNANCE_LIBERAL]: {
    id: GOVERNANCE_LIBERAL,
    label: 'Serbest Piyasa',
    ideology: 'Sağ / Liberal',
    tag: '[ LIBERAL REJİM ]',
    suggestedTax: 12,
    happinessDelta: 8,
    productionMultiplier: 0.94,
    militaryMultiplier: 0.96,
    blurb: 'Düşük vergi, yüksek mutluluk, serbest ekonomi.',
  },
  [GOVERNANCE_STATIST]: {
    id: GOVERNANCE_STATIST,
    label: 'Merkezi Otorite',
    ideology: 'Sol / Devletçi',
    tag: '[ MERKEZİ REJİM ]',
    suggestedTax: 22,
    happinessDelta: -6,
    productionMultiplier: 1.1,
    militaryMultiplier: 1.06,
    blurb: 'Yüksek üretim, sıkı disiplin, merkezi kontrol.',
  },
};

export function isValidGovernance(style) {
  return style === GOVERNANCE_LIBERAL || style === GOVERNANCE_STATIST;
}

export function getGovernanceProfile(style) {
  if (!isValidGovernance(style)) return null;
  return GOVERNANCE_PROFILES[style];
}

/** Mutluluk tabanına ideoloji düzeltmesi (happinessSystem). */
export function getGovernanceHappinessDelta(style) {
  return getGovernanceProfile(style)?.happinessDelta ?? 0;
}

/** Maden/enerji saatlik üretim çarpanı (resourceProduction). */
export function getGovernanceProductionMultiplier(style) {
  return getGovernanceProfile(style)?.productionMultiplier ?? 1;
}

/** Askeri güç çarpanı — gelecekte combatEngine ile paylaşılır. */
export function getGovernanceMilitaryMultiplier(style) {
  return getGovernanceProfile(style)?.militaryMultiplier ?? 1;
}

export function formatGovernanceLabel(style) {
  const p = getGovernanceProfile(style);
  return p ? `${p.label} · ${p.ideology}` : 'Belirlenmedi';
}

/** State Mail — resmi diplomatik yazışma meta alanları. */
export const STATE_MAIL_PROTOCOLS = {
  standard: 'AES-256 · STATE-MAIL',
  alliance: 'QUANTUM-SHIELD · ALLIANCE-CHAN',
  war: 'BURN-AFTER-READ · RED-CHANNEL',
};

export function resolveEncryptionLabel(level = 'standard') {
  return STATE_MAIL_PROTOCOLS[level] ?? STATE_MAIL_PROTOCOLS.standard;
}
