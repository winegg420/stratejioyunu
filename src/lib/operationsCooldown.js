/** Operasyonlar — son aktiviteden bu yana 1 saatlik backend eşiği */
export const OPERATION_COOLDOWN_MS = 60 * 60 * 1000;

export function resolveLastOperationMs(pastExpeditions, intelOps) {
  const stamps = [];
  for (const exp of pastExpeditions ?? []) {
    const t = exp.completedAt ?? exp.endedAt ?? exp.endsAt;
    if (t) stamps.push(t);
  }
  for (const op of intelOps ?? []) {
    if (op.endsAt) stamps.push(op.endsAt);
  }
  return stamps.length ? Math.max(...stamps) : null;
}

export function getOperationCooldownEndsAt(lastMs) {
  if (lastMs == null) return null;
  return lastMs + OPERATION_COOLDOWN_MS;
}
