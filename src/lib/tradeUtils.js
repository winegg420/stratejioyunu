import { RESOURCE_IDS, getResourceDisplay, resolveResourceId } from '../data/resourceCatalog';

const TRADE_DEPOT_LABELS = {
  tr: {
    food: 'Nüfus Deposu',
    fuel: 'Petrol Deposu',
    hammadde: 'Hammadde Deposu',
    money: 'Bütçe',
  },
  en: {
    food: 'Population Depot',
    fuel: 'Fuel Depot',
    hammadde: 'Raw Materials Depot',
    money: 'Budget',
  },
};

const GLUED_DEPOT_LABELS = {
  nüfusdepo: 'Nüfus Deposu',
  petroldepo: 'Petrol Deposu',
  hammaddedepo: 'Hammadde Deposu',
  populationdepot: 'Population Depot',
  fueldepot: 'Fuel Depot',
  rawmaterialsdepot: 'Raw Materials Depot',
};

/** Eski kayıt / birleşik yazım: NüfusDepo → Nüfus Deposu */
export function normalizeTradeDepotLabel(text) {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  const glued = GLUED_DEPOT_LABELS[trimmed.toLowerCase()];
  if (glued) return glued;
  if (/^nüfus\s*depo$/i.test(trimmed)) return 'Nüfus Deposu';
  if (/^petrol\s*depo$/i.test(trimmed)) return 'Petrol Deposu';
  if (/^hammadde\s*depo$/i.test(trimmed)) return 'Hammadde Deposu';
  return trimmed;
}

/** Ticaret formunda okunabilir depo etiketi (camelCase / birleşik yazım yerine). */
export function getTradeDepotLabel(resourceId, lang = 'tr') {
  const id = resolveResourceId(resourceId);
  const locale = lang === 'en' ? 'en' : 'tr';
  if (TRADE_DEPOT_LABELS[locale][id]) return TRADE_DEPOT_LABELS[locale][id];
  const { label } = getResourceDisplay(id);
  const base = normalizeTradeDepotLabel(label) || label;
  return locale === 'en' ? `${base} Depot` : `${base} Deposu`;
}

export function sumTradeAmounts(amounts = {}) {
  return RESOURCE_IDS.reduce((sum, id) => sum + Math.max(0, Number(amounts[id]) || 0), 0);
}

export function deductTradeResources(resources, amounts) {
  return resources.map((r) => {
    const take = Math.max(0, Number(amounts[r.id]) || 0);
    if (take <= 0) return r;
    return { ...r, current: Math.max(0, r.current - take) };
  });
}

export function canAffordTrade(resources, amounts) {
  return resources.every((r) => {
    const need = Math.max(0, Number(amounts[r.id]) || 0);
    return r.current >= need;
  });
}

/** Returns overflow per resource id when adding amounts to target depot. */
export function calcTradeDepotOverflow(resources, amounts) {
  const overflow = [];
  for (const r of resources) {
    const add = Math.max(0, Number(amounts[r.id]) || 0);
    if (add <= 0 || r.max == null) continue;
    const next = r.current + add;
    if (next > r.max) {
      overflow.push({
        id: r.id,
        label: r.label,
        excess: Math.floor(next - r.max),
        wouldReceive: add,
      });
    }
  }
  return overflow;
}

export function applyTradeDelivery(resources, amounts) {
  const overflow = [];
  const next = resources.map((r) => {
    const add = Math.max(0, Number(amounts[r.id]) || 0);
    if (add <= 0) return r;
    if (r.max == null) return { ...r, current: r.current + add };
    const capped = Math.min(r.max, r.current + add);
    if (r.current + add > r.max) {
      overflow.push({
        id: r.id,
        label: r.label,
        amount: Math.floor(r.current + add - r.max),
      });
    }
    return { ...r, current: capped };
  });
  return { resources: next, overflow };
}

export function restoreTradeCargo(resources, amounts) {
  return applyTradeDelivery(resources, amounts);
}

export { scaleTradeWithCentralBank } from './adminOverrideEngine';

/** İdeoloji ticaret çarpanı (ör. milliyetçi −%15 teslimat). */
export function scaleTradeAmounts(amounts = {}, multiplier = 1) {
  if (!amounts || multiplier === 1) return { ...amounts };
  const scaled = {};
  for (const id of RESOURCE_IDS) {
    const raw = Math.max(0, Number(amounts[id]) || 0);
    scaled[id] = raw > 0 ? Math.max(0, Math.floor(raw * multiplier)) : 0;
  }
  return scaled;
}

export function formatTradeCargoSummary(amounts) {
  const parts = RESOURCE_IDS.filter((id) => (amounts[id] || 0) > 0).map((id) => {
    const { label, icon } = getResourceDisplay(id);
    return `${icon} ${amounts[id].toLocaleString('tr-TR')} ${label}`;
  });
  return parts.join(' · ') || '—';
}
