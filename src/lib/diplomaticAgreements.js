import { genId } from './gameUtils';

export const TREATY_KIND = {
  CEASEFIRE: 'ceasefire',
  NAP: 'nap',
};

export const TREATY_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  BROKEN: 'broken',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
};

export const TREATY_LABELS = {
  [TREATY_KIND.CEASEFIRE]: 'Ateşkes',
  [TREATY_KIND.NAP]: 'Saldırmazlık Paktı',
};

/** Pakt ihlali — itibar (sadakat) cezası */
export const TREATY_BREAK_LOYALTY_PENALTY = -45;

const MS_HOUR = 60 * 60 * 1000;

/** endsAt — epoch ms, ISO veya tr-TR "25.05.2026" / "25.05.2026 14:30" */
export function parseTreatyEndsAt(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const asNum = Number(value);
  if (Number.isFinite(asNum) && asNum > 1e11) return asNum;
  const str = String(value).trim();
  const trMatch = str.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (trMatch) {
    const [, d, mo, y, h = '23', mi = '59', se = '59'] = trMatch;
    return new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(se),
    ).getTime();
  }
  const parsed = Date.parse(str);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatTreatyDurationHours(hours) {
  if (hours == null || hours <= 0) return 'Süresiz';
  if (hours < 24) return `${hours} saat`;
  const d = Math.round(hours / 24);
  return `${d} gün`;
}

export function buildCeasefireEndsAt(hours, now = Date.now()) {
  const h = Math.max(1, Math.floor(Number(hours) || 0));
  return now + h * MS_HOUR;
}

export function isTreatyActive(treaty, now = Date.now()) {
  if (!treaty || treaty.status !== TREATY_STATUS.ACTIVE) return false;
  const endsAt = parseTreatyEndsAt(treaty.endsAt);
  if (endsAt != null && endsAt <= now) return false;
  return true;
}

export function findActiveTreatyWith(treaties, partner, now = Date.now()) {
  return (treaties ?? []).find(
    (t) => t.partner === partner && isTreatyActive(t, now),
  );
}

export function isAttackBlockedByTreaties(treaties, targetOwner, now = Date.now()) {
  if (!targetOwner) return { blocked: false };
  const t = findActiveTreatyWith(treaties, targetOwner, now);
  if (!t) return { blocked: false };
  const kind = t.kind ?? (t.type === 'Ateşkes' ? TREATY_KIND.CEASEFIRE : TREATY_KIND.NAP);
  return {
    blocked: true,
    treaty: t,
    reason: `${TREATY_LABELS[kind] ?? t.type} — ${targetOwner} ile saldırı yasak`,
  };
}

export function createTreatyProposal({
  partner,
  partnerAlliance = '—',
  kind,
  durationHours = null,
  proposer,
  now = Date.now(),
}) {
  const id = genId('tr');
  const endsAt = kind === TREATY_KIND.CEASEFIRE
    ? buildCeasefireEndsAt(durationHours ?? 48, now)
    : (durationHours && durationHours > 0 ? buildCeasefireEndsAt(durationHours, now) : null);

  return {
    id,
    partner,
    partnerAlliance,
    kind,
    type: TREATY_LABELS[kind] ?? kind,
    status: TREATY_STATUS.PENDING,
    proposer,
    signedBy: [],
    endsAt,
    proposedAt: now,
    acceptedAt: null,
    brokenAt: null,
  };
}

export function acceptTreatyProposal(treaty, accepter, now = Date.now()) {
  if (!treaty || treaty.status !== TREATY_STATUS.PENDING) return null;
  const signedBy = [...new Set([...(treaty.signedBy ?? []), accepter, treaty.proposer].filter(Boolean))];
  const needsBoth = treaty.kind === TREATY_KIND.NAP;
  const ready = !needsBoth || signedBy.length >= 2;

  return {
    ...treaty,
    status: ready ? TREATY_STATUS.ACTIVE : TREATY_STATUS.PENDING,
    signedBy,
    acceptedAt: ready ? now : treaty.acceptedAt,
  };
}

export function tickTreatyExpiry(treaties, now = Date.now()) {
  let changed = false;
  const next = (treaties ?? []).map((t) => {
    if (t.status !== TREATY_STATUS.ACTIVE) return t;
    const endsAt = parseTreatyEndsAt(t.endsAt);
    if (endsAt == null || endsAt > now) return t;
    changed = true;
    return { ...t, status: TREATY_STATUS.EXPIRED, endsAt };
  });
  return { treaties: next, changed };
}

export function listPendingTreatiesForPlayer(treaties, playerName) {
  return (treaties ?? []).filter(
    (t) => t.status === TREATY_STATUS.PENDING
      && t.partner === playerName
      && t.proposer !== playerName,
  );
}

export function listOutgoingProposals(treaties, playerName) {
  return (treaties ?? []).filter(
    (t) => t.status === TREATY_STATUS.PENDING && t.proposer === playerName,
  );
}
