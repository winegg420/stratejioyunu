import { isTreatyActive } from './diplomaticAgreements';
import { diplomacy } from '../data/placeholder';

export function getActiveTreatyPartners(treaties, now = Date.now()) {
  return new Set(
    (treaties ?? [])
      .filter((t) => isTreatyActive(t, now))
      .map((t) => t.partner)
      .filter(Boolean),
  );
}

export function getAllianceMemberNames() {
  const members = diplomacy?.alliance?.members ?? [];
  return new Set(members.map((m) => (typeof m === 'string' ? m : m?.name)).filter(Boolean));
}

export function hasDiplomaticPartnership(cityOwner, { treaties, now = Date.now() } = {}) {
  if (!cityOwner) return false;
  const treatyPartners = getActiveTreatyPartners(treaties, now);
  const allianceMembers = getAllianceMemberNames();
  return treatyPartners.has(cityOwner) || allianceMembers.has(cityOwner);
}
