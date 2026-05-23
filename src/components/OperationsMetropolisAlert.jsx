import { useMemo } from 'react';
import { useEndsAtCountdown } from '../hooks/useEndsAtCountdown';
import {
  getOperationCooldownEndsAt,
  resolveLastOperationMs,
} from '../lib/operationsCooldown';
import { useGameStore } from '../stores/gameStore';

export default function OperationsMetropolisAlert() {
  const expeditions = useGameStore((s) => s.expeditions);
  const pastExpeditions = useGameStore((s) => s.pastExpeditions);
  const intelOps = useGameStore((s) => s.intelOperations ?? []);

  const cooldownEndsAt = useMemo(() => {
    const hasActive = (expeditions?.length ?? 0) > 0 || (intelOps?.length ?? 0) > 0;
    if (hasActive) return null;

    const lastMs = resolveLastOperationMs(pastExpeditions, intelOps);
    if (lastMs == null) return null;

    return getOperationCooldownEndsAt(lastMs);
  }, [expeditions, pastExpeditions, intelOps]);

  const countdown = useEndsAtCountdown(cooldownEndsAt);

  if (cooldownEndsAt == null) return null;

  if (countdown.isComplete) {
    return (
      <div
        className="ops-metropolis-alert ops-metropolis-alert--ready"
        role="status"
        aria-live="polite"
      >
        <span className="ops-metropolis-alert__tag">[ DURUM ]</span>
        <p className="ops-metropolis-alert__text">OPERASYON HAZIR</p>
        <p className="ops-metropolis-alert__sub">
          Yeni sefer veya istihbarat operasyonu başlatılabilir.
        </p>
      </div>
    );
  }

  return (
    <div className="ops-metropolis-alert ops-metropolis-alert--cooldown" role="alert">
      <span className="ops-metropolis-alert__tag">[ ASKERİ GERİ SAYIM ]</span>
      <p className="ops-metropolis-alert__text">
        METROPOL OPERASYON BEKLEMESİ — GERİ SAYIM AKTİF
      </p>
      <p className="ops-metropolis-alert__countdown font-hud-data" aria-live="polite">
        {countdown.label}
      </p>
    </div>
  );
}
