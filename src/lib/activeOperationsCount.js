import { filterActiveExpeditions } from './gameUtils';

function isActiveIntelOp(op, now = Date.now()) {
  if (!op?.id) return false;
  if (op.endsAt != null && op.endsAt <= now) return false;
  if (op.status === 'completed' || op.status === 'done') return false;
  return true;
}

/** Ana Merkez — sefer + siber + KBRN + istihbarat ajan operasyonları */
export function countHomeActiveOperations({ expeditions = [], intelOperations = [], now = Date.now() } = {}) {
  const activeExps = filterActiveExpeditions(expeditions, now);
  const activeIntel = (intelOperations ?? []).filter((op) => isActiveIntelOp(op, now));
  return activeExps.length + activeIntel.length;
}

export function summarizeActiveOperations({ expeditions = [], intelOperations = [], now = Date.now() } = {}) {
  const activeExps = filterActiveExpeditions(expeditions, now);
  const activeIntel = (intelOperations ?? []).filter((op) => isActiveIntelOp(op, now));
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
