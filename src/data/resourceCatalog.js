/**
 * Tek kaynak tanımı — ID'ler DB/oyun durumu ile uyumlu kalır; etiket ve ikonlar askeri konsept.
 */
export const RESOURCE_IDS = ['food', 'fuel', 'metal', 'energy', 'money', 'uranium'];

export const RESOURCE_CATALOG = {
  food: {
    id: 'food',
    label: 'Nüfus',
    icon: '👥',
    costKeyword: 'nüfus',
    legacyKeywords: ['yemek', 'nufus', 'population'],
    starter: { current: 800, max: 5000 },
  },
  fuel: {
    id: 'fuel',
    label: 'Petrol',
    icon: '🛢️',
    costKeyword: 'petrol',
    legacyKeywords: ['yakıt', 'yakit', 'oil', 'fuel'],
    starter: { current: 400, max: 3000 },
  },
  metal: {
    id: 'metal',
    label: 'Metal',
    icon: '🔩',
    costKeyword: 'metal',
    legacyKeywords: [],
    starter: { current: 600, max: 4000 },
  },
  energy: {
    id: 'energy',
    label: 'Enerji',
    icon: '⚡',
    costKeyword: 'enerji',
    legacyKeywords: ['reaktör', 'reaktor', 'kapsül', 'kapsul'],
    starter: { current: 200, max: null },
  },
  money: {
    id: 'money',
    label: 'Bütçe',
    icon: '💰',
    costKeyword: 'bütçe',
    legacyKeywords: ['para', 'butce', 'budget'],
    starter: { current: 500, max: 8000 },
  },
  uranium: {
    id: 'uranium',
    label: 'Uranyum',
    icon: '☢️',
    costKeyword: 'uranyum',
    legacyKeywords: ['uranium'],
    starter: { current: 0, max: 500 },
  },
};

/** Maliyet metinlerinde kullanılan Türkçe anahtar → kaynak ID */
export function buildResourceLabelToIdMap() {
  const map = {};
  for (const meta of Object.values(RESOURCE_CATALOG)) {
    map[meta.costKeyword.toLowerCase()] = meta.id;
    for (const kw of meta.legacyKeywords) {
      map[kw.toLowerCase()] = meta.id;
    }
  }
  return map;
}

export function getResourceMeta(resourceId) {
  return RESOURCE_CATALOG[resourceId] ?? null;
}

export function getResourceCostKeyword(resourceId) {
  return getResourceMeta(resourceId)?.costKeyword ?? resourceId;
}

export function getResourceDisplay(resourceId) {
  const meta = getResourceMeta(resourceId);
  return meta
    ? { label: meta.label, icon: meta.icon }
    : { label: resourceId, icon: '•' };
}

export function normalizeResourceRow(resource) {
  if (!resource?.id) return resource;
  const meta = getResourceMeta(resource.id);
  if (!meta) return resource;
  return {
    ...resource,
    label: meta.label,
    icon: meta.icon,
  };
}

/** Eksik kaynakları (ör. uranyum) ekler; etiket/ikonları günceller. */
export function ensureCityResources(resources) {
  const byId = Object.fromEntries((resources ?? []).map((r) => [r.id, r]));
  return RESOURCE_IDS.map((id) => {
    const meta = RESOURCE_CATALOG[id];
    const existing = byId[id];
    if (existing) {
      return normalizeResourceRow(existing);
    }
    return {
      id,
      label: meta.label,
      icon: meta.icon,
      current: meta.starter.current,
      max: meta.starter.max,
      rate: '+0/sa',
    };
  });
}

export function getStarterResources() {
  return RESOURCE_IDS.map((id) => {
    const meta = RESOURCE_CATALOG[id];
    return {
      id,
      label: meta.label,
      icon: meta.icon,
      current: meta.starter.current,
      max: meta.starter.max,
      rate: '+0/sa',
    };
  });
}
