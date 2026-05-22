/** Oyundaki 12 araştırma doktrini — tek kaynak. */

export const ADVANCED_RESEARCH_CATEGORY = 'advanced';

/** Ar-Ge Merkezi bu seviyede ileri doktrinler (r9–r12) açılır */
export const ADVANCED_RESEARCH_UNLOCK = 8;

/** @deprecated KBRN dalı → ileri doktrin */
export const KBRN_CATEGORY = ADVANCED_RESEARCH_CATEGORY;

export const KBRN_RESEARCH_CENTER_UNLOCK = ADVANCED_RESEARCH_UNLOCK;

export const RESEARCH_CATALOG = [
  {
    id: 'r1',
    category: 'standard',
    name: 'Kara Savaş Doktrini',
    max: 15,
    desc: 'Kara birliklerine saldırı ve muharebe verimliliği.',
    time: '04:22:15',
    cost: '2.800 hammadde · 1.200 bütçe',
  },
  {
    id: 'r2',
    category: 'standard',
    name: 'Hava Kuvvetleri Üstünlüğü',
    max: 15,
    desc: 'Hava üretimi ve hava-hava / hava-kara üstünlüğü.',
    time: '05:10:00',
    cost: '3.200 hammadde · 1.800 petrol',
  },
  {
    id: 'r3',
    category: 'standard',
    name: 'Deniz & Amfibi Harekat',
    max: 15,
    desc: 'Deniz filosu ve amfibi çıkarma kapasitesi.',
    time: '05:45:00',
    cost: '4.500 hammadde · 2.200 petrol',
  },
  {
    id: 'r4',
    category: 'standard',
    name: 'Stratejik Savunma Kalkanı',
    max: 15,
    desc: 'Garnizon savunması ve KBRN / saldırı hasar azaltma.',
    time: '04:00:00',
    cost: '3.800 hammadde · 1.500 nüfus',
  },
  {
    id: 'r5',
    category: 'standard',
    name: 'Elektronik Harp',
    max: 15,
    desc: 'Radar karıştırma ve düşman komuta ağlarına baskı.',
    time: '04:30:00',
    cost: '4.000 hammadde · 2.000 enerji',
  },
  {
    id: 'r6',
    category: 'standard',
    name: 'Ajan Ağı',
    max: 15,
    desc: 'Casusluk, istihbarat derinliği ve KBRN protokol tespiti.',
    time: '03:50:00',
    cost: '4.000 hammadde · 2.000 bütçe',
  },
  {
    id: 'r7',
    category: 'standard',
    name: 'Siber Operasyon Matrisi',
    max: 15,
    desc: 'Siber saldırı gücü ve Lockdown direnci.',
    time: '04:15:00',
    cost: '3.500 hammadde · 2.500 enerji',
  },
  {
    id: 'r8',
    category: 'standard',
    name: 'Gelişmiş Şifreleme',
    max: 15,
    desc: 'Muhabere güvenliği ve karşı-istihbarat koruması.',
    time: '05:00:00',
    cost: '5.000 hammadde · 3.000 bütçe',
  },
  {
    id: 'r9',
    category: ADVANCED_RESEARCH_CATEGORY,
    name: 'KBRN Silah Programı',
    max: 10,
    desc: 'Kimyasal/biyolojik ajan — sinsi harita operasyonları.',
    time: '12:00:00',
    cost: '28.000 hammadde · 15.000 bütçe · 8.000 enerji · 250 uranyum',
  },
  {
    id: 'r10',
    category: ADVANCED_RESEARCH_CATEGORY,
    name: 'Ağır Sanayi & Nükleer Enerji',
    max: 15,
    desc: 'Tüm üretim hatlarına verim ve enerji çıkışı.',
    time: '06:30:00',
    cost: '6.000 hammadde · 3.500 bütçe · 4.000 enerji',
  },
  {
    id: 'r11',
    category: ADVANCED_RESEARCH_CATEGORY,
    name: 'Füze & Balistik Sistemler',
    max: 12,
    desc: 'Uzun menzil saldırı ve stratejik vuruş kapasitesi.',
    time: '08:00:00',
    cost: '12.000 hammadde · 8.000 bütçe · 6.000 enerji · 80 uranyum',
  },
  {
    id: 'r12',
    category: ADVANCED_RESEARCH_CATEGORY,
    name: 'Yapay Zeka Entegrasyonu',
    max: 10,
    desc: 'İnşaat, üretim, casusluk ve siber operasyon optimizasyonu.',
    time: '14:00:00',
    cost: '45.000 hammadde · 28.000 bütçe · 15.000 enerji',
  },
];

/** Eski kayıt / bot ID → yeni doktrin */
export const RESEARCH_ID_ALIASES = {
  kbrn_weapon: 'r9',
  kbrn_chem: 'r9',
  kbrn_decon: 'r4',
  kbrn_detect: 'r6',
};

/** Eski standart araştırmalardan seviye aktarımı */
export const LEGACY_RESEARCH_LEVEL_MIGRATION = {
  r2: 'r10',
  r3: 'r6',
};

export const CANONICAL_RESEARCH_IDS = RESEARCH_CATALOG.map((r) => r.id);

export function normalizeResearchId(researchId) {
  return RESEARCH_ID_ALIASES[researchId] ?? researchId;
}

export function createResearchTemplates() {
  return RESEARCH_CATALOG.map((r) => ({
    ...r,
    level: 0,
    active: false,
    queued: false,
  }));
}

function readSavedLevel(entry) {
  if (entry == null) return 0;
  if (typeof entry === 'number') return Math.max(0, Math.floor(entry));
  return Math.max(0, Math.floor(Number(entry.level) || 0));
}

function normalizeSavedRow(entry) {
  if (entry == null) return null;
  if (typeof entry !== 'object') {
    return { level: readSavedLevel(entry), active: false, queued: false };
  }
  const category = entry.category === 'kbrn' ? ADVANCED_RESEARCH_CATEGORY : entry.category;
  return {
    level: readSavedLevel(entry),
    max: entry.max ?? entry.max_level,
    active: entry.active ?? entry.is_active ?? false,
    queued: entry.queued ?? entry.is_queued ?? false,
    endsAt: entry.endsAt ?? entry.ends_at ?? undefined,
    category,
  };
}

/** DB / kayıtlı liste → 12 doktrin + seviye birleştirme */
export function mergeResearchProgress(savedById = {}) {
  const levels = {};
  const rows = {};

  for (const [id, raw] of Object.entries(savedById)) {
    const row = normalizeSavedRow(raw);
    if (!row) continue;
    levels[id] = Math.max(levels[id] ?? 0, row.level);
    rows[id] = row;
  }

  for (const [legacyId, targetId] of Object.entries(RESEARCH_ID_ALIASES)) {
    const legacyLv = levels[legacyId];
    if (legacyLv != null) {
      levels[targetId] = Math.max(levels[targetId] ?? 0, legacyLv);
    }
  }
  for (const [legacyId, targetId] of Object.entries(LEGACY_RESEARCH_LEVEL_MIGRATION)) {
    const legacyLv = levels[legacyId];
    if (legacyLv != null) {
      levels[targetId] = Math.max(levels[targetId] ?? 0, legacyLv);
    }
  }

  return createResearchTemplates().map((template) => {
    const row = rows[template.id];
    const level = levels[template.id] ?? 0;
    return {
      ...template,
      level,
      max: row?.max ?? template.max,
      active: row?.active ?? false,
      queued: row?.queued ?? false,
      endsAt: row?.endsAt,
    };
  });
}

/** Bellek / hydrate sonrası araştırma listesini 12 doktrine hizalar */
export function syncResearchesToCatalog(researches = []) {
  const savedById = {};
  for (const r of researches) {
    if (!r?.id) continue;
    savedById[r.id] = r;
  }
  return mergeResearchProgress(savedById);
}
