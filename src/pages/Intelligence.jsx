import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import IntelAccordion from '../components/IntelAccordion';
import IntelTargetPicker from '../components/IntelTargetPicker';
import QueueEmptyState from '../components/QueueEmptyState';
import MilitaryEmptyState from '../components/MilitaryEmptyState';
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
import { getCyberSuccessBonus } from '../lib/ideologySystem';
import {
  calcCyberAttackSuccessChance,
  calcCyberVirusTravelSeconds,
  resolveDefenderCyberOpsLevel,
} from '../utils/spyEngine';
import { resolveCityCoords } from '../lib/expeditionTravel';
import { getProgressionState } from '../lib/progressionSystem';
import { STORE_EMPTY_ARRAY, useGameStore, useActiveCity } from '../stores/gameStore';

const AGENT_OPS = [
  { id: 'scout', name: 'Keşif Ajanı', desc: 'Hedef üste askeri varlık tespiti' },
  { id: 'sabotage', name: 'Sabotaj', desc: 'Üretim tesislerine müdahale' },
  { id: 'infiltrate', name: 'Sızma Timi', desc: 'Komuta planı ve lojistik verisi' },
];

export default function Intelligence() {
  const navigate = useNavigate();
  const now = useGameStore((s) => s.now);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const city = useActiveCity();
  const playerIdeology = useGameStore((s) => s.playerIdeology);
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
  const requestMapTargetPick = useGameStore((s) => s.requestMapTargetPick);
  const mapTargetPickResult = useGameStore((s) => s.mapTargetPickResult);
  const clearMapTargetPickResult = useGameStore((s) => s.clearMapTargetPickResult);

  const counterPct = useMemo(() => getCounterIntelProtectionPct(city), [city]);
  const progression = getProgressionState(city);
  const kbrnBranchOk = progression.kbrnUnlocked && isKbrnBranchUnlocked(city);
  const chemUnlocked = canLaunchStealthCbrnOp(researches);
  const chemLevel = getWeaponDevelopmentLevel(researches);
  const deconLevel = getDecontaminationLevel(researches);

  const cyberTargets = useMemo(() => {
    const own = new Set(playerCities.map((c) => c.name));
    return mapCities.filter(
      (c) => !own.has(c.name) && (c.status === 'enemy' || c.status === 'bot' || c.owner),
    );
  }, [mapCities, playerCities]);

  const [agentTargetName, setAgentTargetName] = useState('');
  const [cyberTargetName, setCyberTargetName] = useState('');
  const [cyberAbilityId, setCyberAbilityId] = useState(CYBER_ABILITIES[0]?.id ?? '');
  const [agentCount, setAgentCount] = useState(1);
  const [kbrnTargetName, setKbrnTargetName] = useState('');
  const [kbrnAgents, setKbrnAgents] = useState(2);

  useEffect(() => {
    if (!mapTargetPickResult) return;
    if (mapTargetPickResult.field === 'agent') setAgentTargetName(mapTargetPickResult.cityName);
    if (mapTargetPickResult.field === 'cyber') setCyberTargetName(mapTargetPickResult.cityName);
    if (mapTargetPickResult.field === 'kbrn') setKbrnTargetName(mapTargetPickResult.cityName);
    clearMapTargetPickResult();
  }, [mapTargetPickResult, clearMapTargetPickResult]);

  const resolvedCyberName = cyberTargetName || cyberTargets[0]?.name || '';
  const selectedTarget = cyberTargets.find((c) => c.name === resolvedCyberName) ?? cyberTargets[0];
  const resolvedAgentName = agentTargetName || resolvedCyberName;
  const attackerFw = getCyberOpsLevel(city);
  const cyberCapabilities = getCyberCapabilities();

  const successPreview = useMemo(() => {
    if (!selectedTarget || !city) return null;
    const defenderFw = resolveDefenderCyberOpsLevel({ mapCity: selectedTarget });
    const chance = calcCyberAttackSuccessChance(
      attackerFw,
      defenderFw,
      getCyberSuccessBonus(playerIdeology),
    );
    return { defenderFw, chance: Math.round(chance * 100), diff: attackerFw - defenderFw };
  }, [selectedTarget, city, attackerFw, playerIdeology]);

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

  const activeKbrnExpeditions = useMemo(
    () => expeditions.filter((e) => e.mode === 'kbrn'),
    [expeditions],
  );

  const activeOpsCount = intelOps.length + activeCyberExpeditions.length + activeKbrnExpeditions.length;

  const kbrnResolvedTarget = cyberTargets.find(
    (c) => c.name === (kbrnTargetName || resolvedCyberName),
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

  const goMapPick = (field) => {
    requestMapTargetPick(field);
    navigate('/harita');
  };

  const handleAgentSend = (opType) => {
    const target = resolvedAgentName || cyberTargets[0]?.name;
    if (!target) return;
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

  return (
    <div className="page page--intel">
      <PageHeader
        title="İstihbarat & Siber Operasyon"
        subtitle="Ajan görevleri, siber virüs ve KBRN protokolleri."
      />

      <div className="intel-status-strip">
        <span>
          Boşta ajan: <strong>{idleAgents}</strong>
        </span>
        <span>
          Karşı istihbarat: <strong>%{counterPct}</strong>
        </span>
        <span>
          Aktif görev: <strong>{activeOpsCount}</strong>
        </span>
      </div>

      <IntelAccordion
        title="Aktif Operasyonlar"
        icon="📡"
        defaultOpen
        badge={activeOpsCount}
      >
        {activeOpsCount > 0 ? (
          <ul className="intel-list">
            {intelOps.map((op) => (
              <li key={op.id}>
                <strong>{op.opType}</strong>
                <span>{op.target}</span>
                <span className="badge">Ajan</span>
                <span className="timer">{formatSeconds(remainingFromEndsAt(op.endsAt, now))}</span>
              </li>
            ))}
            {activeCyberExpeditions.map((exp) => (
              <li key={exp.id}>
                <strong>{exp.troopPayload?.cyberVirus?.abilityId ?? 'Siber'}</strong>
                <span>{exp.originCityName} → {exp.target}</span>
                <span className="badge">Siber</span>
                <span className="timer">{formatSeconds(remainingFromEndsAt(exp.endsAt, now))}</span>
              </li>
            ))}
            {activeKbrnExpeditions.map((exp) => (
              <li key={exp.id}>
                <strong>KBRN</strong>
                <span>{exp.originCityName} → {exp.target}</span>
                <span className="badge badge--kbrn">KBRN</span>
                <span className="timer">{formatSeconds(remainingFromEndsAt(exp.endsAt, now))}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="intel-ops-empty-wrap">
            <QueueEmptyState
              as="div"
              tag="[ OPERASYON YOK ]"
            title="Aktif operasyon yok"
            hint="İstihbarat merkezinden ajan veya siber operasyon başlatın."
            icon="📡"
            />
          </div>
        )}
      </IntelAccordion>

      <LockedFeatureGate buildingId="intel" featureName="Ajan operasyonları">
        <IntelAccordion title="Ajan Operasyonları" icon="🕵️" defaultOpen>
          <IntelTargetPicker
            value={resolvedAgentName}
            onChange={setAgentTargetName}
            targets={cyberTargets}
            onMapPick={() => goMapPick('agent')}
            disabled={!cyberTargets.length}
          />
          <ul className="ops-list">
            {AGENT_OPS.map((op) => (
              <li key={op.id}>
                <strong>{op.name}</strong>
                <span>{op.desc}</span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={idleAgents < 1 || !resolvedAgentName}
                  onClick={() => handleAgentSend(op.name)}
                >
                  Gönder
                </button>
              </li>
            ))}
          </ul>
        </IntelAccordion>
      </LockedFeatureGate>

      {!progression.cyberUnlocked ? (
        <section className="panel intel-progression-lock">
          <h3 className="panel-title">Siber Operasyonlar</h3>
          <p className="hint">🔒 {progression.locks.cyber}</p>
        </section>
      ) : (
      <LockedFeatureGate buildingId="cyber_ops" featureName="Siber operasyonlar">
        <IntelAccordion title="Siber Operasyonlar" icon="💻">
          <p className="hint">
            Siber ajan gönderimi — başarı FW seviyesine bağlı; başarıda 1 saat %30 debuff.
          </p>

          {cyberTargets.length === 0 ? (
            <MilitaryEmptyState
              variant="inline"
              tag="[ HEDEF YOK ]"
              icon="🛰️"
              title="Saldırılabilir düşman üssü yok"
              hint="Haritada keşfedilen bot veya oyuncu üsleri burada listelenir."
            />
          ) : (
            <>
              <IntelTargetPicker
                value={resolvedCyberName}
                onChange={setCyberTargetName}
                targets={cyberTargets}
                onMapPick={() => goMapPick('cyber')}
              />

              <div className="intel-cyber-preview">
                <span>Saldıran FW: Lv.{attackerFw}</span>
                {successPreview && (
                  <>
                    <span>Savunan FW: Lv.{successPreview.defenderFw}</span>
                    <span>
                      Δ {successPreview.diff >= 0 ? '+' : ''}
                      {successPreview.diff}
                    </span>
                    <strong>Sızma: %{successPreview.chance}</strong>
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

          {cyberOpsLog.length > 0 && (
            <ul className="intel-list intel-cyber-log">
              {cyberOpsLog.slice(0, 4).map((log) => (
                <li key={log.id}>
                  <strong>{log.abilityName}</strong>
                  <span>{log.originCityName} → {log.targetCityName}</span>
                  <span className={log.success ? 'badge badge--ok' : 'badge'}>
                    {log.success ? 'OK' : 'FAIL'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </IntelAccordion>
      </LockedFeatureGate>
      )}

      {!progression.kbrnUnlocked ? (
        <section className="panel intel-progression-lock">
          <h3 className="panel-title">KBRN & Uranyum</h3>
          <p className="hint">🔒 {progression.locks.kbrn}</p>
        </section>
      ) : (
      <LockedFeatureGate buildingId="research" featureName="KBRN operasyonu">
        <IntelAccordion title="KBRN Silahı" icon="☢️">
          <p className="hint">
            Sinsi kimyasal baskı — 1 saat felç. Panzehir Sv.{deconLevel}.
            {!kbrnBranchOk && ' · Ar-Ge Sv.8+'}
          </p>

          {!chemUnlocked ? (
            <MilitaryEmptyState
              variant="inline"
              tag="[ AR-GE GEREKLİ ]"
              icon="☢️"
              title="KBRN silahı kilitli"
              hint="KBRN Silahı Geliştirme araştırmasını tamamlayın."
              actionLabel="Ar-Ge"
              actionTo="/ar-ge"
            />
          ) : cyberTargets.length === 0 ? (
            <MilitaryEmptyState
              variant="inline"
              tag="[ HEDEF YOK ]"
              icon="🎯"
              title="Haritada hedef üs yok"
              hint="Haritadan Seç ile veya keşif sonrası hedef belirleyin."
            />
          ) : (
            <>
              <IntelTargetPicker
                value={kbrnTargetName || resolvedCyberName}
                onChange={setKbrnTargetName}
                targets={cyberTargets}
                onMapPick={() => goMapPick('kbrn')}
              />
              {kbrnIntrusionPreview && (
                <div className="intel-cyber-preview intel-kbrn-preview">
                  <span>ATK Lv.{chemLevel}</span>
                  <span>DEF Lv.{kbrnIntrusionPreview.defenderDecon}</span>
                  <strong>Bulaşma: %{kbrnIntrusionPreview.chance}</strong>
                  <span className="hint">{kbrnIntrusionPreview.cost}</span>
                  <span className="hint">ETA: {formatSeconds(kbrnTravelSeconds)}</span>
                </div>
              )}
              <label className="intel-cyber-target">
                Operatör sayısı
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
                disabled={!kbrnBranchOk || idleAgents < kbrnAgents || !kbrnResolvedTarget}
                onClick={() => kbrnResolvedTarget && startKbrnChemExpedition({
                  targetCity: kbrnResolvedTarget,
                  agentCount: kbrnAgents,
                })}
              >
                Sinsi KBRN Başlat
              </button>
            </>
          )}
        </IntelAccordion>
      </LockedFeatureGate>
      )}

      <p className="intel-footer-hint">
        <span aria-hidden="true">📋</span>
        <span>
          Detaylar <Link to="/raporlar">Raporlar</Link> — CYBER OPS & KBRN LEDGER
        </span>
      </p>
    </div>
  );
}
