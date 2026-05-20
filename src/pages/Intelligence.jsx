import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import LockedFeatureGate from '../components/LockedFeatureGate';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { getCounterIntelProtectionPct } from '../lib/counterIntel';
import { CYBER_ABILITIES, getCyberOpsLevel } from '../lib/cyberOps';
import {
  canLaunchStealthCbrnOp,
  getWeaponDevelopmentLevel,
  getDecontaminationLevel,
  isKbrnBranchUnlocked,
} from '../lib/kbrnResearch';
import {
  calcKbrnChemTravelSeconds,
  calcCbrnIntrusionChance,
  getCbrnChemOpCost,
  resolveDefenderDeconLevel,
} from '../utils/cbrnEngine';
import {
  calcCyberAttackSuccessChance,
  calcCyberVirusTravelSeconds,
  resolveDefenderCyberOpsLevel,
} from '../utils/spyEngine';
import { resolveCityCoords } from '../lib/expeditionTravel';
import { STORE_EMPTY_ARRAY, useGameStore, useActiveCity } from '../stores/gameStore';

const OPS = [
  { id: 'scout', name: 'Keşif Ajanı', desc: 'Hedef üste askeri varlık tespiti' },
  { id: 'sabotage', name: 'Sabotaj', desc: 'Üretim tesislerine müdahale' },
  { id: 'infiltrate', name: 'Sızma Timi', desc: 'Komuta planı ve lojistik verisi' },
];

export default function Intelligence() {
  const now = useGameStore((s) => s.now);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const city = useActiveCity();
  const mapCities = useGameStore((s) => s.mapCities);
  const playerCities = useGameStore((s) => s.playerCities);
  const expeditions = useGameStore((s) => s.expeditions ?? STORE_EMPTY_ARRAY);
  const idleAgents = city?.idleAgents ?? 0;
  const intelOps = useGameStore((s) => s.intelOperations ?? STORE_EMPTY_ARRAY);
  const cyberOpsLog = useGameStore((s) => s.cyberOpsLog ?? STORE_EMPTY_ARRAY);
  const sendIntelOperation = useGameStore((s) => s.sendIntelOperation);
  const startCyberVirusExpedition = useGameStore((s) => s.startCyberVirusExpedition);
  const startKbrnChemExpedition = useGameStore((s) => s.startKbrnChemExpedition);
  const getCyberCapabilities = useGameStore((s) => s.getCyberCapabilities);
  const researches = useGameStore((s) => s.researches ?? STORE_EMPTY_ARRAY);
  const counterPct = useMemo(() => getCounterIntelProtectionPct(city), [city]);
  const kbrnBranchOk = isKbrnBranchUnlocked(city);
  const chemUnlocked = canLaunchStealthCbrnOp(researches);
  const chemLevel = getWeaponDevelopmentLevel(researches);
  const deconLevel = getDecontaminationLevel(researches);

  const cyberTargets = useMemo(() => {
    const own = new Set(playerCities.map((c) => c.name));
    return mapCities.filter(
      (c) => !own.has(c.name) && (c.status === 'enemy' || c.status === 'bot' || c.owner),
    );
  }, [mapCities, playerCities]);

  const [cyberTargetName, setCyberTargetName] = useState(() => '');
  const [cyberAbilityId, setCyberAbilityId] = useState(CYBER_ABILITIES[0]?.id ?? '');
  const [agentCount, setAgentCount] = useState(1);
  const [kbrnTargetName, setKbrnTargetName] = useState('');
  const [kbrnAgents, setKbrnAgents] = useState(2);

  const resolvedTargetName = cyberTargetName || cyberTargets[0]?.name || '';
  const selectedTarget = cyberTargets.find((c) => c.name === resolvedTargetName)
    ?? cyberTargets[0];
  const cyberCapabilities = getCyberCapabilities();
  const attackerFw = getCyberOpsLevel(city);

  const successPreview = useMemo(() => {
    if (!selectedTarget || !city) return null;
    const defenderFw = resolveDefenderCyberOpsLevel({ mapCity: selectedTarget });
    const chance = calcCyberAttackSuccessChance(attackerFw, defenderFw);
    return { defenderFw, chance: Math.round(chance * 100), diff: attackerFw - defenderFw };
  }, [selectedTarget, city, attackerFw]);

  const travelSeconds = useMemo(() => {
    if (!selectedTarget || !city) return 0;
    const originName = playerCities.find((c) => c.id === activeCityId)?.name;
    const origin = resolveCityCoords(originName, playerCities, mapCities);
    return calcCyberVirusTravelSeconds({
      origin,
      target: { lat: selectedTarget.lat, lng: selectedTarget.lng },
      agentCount,
      mapCities,
    });
  }, [selectedTarget, city, agentCount, mapCities, playerCities, activeCityId]);

  const activeCyberExpeditions = useMemo(
    () => expeditions.filter((e) => e.mode === 'cyber'),
    [expeditions],
  );

  const kbrnResolvedTarget = cyberTargets.find(
    (c) => c.name === (kbrnTargetName || resolvedTargetName),
  ) ?? selectedTarget;

  const kbrnIntrusionPreview = useMemo(() => {
    if (!kbrnResolvedTarget) return null;
    const attackerChem = chemLevel;
    const defenderDecon = resolveDefenderDeconLevel({ mapCity: kbrnResolvedTarget });
    const chance = calcCbrnIntrusionChance(attackerChem, defenderDecon);
    return {
      defenderDecon,
      chance: Math.round(chance * 100),
      diff: attackerChem - defenderDecon,
      cost: getCbrnChemOpCost(chemLevel),
    };
  }, [kbrnResolvedTarget, chemLevel]);

  const kbrnTravelSeconds = useMemo(() => {
    if (!kbrnResolvedTarget) return 0;
    const originName = playerCities.find((c) => c.id === activeCityId)?.name;
    const origin = resolveCityCoords(originName, playerCities, mapCities);
    return calcKbrnChemTravelSeconds({
      origin,
      target: { lat: kbrnResolvedTarget.lat, lng: kbrnResolvedTarget.lng },
      agentCount: kbrnAgents,
      mapCities,
    });
  }, [kbrnResolvedTarget, kbrnAgents, mapCities, playerCities, activeCityId]);

  const activeKbrnExpeditions = useMemo(
    () => expeditions.filter((e) => e.mode === 'kbrn'),
    [expeditions],
  );

  const handleSend = (opType) => {
    const targets = cyberTargets.length ? cyberTargets : mapCities;
    const target = targets[Math.floor(Math.random() * targets.length)]?.name ?? 'Bot_USS';
    sendIntelOperation({ target, opType, agentCount: 1 });
  };

  const handleCyberLaunch = () => {
    if (!selectedTarget) return;
    startCyberVirusExpedition({
      targetCity: selectedTarget,
      abilityId: cyberAbilityId,
      agentCount,
    });
  };

  const effectiveTargetName = resolvedTargetName || selectedTarget?.name || '';

  return (
    <div className="page">
      <PageHeader
        title="İstihbarat & Siber Operasyon"
        subtitle="Keşif, siber virüs ve KBRN kimyasal baskı operasyonları."
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
              İstihbarat Merkezi — Karşı istihbarat koruma: <strong>%{counterPct}</strong>
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
                icon="📡"
                title="Aktif operasyon yok"
                description="Haritadan düşman üssüne keşif veya casus sondası gönderin."
                actionLabel="Haritayı Aç"
                actionTo="/harita"
              />
            )}
          </section>
        </div>
      </LockedFeatureGate>

      <LockedFeatureGate buildingId="cyber_ops" featureName="Siber operasyonlar">
        <section className="panel intel-cyber-panel">
          <h3 className="panel-title">Siber Virüs / Ajan</h3>
          <p className="hint">
            Düz casus yerine siber ajan gönderin. Başarı, Siber Operasyon Merkezi seviyeniz ile
            hedef güvenlik duvarı (cyber_ops) farkına bağlıdır. Başarıda hedefe 1 saat %30 debuff uygulanır.
          </p>

          {cyberTargets.length === 0 ? (
            <p className="hint">Haritada saldırılabilir düşman üssü yok.</p>
          ) : (
            <>
              <label className="intel-cyber-target">
                Hedef üs
                <select
                  value={effectiveTargetName}
                  onChange={(e) => setCyberTargetName(e.target.value)}
                >
                  {cyberTargets.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </label>

              <div className="intel-cyber-preview">
                <span>Saldıran FW: Lv.{attackerFw}</span>
                {successPreview && (
                  <>
                    <span>Savunan FW: Lv.{successPreview.defenderFw}</span>
                    <span>Δ {successPreview.diff >= 0 ? '+' : ''}{successPreview.diff}</span>
                    <strong>Sızma şansı: %{successPreview.chance}</strong>
                    <span className="hint">ETA: {formatSeconds(travelSeconds)}</span>
                  </>
                )}
              </div>

              <label className="intel-cyber-target">
                Siber ajan sayısı
                <input
                  type="number"
                  className="input-qty"
                  min={1}
                  max={idleAgents}
                  value={agentCount}
                  onChange={(e) => setAgentCount(Math.min(idleAgents, Math.max(1, Number(e.target.value) || 1)))}
                />
              </label>

              <ul className="ops-list ops-list--cyber">
                {CYBER_ABILITIES.map((ability) => {
                  const unlocked = cyberCapabilities.some((c) => c.id === ability.id);
                  return (
                    <li key={ability.id} className={unlocked ? '' : 'ops-list__locked'}>
                      <strong>{ability.name}</strong>
                      <span>{ability.subtitle ?? ability.desc}</span>
                      <span className="hint">Sv.{ability.minLevel}+ · {ability.cost}</span>
                      <button
                        type="button"
                        className={`btn btn-primary btn-sm${cyberAbilityId === ability.id ? ' active' : ''}`}
                        disabled={!unlocked}
                        onClick={() => setCyberAbilityId(ability.id)}
                      >
                        {unlocked ? 'Seç' : `Kilitli (Sv.${ability.minLevel})`}
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                className="btn btn-danger"
                disabled={!cyberCapabilities.length || idleAgents < agentCount || !selectedTarget}
                onClick={handleCyberLaunch}
              >
                Siber Virüs Gönder
              </button>
            </>
          )}

          {activeCyberExpeditions.length > 0 && (
            <ul className="intel-list intel-cyber-log">
              {activeCyberExpeditions.map((exp) => (
                <li key={exp.id}>
                  <strong>{exp.troopPayload?.cyberVirus?.abilityId}</strong>
                  <span>{exp.originCityName} → {exp.target}</span>
                  <span className="timer">
                    {formatSeconds(remainingFromEndsAt(exp.endsAt, now))}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {cyberOpsLog.length > 0 && (
            <ul className="intel-list intel-cyber-log">
              {cyberOpsLog.slice(0, 6).map((log) => (
                <li key={log.id}>
                  <strong>{log.abilityName}</strong>
                  <span>{log.originCityName} → {log.targetCityName}</span>
                  <span className={log.success ? 'badge badge--ok' : 'badge'}>
                    {log.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </LockedFeatureGate>

      <LockedFeatureGate buildingId="research" featureName="KBRN kimyasal baskı">
        <section className="panel intel-kbrn-panel">
          <h3 className="panel-title">KBRN Silahı — Sinsi Operasyon</h3>
          <p className="hint">
            1 saat geçici felç: nüfus/moral çöker, üretim %30 baltalanır. Haber akışında kaynak gizli;
            yalnızca çok yüksek istihbarat kimliği gösterir. Panzehir: <strong>Sv.{deconLevel}</strong>
            (AI salgınlarına da karşı).
            {!kbrnBranchOk && ' Ar-Ge Sv.8+ gerekli.'}
          </p>

          {!chemUnlocked ? (
            <p className="hint">Önce &quot;KBRN Silahı Geliştirme&quot; araştırmasını tamamlayın.</p>
          ) : cyberTargets.length === 0 ? (
            <p className="hint">Haritada hedef üs yok.</p>
          ) : (
            <>
              <label className="intel-cyber-target">
                Hedef üs
                <select
                  value={kbrnTargetName || effectiveTargetName}
                  onChange={(e) => setKbrnTargetName(e.target.value)}
                >
                  {cyberTargets.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </label>
              {kbrnIntrusionPreview && (
                <div className="intel-cyber-preview intel-kbrn-preview">
                  <span>Kimyasal ATK: Lv.{chemLevel}</span>
                  <span>Panzehir DEF: Lv.{kbrnIntrusionPreview.defenderDecon}</span>
                  <span>Δ {kbrnIntrusionPreview.diff >= 0 ? '+' : ''}{kbrnIntrusionPreview.diff}</span>
                  <strong>Bulaşma: %{kbrnIntrusionPreview.chance}</strong>
                  <span className="hint">Maliyet: {kbrnIntrusionPreview.cost}</span>
                  <span className="hint">ETA: {formatSeconds(kbrnTravelSeconds)}</span>
                </div>
              )}
              <label className="intel-cyber-target">
                KBRN operatörü
                <input
                  type="number"
                  className="input-qty"
                  min={1}
                  max={idleAgents}
                  value={kbrnAgents}
                  onChange={(e) => setKbrnAgents(Math.min(idleAgents, Math.max(1, Number(e.target.value) || 1)))}
                />
              </label>
              <button
                type="button"
                className="btn btn-danger"
                disabled={!kbrnBranchOk || idleAgents < kbrnAgents}
                onClick={() => kbrnResolvedTarget && startKbrnChemExpedition({
                  targetCity: kbrnResolvedTarget,
                  agentCount: kbrnAgents,
                })}
              >
                Sinsi KBRN Başlat
              </button>
            </>
          )}

          {activeKbrnExpeditions.length > 0 && (
            <ul className="intel-list intel-kbrn-log">
              {activeKbrnExpeditions.map((exp) => (
                <li key={exp.id}>
                  <strong>KBRN</strong>
                  <span>{exp.originCityName} → {exp.target}</span>
                  <span className="timer">
                    {formatSeconds(remainingFromEndsAt(exp.endsAt, now))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </LockedFeatureGate>

      <p className="hint">
        <Link to="/raporlar">Raporlar</Link> —{' '}
        <strong>[ CYBER OPS LEDGER ]</strong> ve <strong>[ KBRN OPS LEDGER ]</strong>
      </p>
    </div>
  );
}
