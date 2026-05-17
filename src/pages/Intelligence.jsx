import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { getCounterIntelProtectionPct } from '../lib/counterIntel';
import { STORE_EMPTY_ARRAY, useGameStore, useActiveCity } from '../stores/gameStore';

const OPS = [
  { id: 'scout', name: 'Keşif Ajanı', desc: 'Rakibin asker sayısını öğren' },
  { id: 'sabotage', name: 'Sabotaj', desc: 'Rakibin binasını hasarla' },
  { id: 'infiltrate', name: 'Sızma Timi', desc: 'Rakibin planını öğren' },
];

const TARGETS = ['Manisa', 'Bursa', 'Aydın', 'Denizli'];

export default function Intelligence() {
  const now = useGameStore((s) => s.now);
  const city = useActiveCity();
  const idleAgents = city?.idleAgents ?? 0;
  const intelOps = useGameStore((s) => s.intelOperations ?? STORE_EMPTY_ARRAY);
  const sendIntelOperation = useGameStore((s) => s.sendIntelOperation);
  const counterPct = useMemo(() => getCounterIntelProtectionPct(city), [city]);

  const handleSend = (opType) => {
    const target = TARGETS[Math.floor(Math.random() * TARGETS.length)];
    sendIntelOperation({ target, opType, agentCount: 1 });
  };

  return (
    <div className="page">
      <PageHeader
        title="İstihbarat"
        subtitle="Casus gönder, raporları incele, karşı istihbarat durumunu takip et."
      />
      <LockedFeatureGate buildingId="intel" featureName="İstihbarat operasyonları">
        <div className="two-col">
          <section className="panel">
            <h3 className="panel-title">Yeni Operasyon</h3>
            <p className="intel-agent-counter">
              Mevcut / Boşta Ajan: <strong>{idleAgents}</strong>
            </p>
            <ul className="ops-list">
              {OPS.map((op) => (
                <li key={op.id}>
                  <strong>{op.name}</strong>
                  <span>{op.desc}</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={idleAgents < 1}
                    onClick={() => handleSend(op.name)}
                  >
                    Gönder
                  </button>
                </li>
              ))}
            </ul>
            <p className="hint">
              İstihbarat Merkezi — Karşı casusluk koruma: <strong>%{counterPct}</strong>
            </p>
          </section>
          <section className="panel">
            <h3 className="panel-title">Aktif Operasyonlar</h3>
            {intelOps.length > 0 ? (
              <ul className="intel-list">
                {intelOps.map((op) => (
                  <li key={op.id}>
                    <strong>{op.opType}</strong>
                    <span>{op.target}</span>
                    <span className="badge">Yolda</span>
                    <span className="timer">
                      {formatSeconds(remainingFromEndsAt(op.endsAt, now))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon="🕵️"
                title="Casus operasyonu yok"
                description="Haritadan bir düşman şehrine casus göndererek asker ve bina bilgisi toplayabilirsiniz."
                actionLabel="Haritayı Aç"
                actionTo="/harita"
              />
            )}
          </section>
        </div>
      </LockedFeatureGate>
      <p className="hint">
        <Link to="/raporlar">Raporlar</Link> sekmesinde keşif detayları siber sis ile gizlenir.
      </p>
    </div>
  );
}
