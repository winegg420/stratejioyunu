/**
 * Tek kaynak tanımı — ID'ler DB/oyun durumu ile uyumlu kalır; etiket ve ikonlar askeri konsept.
 */
export const RESOURCE_IDS = ['food', 'fuel', 'hammadde', 'energy', 'money', 'uranium'];

/** Eski kayıtlar / maliyet metinleri */
export const LEGACY_RESOURCE_ID_ALIASES = {
  metal: 'hammadde',
};

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
  hammadde: {
    id: 'hammadde',
    label: 'Hammadde',
    icon: '🧱',
    costKeyword: 'hammadde',
    legacyKeywords: ['metal'],
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

export function resolveResourceId(resourceId) {
  if (!resourceId) return resourceId;
  return LEGACY_RESOURCE_ID_ALIASES[resourceId] ?? resourceId;
}

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
  const id = resolveResourceId(resourceId);
  return RESOURCE_CATALOG[id] ?? null;
}

export function getResourceCostKeyword(resourceId) {
  return getResourceMeta(resourceId)?.costKeyword ?? resourceId;
}

/** Kullanıcıya görünen metinlerde "Metal" → "Hammadde" */
export function sanitizeMetalWording(text) {
  if (text == null) return text;
  return String(text)
    .replace(/\bMetal\b/g, 'Hammadde')
    .replace(/\bMETAL\b/g, 'HAMMADDE')
    .replace(/\bmetal\b/g, 'hammadde');
}

export function getResourceDisplay(resourceId) {
  const meta = getResourceMeta(resourceId);
  return meta
    ? { label: meta.label, icon: meta.icon }
    : { label: resourceId, icon: '•' };
}

export function normalizeResourceRow(resource) {
  if (!resource?.id) return resource;
  const id = resolveResourceId(resource.id);
  const meta = getResourceMeta(id);
  if (!meta) return { ...resource, id };
  return {
    ...resource,
    id,
    label: meta.label,
    icon: meta.icon,
  };
}

/** Eksik kaynakları ekler; eski `metal` satırlarını `hammadde` ile birleştirir. */
export function ensureCityResources(resources) {
  const merged = {};
  for (const row of resources ?? []) {
    const id = resolveResourceId(row.id);
    const prev = merged[id];
    if (!prev) {
      merged[id] = normalizeResourceRow({ ...row, id });
      continue;
    }
    merged[id] = normalizeResourceRow({
      ...prev,
      current: (prev.current ?? 0) + (row.current ?? 0),
      max: prev.max == null || row.max == null
        ? (prev.max ?? row.max ?? null)
        : Math.max(prev.max, row.max),
      rate: row.rate ?? prev.rate,
    });
  }

  return RESOURCE_IDS.map((id) => {
    const meta = RESOURCE_CATALOG[id];
    const existing = merged[id];
    if (existing) return existing;
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

/** Merkez bankası / admin parity JSON — metal → hammadde */
export function migrateCentralBankParities(parities = {}) {
  if (!parities || typeof parities !== 'object') return parities;
  const next = { ...parities };
  if (next.metal != null && next.hammadde == null) {
    next.hammadde = next.metal;
    delete next.metal;
  }
  return next;
}
