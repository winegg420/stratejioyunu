import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import IntelAccordion from '../components/IntelAccordion';
import IntelTargetPicker from '../components/IntelTargetPicker';
import IntelSummaryPanel from '../components/IntelSummaryPanel';
import QueueEmptyState from '../components/QueueEmptyState';
import IntelListRow from '../components/IntelListRow';
import MilitaryEmptyState from '../components/MilitaryEmptyState';
import LockedFeatureGate from '../components/LockedFeatureGate';
import IntelOpActionButton from '../components/IntelOpActionButton';
import IntelNoAgentsAlert from '../components/IntelNoAgentsAlert';
import IntelConfirmDialog from '../components/IntelConfirmDialog';
import CustomDropdown from '../components/CustomDropdown';
import {
  AGENT_OPERATIONS,
  KBRN_CHEM_PRESSURE_OP,
} from '../data/intelOperationsCatalog';
import {
  filterActiveIntelOperations,
  filterIntelCategoryExpeditions,
} from '../lib/activeOperationsCount';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { resolveIntelTargetName } from '../lib/intelTargetResolve';
import { getCounterIntelProtectionPct } from '../lib/counterIntel';
import { CYBER_ABILITIES } from '../lib/cyberOps';
import {
  canLaunchStealthCbrnOp,
  getWeaponDevelopmentLevel,
  isKbrnBranchUnlocked,
} from '../lib/kbrnResearch';
import {
  calcKbrnChemTravelSeconds,
  calcCbrnIntrusionChance,
  getCbrnChemOpCost,
  resolveDefenderDeconLevel,
} from '../utils/cbrnEngine';
import { getProgressionState } from '../lib/progressionSystem';
import { resolveCityCoords } from '../lib/expeditionTravel';
import { useLanguage } from '../context/LanguageContext';
import { STORE_EMPTY_ARRAY, useGameStore, useActiveCity } from '../stores/gameStore';

export default function Intelligence() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const now = useGameStore((s) => s.now);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const city = useActiveCity();
  const mapCities = useGameStore((s) => s.mapCities);
  const playerCities = useGameStore((s) => s.playerCities);
  const expeditions = useGameStore((s) => s.expeditions ?? STORE_EMPTY_ARRAY);
  const reports = useGameStore((s) => s.reports ?? STORE_EMPTY_ARRAY);
  const gameHydrating = useGameStore((s) => s.gameHydrating);
  const refreshReportsFromServer = useGameStore((s) => s.refreshReportsFromServer);
  const incomingAttacks = useGameStore((s) => s.incomingAttacks ?? STORE_EMPTY_ARRAY);
  const idleAgents = city?.idleAgents ?? 0;
  const intelOps = useGameStore((s) => s.intelOperations ?? STORE_EMPTY_ARRAY);
  const sendIntelOperation = useGameStore((s) => s.sendIntelOperation);
  const startCyberVirusExpedition = useGameStore((s) => s.startCyberVirusExpedition);
  const startKbrnChemExpedition = useGameStore((s) => s.startKbrnChemExpedition);
  const requestMapTargetPick = useGameStore((s) => s.requestMapTargetPick);
  const mapTargetPickResult = useGameStore((s) => s.mapTargetPickResult);
  const clearMapTargetPickResult = useGameStore((s) => s.clearMapTargetPickResult);

  const counterPct = useMemo(() => getCounterIntelProtectionPct(city), [city]);
  const progression = getProgressionState(city);
  const kbrnBranchOk = progression.kbrnUnlocked && isKbrnBranchUnlocked(city);
  const researches = useGameStore((s) => s.researches ?? STORE_EMPTY_ARRAY);
  const chemUnlocked = canLaunchStealthCbrnOp(researches);
  const chemLevel = getWeaponDevelopmentLevel(researches);

  const cyberTargets = useMemo(() => {
    const own = new Set(playerCities.map((c) => c.name));
    return mapCities.filter(
      (c) => !own.has(c.name) && (c.status === 'enemy' || c.status === 'bot' || c.owner),
    );
  }, [mapCities, playerCities]);

  const [agentTargetName, setAgentTargetName] = useState('');
  const [cyberTargetName, setCyberTargetName] = useState('');
  const [agentCount, setAgentCount] = useState(1);
  const [kbrnTargetName, setKbrnTargetName] = useState('');
  const [kbrnAgents, setKbrnAgents] = useState(2);
  const [agentOpId, setAgentOpId] = useState(AGENT_OPERATIONS[0]?.id ?? '');
  const [activeSection, setActiveSection] = useState('intel');
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const hasAgents = idleAgents > 0;

  useEffect(() => {
    if (gameHydrating) return undefined;
    refreshReportsFromServer().catch(() => {});
    return undefined;
  }, [gameHydrating, refreshReportsFromServer]);

  useEffect(() => {
    const sections = [
      { id: 'intel-agents', key: 'intel' },
      { id: 'intel-cyber', key: 'cyber' },
      { id: 'intel-kbrn', key: 'kbrn' },
    ];
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean);
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const match = sections.find((s) => s.id === visible[0].target.id);
        if (match) setActiveSection(match.key);
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0.12, 0.35, 0.6] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [progression.cyberUnlocked, progression.kbrnUnlocked]);

  useEffect(() => {
    if (!mapTargetPickResult?.cityName) return;
    const needsTargets = mapTargetPickResult.field !== 'agent';
    if (needsTargets && !cyberTargets.length) return;
    const resolved = resolveIntelTargetName(mapTargetPickResult.cityName, cyberTargets);
    if (mapTargetPickResult.field === 'agent') setAgentTargetName(resolved);
    if (mapTargetPickResult.field === 'cyber' || mapTargetPickResult.field === 'kbrn') {
      setCyberTargetName(resolved);
      if (mapTargetPickResult.field === 'kbrn') setKbrnTargetName(resolved);
    }
    clearMapTargetPickResult();
  }, [mapTargetPickResult, cyberTargets, clearMapTargetPickResult]);

  const resolvedCyberName = cyberTargetName || cyberTargets[0]?.name || '';
  const selectedTarget = cyberTargets.find((c) => c.name === resolvedCyberName) ?? cyberTargets[0];
  const resolvedAgentName = agentTargetName || resolvedCyberName;

  const activeIntelAgentOps = useMemo(
    () => filterActiveIntelOperations(intelOps, now),
    [intelOps, now],
  );

  const activeIntelExpeditions = useMemo(
    () => filterIntelCategoryExpeditions(expeditions, now),
    [expeditions, now],
  );

  const activeCyberExpeditions = useMemo(
    () => activeIntelExpeditions.filter((e) => e.mode === 'cyber'),
    [activeIntelExpeditions],
  );

  const activeKbrnExpeditions = useMemo(
    () => activeIntelExpeditions.filter((e) => e.mode === 'kbrn'),
    [activeIntelExpeditions],
  );

  const activeSpyExpeditions = useMemo(
    () => activeIntelExpeditions.filter((e) => e.mode === 'spy'),
    [activeIntelExpeditions],
  );

  const activeOpsCount = activeIntelAgentOps.length + activeIntelExpeditions.length;

  const enemySpyWarning = useMemo(() => {
    const ownNames = new Set(playerCities.map((c) => c.name));
    const ownIds = new Set(playerCities.map((c) => c.id));
    const lines = [];

    for (const exp of expeditions) {
      if (exp.direction !== 'outgoing') continue;
      const hitsUs = ownNames.has(exp.target) || ownIds.has(exp.targetCityId);
      if (!hitsUs) continue;
      const label = exp.mode === 'cyber' ? 'Siber saldırı' : exp.type?.includes('Casus') ? 'Casus seferi' : 'Sefer';
      lines.push(`${label}: ${exp.originCityName ?? 'Düşman'} → ${exp.target}`);
    }

    for (const atk of incomingAttacks ?? []) {
      if (ownIds.has(atk.targetCityId)) {
        lines.push(`Gelen saldırı: ${atk.originCityName ?? 'Düşman'} → ${atk.targetCityName ?? 'Üs'}`);
      }
    }

    return lines.length ? lines.slice(0, 2).join(' · ') : null;
  }, [expeditions, incomingAttacks, playerCities]);

  const kbrnResolvedTarget = cyberTargets.find(
    (c) => c.name === (kbrnTargetName || resolvedCyberName),
  ) ?? selectedTarget;

  const kbrnIntrusionPreview = useMemo(() => {
    if (!kbrnResolvedTarget) return null;
    const defenderDecon = resolveDefenderDeconLevel({ mapCity: kbrnResolvedTarget });
    const chance = calcCbrnIntrusionChance(chemLevel, defenderDecon);
    return {
      defenderDecon,
      chance: Math.round(chance * 100),
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
    const returnPath = `${location.pathname}${location.search}`;
    requestMapTargetPick(field, returnPath);
    navigate('/harita', {
      state: { mapPickField: field, mapPickReturn: returnPath },
    });
  };

  const requestIntelConfirm = (cityName, operationName, onConfirm) => {
    setPendingConfirm({ cityName, operationName, onConfirm });
  };

  const handleAgentSend = (op) => {
    const target = resolvedAgentName || cyberTargets[0]?.name;
    if (!target || !op) return;
    requestIntelConfirm(target, op.name, () => {
      sendIntelOperation({ target, opType: op.name, opId: op.id, agentCount: 1 });
    });
  };

  const selectedAgentOp = AGENT_OPERATIONS.find((op) => op.id === agentOpId) ?? AGENT_OPERATIONS[0];

  const handleCyberSend = (abilityId) => {
    if (!selectedTarget) return;
    const ability = CYBER_ABILITIES.find((a) => a.id === abilityId);
    if (!ability) return;
    requestIntelConfirm(selectedTarget.name, ability.name, () => {
      startCyberVirusExpedition({
        targetCity: selectedTarget,
        abilityId,
        agentCount,
      });
    });
  };

  const handleKbrnSend = () => {
    if (!kbrnResolvedTarget) return;
    requestIntelConfirm(kbrnResolvedTarget.name, KBRN_CHEM_PRESSURE_OP.name, () => {
      startKbrnChemExpedition({
        targetCity: kbrnResolvedTarget,
        agentCount: kbrnAgents,
      });
    });
  };

  return (
    <div className="page page--console page--intel">
      <LocalizedPageHeader pageKey="intelligence" />

      <IntelSummaryPanel
        totalAgents={idleAgents}
        activeOpsCount={activeOpsCount}
        counterIntelPct={counterPct}
        reports={reports}
        enemySpyWarning={enemySpyWarning}
      />

      <nav className="intel-section-nav intel-section-nav--tabs" aria-label={t('pages.intelligence.sectionNavAria')}>
        <a
          href="#intel-agents"
          className={`intel-section-nav__link${activeSection === 'intel' ? ' intel-section-nav__link--active' : ''}`}
          onClick={() => setActiveSection('intel')}
        >
          {t('pages.intelligence.navIntel')}
        </a>
        <a
          href="#intel-cyber"
          className={`intel-section-nav__link${activeSection === 'cyber' ? ' intel-section-nav__link--active' : ''}`}
          onClick={() => setActiveSection('cyber')}
        >
          {t('pages.intelligence.navCyber')}
        </a>
        <a
          href="#intel-kbrn"
          className={`intel-section-nav__link${activeSection === 'kbrn' ? ' intel-section-nav__link--active' : ''}`}
          onClick={() => setActiveSection('kbrn')}
        >
          {t('pages.intelligence.navKbrn')}
        </a>
      </nav>

      <IntelConfirmDialog
        open={Boolean(pendingConfirm)}
        cityName={pendingConfirm?.cityName}
        operationName={pendingConfirm?.operationName}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          const action = pendingConfirm?.onConfirm;
          setPendingConfirm(null);
          action?.();
        }}
      />

      <IntelAccordion
        id="intel-ops-active"
        title={t('pages.intelligence.activeOpsTitle')}
        icon="📡"
        defaultOpen
        badge={activeOpsCount}
      >
        {activeOpsCount > 0 ? (
          <ul className="intel-list">
            {activeIntelAgentOps.map((op) => (
              <IntelListRow key={op.id} seedKey={op.id}>
                <strong>{op.opType}</strong>
                <span>{op.target}</span>
                <span className="badge">{t('pages.intelligence.badgeAgent')}</span>
                <span className="timer">{formatSeconds(remainingFromEndsAt(op.endsAt, now))}</span>
              </IntelListRow>
            ))}
            {activeSpyExpeditions.map((exp) => (
              <IntelListRow key={exp.id} seedKey={exp.id}>
                <strong>{exp.type ?? t('pages.intelligence.spyProbe')}</strong>
                <span>{exp.originCityName} → {exp.target}</span>
                <span className="badge">{t('pages.intelligence.badgeSpy')}</span>
                <span className="timer">{formatSeconds(remainingFromEndsAt(exp.endsAt, now))}</span>
              </IntelListRow>
            ))}
            {activeCyberExpeditions.map((exp) => (
              <IntelListRow key={exp.id} seedKey={exp.id}>
                <strong>{exp.troopPayload?.cyberVirus?.abilityId ?? t('pages.intelligence.badgeCyber')}</strong>
                <span>{exp.originCityName} → {exp.target}</span>
                <span className="badge">{t('pages.intelligence.badgeCyber')}</span>
                <span className="timer">{formatSeconds(remainingFromEndsAt(exp.endsAt, now))}</span>
              </IntelListRow>
            ))}
            {activeKbrnExpeditions.map((exp) => (
              <IntelListRow key={exp.id} seedKey={exp.id}>
                <strong>{t('pages.intelligence.chemPressure')}</strong>
                <span>{exp.originCityName} → {exp.target}</span>
                <span className="badge badge--kbrn">{t('pages.intelligence.badgeKbrn')}</span>
                <span className="timer">{formatSeconds(remainingFromEndsAt(exp.endsAt, now))}</span>
              </IntelListRow>
            ))}
          </ul>
        ) : (
          <div className="intel-ops-empty-wrap">
            <QueueEmptyState
              as="div"
              tag={t('pages.intelligence.activeOpsEmptyTag')}
              title={t('pages.intelligence.activeOpsEmptyTitle')}
              hint={t('pages.intelligence.activeOpsEmptyHint')}
              icon="📡"
            />
          </div>
        )}
      </IntelAccordion>

      <LockedFeatureGate buildingId="intel" featureName="Ajan operasyonları">
        <IntelAccordion id="intel-agents" title="Ajan Operasyonları" icon="🕵️" defaultOpen>
          {!hasAgents ? (
            <IntelNoAgentsAlert />
          ) : (
            <>
              <IntelTargetPicker
                label="KOD ADI"
                value={resolvedAgentName}
                onChange={setAgentTargetName}
                targets={cyberTargets}
                onMapPick={() => goMapPick('agent')}
                disabled={!cyberTargets.length}
              />
              <label className="intel-target-picker intel-op-type-field">
                <span className="intel-target-picker__label">OPERASYON TİPİ</span>
                <CustomDropdown
                  className="intel-target-picker__select"
                  value={agentOpId}
                  onChange={setAgentOpId}
                  aria-label="Operasyon tipi"
                  options={AGENT_OPERATIONS.map((op) => ({
                    value: op.id,
                    label: op.name,
                  }))}
                />
              </label>
              {selectedAgentOp && (
                <article className="intel-op-card intel-op-card--preview">
                  <div className="intel-op-card__body">
                    <strong className="intel-op-card__title">{selectedAgentOp.name}</strong>
                    <p className="intel-op-card__desc">{selectedAgentOp.desc}</p>
                    <span className="hint intel-op-card__cost">{selectedAgentOp.cost}</span>
                  </div>
                  <IntelOpActionButton
                    className="btn-sm"
                    locked={!resolvedAgentName || !cyberTargets.length}
                    onClick={() => handleAgentSend(selectedAgentOp)}
                  >
                    Gönder
                  </IntelOpActionButton>
                </article>
              )}
            </>
          )}
        </IntelAccordion>
      </LockedFeatureGate>

      {!progression.cyberUnlocked ? (
        <section id="intel-cyber" className="panel intel-progression-lock intel-section-anchor">
          <h3 className="panel-title">Siber Operasyonlar</h3>
          <p className="hint">🔒 {progression.locks.cyber}</p>
        </section>
      ) : (
        <LockedFeatureGate buildingId="cyber_ops" featureName="Siber operasyonlar">
          <IntelAccordion id="intel-cyber" title="Siber Operasyonlar" icon="💻" alwaysOpen>
            {cyberTargets.length === 0 ? (
              <MilitaryEmptyState
                variant="inline"
                tag="[ HEDEF YOK ]"
                icon="🛰️"
                title="Saldırılabilir düşman üssü yok"
                hint="Haritada keşfedilen bot veya oyuncu üsleri burada listelenir."
              />
            ) : !hasAgents ? (
              <IntelNoAgentsAlert />
            ) : (
              <>
                <IntelTargetPicker
                  label="KOD ADI"
                  value={resolvedCyberName}
                  onChange={setCyberTargetName}
                  targets={cyberTargets}
                  onMapPick={() => goMapPick('cyber')}
                />
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
                <ul className="ops-list ops-list--cards">
                  {CYBER_ABILITIES.map((ability) => (
                    <li key={ability.id} className="intel-op-card intel-op-card--cyber">
                      <div className="intel-op-card__body">
                        <strong className="intel-op-card__title">{ability.name}</strong>
                        <p className="intel-op-card__desc">{ability.desc}</p>
                        <span className="hint intel-op-card__cost">{ability.cost}</span>
                      </div>
                      <IntelOpActionButton
                        className="btn-sm"
                        locked={idleAgents < agentCount || !selectedTarget}
                        onClick={() => handleCyberSend(ability.id)}
                      >
                        Gönder
                      </IntelOpActionButton>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </IntelAccordion>
        </LockedFeatureGate>
      )}

      {!progression.kbrnUnlocked ? (
        <section id="intel-kbrn" className="panel intel-progression-lock intel-section-anchor">
          <h3 className="panel-title">KBRN Operasyonları</h3>
          <p className="hint">🔒 {progression.locks.kbrn}</p>
        </section>
      ) : (
        <LockedFeatureGate buildingId="research" featureName="KBRN operasyonu">
          <IntelAccordion id="intel-kbrn" title="KBRN Operasyonları" icon="☢️" alwaysOpen>
            {!chemUnlocked ? (
              <MilitaryEmptyState
                variant="inline"
                tag="[ AR-GE GEREKLİ ]"
                icon="☢️"
                title="Kimyasal Baskı kilitli"
                hint={`${KBRN_CHEM_PRESSURE_OP.researchRequired} tamamlayın.`}
                actionLabel="Ar-Ge"
                actionTo="/ar-ge"
              />
            ) : cyberTargets.length === 0 ? (
              <MilitaryEmptyState
                variant="inline"
                tag="[ HEDEF YOK ]"
                icon="🎯"
                title="Haritada hedef üs yok"
                hint="Haritadan hedef seçin."
              />
            ) : !hasAgents ? (
              <IntelNoAgentsAlert />
            ) : (
              <>
                <IntelTargetPicker
                  label="KOD ADI"
                  value={kbrnTargetName || resolvedCyberName}
                  onChange={setKbrnTargetName}
                  targets={cyberTargets}
                  onMapPick={() => goMapPick('kbrn')}
                />
                <article className="intel-op-card intel-op-card--kbrn">
                  <div className="intel-op-card__body">
                    <strong className="intel-op-card__title">{KBRN_CHEM_PRESSURE_OP.name}</strong>
                    <p className="intel-op-card__desc">{KBRN_CHEM_PRESSURE_OP.desc}</p>
                    {kbrnIntrusionPreview && (
                      <p className="hint intel-op-card__meta">
                        Bulaşma %{kbrnIntrusionPreview.chance} · DEF Lv.{kbrnIntrusionPreview.defenderDecon}
                        {' · '}ETA {formatSeconds(kbrnTravelSeconds)}
                      </p>
                    )}
                    <span className="hint intel-op-card__cost intel-op-card__cost--heavy">
                      {kbrnIntrusionPreview?.cost ?? getCbrnChemOpCost(chemLevel)}
                    </span>
                  </div>
                  <label className="intel-cyber-target intel-cyber-target--inline">
                    Operatör
                    <input
                      type="number"
                      className="input-qty"
                      min={1}
                      max={idleAgents}
                      value={kbrnAgents}
                      onChange={(e) => setKbrnAgents(Math.min(idleAgents, Math.max(1, Number(e.target.value) || 1)))}
                    />
                  </label>
                  <IntelOpActionButton
                    variant="danger"
                    locked={!kbrnBranchOk || idleAgents < kbrnAgents || !kbrnResolvedTarget}
                    onClick={handleKbrnSend}
                  >
                    Gönder
                  </IntelOpActionButton>
                </article>
              </>
            )}
          </IntelAccordion>
        </LockedFeatureGate>
      )}

      <p className="intel-footer-hint panel-hint">
        <span aria-hidden="true">📋</span>
        Tamamlanan operasyonlar{' '}
        <Link to="/raporlar">Raporlar → Operasyon Geçmişi</Link> sekmesinde arşivlenir.
      </p>
    </div>
  );
}
