import { filterActiveExpeditions } from './gameUtils';

export function isActiveIntelOp(op, now = Date.now()) {
  if (!op?.id) return false;
  if (op.endsAt != null && op.endsAt <= now) return false;
  if (op.status === 'completed' || op.status === 'done') return false;
  return true;
}

export function filterActiveIntelOperations(intelOperations, now = Date.now()) {
  return (intelOperations ?? []).filter((op) => isActiveIntelOp(op, now));
}

const INTEL_EXPEDITION_MODES = new Set(['cyber', 'kbrn', 'spy']);

export function filterIntelCategoryExpeditions(expeditions, now = Date.now()) {
  return filterActiveExpeditions(expeditions, now).filter(
    (e) => INTEL_EXPEDITION_MODES.has(e.mode),
  );
}

export function filterFieldExpeditions(expeditions, now = Date.now()) {
  return filterActiveExpeditions(expeditions, now).filter(
    (e) => !INTEL_EXPEDITION_MODES.has(e.mode),
  );
}

/** Sol menü — İstihbarat rozeti (ajan + siber + KBRN + casus seferleri) */
export function countIntelNavOperations({ expeditions = [], intelOperations = [], now = Date.now() } = {}) {
  const agentOps = filterActiveIntelOperations(intelOperations, now);
  const intelExps = filterIntelCategoryExpeditions(expeditions, now);
  return agentOps.length + intelExps.length;
}

/** Ana Merkez — sefer + siber + KBRN + istihbarat ajan operasyonları */
export function countHomeActiveOperations({ expeditions = [], intelOperations = [], now = Date.now() } = {}) {
  const activeExps = filterActiveExpeditions(expeditions, now);
  const activeIntel = filterActiveIntelOperations(intelOperations, now);
  return activeExps.length + activeIntel.length;
}

export function summarizeActiveOperations({ expeditions = [], intelOperations = [], now = Date.now() } = {}) {
  const activeExps = filterActiveExpeditions(expeditions, now);
  const activeIntel = filterActiveIntelOperations(intelOperations, now);
  return {
    total: activeExps.length + activeIntel.length,
    expeditions: activeExps.length,
    cyber: activeExps.filter((e) => e.mode === 'cyber').length,
    kbrn: activeExps.filter((e) => e.mode === 'kbrn').length,
    spy: activeExps.filter((e) => e.mode === 'spy').length,
    attack: activeExps.filter((e) => e.mode === 'attack').length,
    intel: activeIntel.length,
  };
}
