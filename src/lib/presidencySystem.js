/**
 * @deprecated Yönetim doktrini → ideoloji sistemine taşındı.
 * Geriye uyumluluk için re-export.
 */
export {
  formatIdeologyLabel as formatGovernanceLabel,
  IDEOLOGY_CAPITALIST as GOVERNANCE_LIBERAL,
  IDEOLOGY_SOCIALIST as GOVERNANCE_STATIST,
  IDEOLOGY_PROFILES as GOVERNANCE_PROFILES,
  isValidIdeology as isValidGovernance,
  getIdeologyProfile as getGovernanceProfile,
} from './ideologySystem';

export const STATE_MAIL_PROTOCOLS = {
  standard: 'AES-256 · STATE-MAIL',
  alliance: 'QUANTUM-SHIELD · ALLIANCE-CHAN',
  war: 'BURN-AFTER-READ · RED-CHANNEL',
};

export function resolveEncryptionLabel(level = 'standard') {
  return STATE_MAIL_PROTOCOLS[level] ?? STATE_MAIL_PROTOCOLS.standard;
}
