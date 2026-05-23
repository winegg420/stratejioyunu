import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { useActionLock } from '../hooks/useActionLock';
import { formatHappinessLabel, pruneCyberEffects } from '../lib/happinessSystem';
import { getTroopStock } from '../lib/troopStock';
import { CYBER_ABILITIES, getCyberOpsLevel } from '../lib/cyberOps';
import {
  calcCyberAttackSuccessChance,
  calcCyberVirusTravelSeconds,
  resolveDefenderCyberOpsLevel,
} from '../utils/spyEngine';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { findSpyReportForCity } from '../lib/spyIntel';
import { useLanguage } from '../context/LanguageContext';
import {
  calcAttackerIntelPower,
  calcDefenderIntelDefense,
  WATCHLIST_AGENT_COST,
} from '../lib/watchlistSystem';
import { isCityInOperationRange } from '../lib/mapRange';
import { bypassWarLocksForDevTest } from '../lib/devTestMode';
import { getCyberSuccessBonus, formatIdeologyLabel, isNaturalAlly } from '../lib/ideologySystem';
import { getCityOwnerLabel } from './mapOwnership';
import {
  formatMapOwnerDisplay,
  formatMapStatusBadge,
  formatResourceValue,
} from './mapDisplayLabels';
import { getMapCityDisplayColor } from './mapUtils';
import TroopStockLabel from '../components/TroopStockLabel';
import ExpeditionEtaStrip from '../components/ExpeditionEtaStrip';
import {
  calcExpeditionTravelSeconds,
  isAirOnlyExpedition,
  resolveCityCoords,
} from '../lib/expeditionTravel';
import {
  evaluateConquestAttempt,
  getEmpireOverview,
  getNearestEmpireOrigin,
} from '../lib/empireExpansion';
import { isConquerableMapTarget } from '../lib/worldCitySystem';
import CargoLogisticsPanel from '../components/CargoLogisticsPanel';
import CityInflightSupply from '../components/CityInflightSupply';
import HudBackButton from '../components/HudBackButton';
import ExpeditionTroopAccordion from '../components/ExpeditionTroopAccordion';
import CustomDropdown from '../components/CustomDropdown';
import { calcSpyProbeTravelSeconds } from '../utils/spyEngine';
import {
  useActiveCityIdleTroops,
  useActiveCityResources,
  useGameStore,
  useTroopsAwayMap,
} from '../stores/gameStore';

const STATUS_LABELS = {
  own: 'Kendi üssünüz',
  enemy: 'Düşman üssü',
  empty: 'Fethedilmemiş Bölge',
  vassal: 'Vasal üs',
  bot: '[ OTOMATİK YÖNETİM ]',
  siege: 'Kuşatma altında',
};

function TroopDispatchRow({ troop, value, onChange, awayMap }) {
  const stock = getTroopStock(troop, awayMap);
  const idleCap = stock.idle;

  return (
    <div className="map-cmd-troop-row">
      <div className="map-cmd-troop-meta">
        <span className="map-cmd-troop-icon" aria-hidden="true">{troop.icon}</span>
        <div>
          <span className="map-cmd-troop-name">{troop.name}</span>
          <TroopStockLabel troop={troop} awayMap={awayMap} className="map-cmd-troop-stock" />
        </div>
      </div>
      <div className="map-cmd-troop-input">
        <input
          type="number"
          className="input-qty expedition-input-qty"
          min={0}
          max={idleCap}
          value={value}
          onChange={(e) => onChange(Math.min(idleCap, Math.max(0, Number(e.target.value) || 0)))}
        />
        <button type="button" className="btn btn-hud-secondary btn-sm expedition-troop-max" onClick={() => onChange(idleCap)}>
          MAX
        </button>
      </div>
    </div>
  );
}

function useLiveMapCity(mapCity) {
  const playerName = getCurrentPlayerName();
  const mapCities = useGameStore((s) => s.mapCities);
  const playerCities = useGameStore((s) => s.playerCities);
  const cities = useGameStore((s) => s.cities);

  return useMemo(() => {
    if (!mapCity?.name) return null;
    const live = mapCities.find((c) => c.name === mapCity.name) ?? mapCity;
    const pc = playerCities.find((p) => p.name === mapCity.name);
    const gameCity = pc ? cities[pc.id] : null;
    const owner = getCityOwnerLabel(live, playerName);
    const cyberActive = pruneCyberEffects(gameCity?.cyberEffects ?? []).length > 0;

    return {
      live: { ...live, owner },
      pc,
      gameCity,
      population: gameCity?.population ?? live.population ?? 0,
      happiness: gameCity?.happiness ?? null,
      taxRate: gameCity?.taxRate ?? null,
      resources: gameCity?.resources ?? null,
      cyberActive,
      cyberEffects: gameCity?.cyberEffects ?? [],
    };
  }, [mapCity, mapCities, playerCities, cities, playerName]);
}

export default function CityDetailPanel({ city, onClose }) {
  if (!city) return null;
  return <MapCommandModal city={city} onClose={onClose} />;
}

function MapCommandModal({ city, onClose }) {
  const { t } = useLanguage();
  const [actionMode, setActionMode] = useState(null);
  const [troopQty, setTroopQty] = useState({});
  const [spyQty, setSpyQty] = useState(1);
  const [cyberAgentQty, setCyberAgentQty] = useState(1);
  const [cyberAbilityId, setCyberAbilityId] = useState(CYBER_ABILITIES[0]?.id ?? '');

  useLayoutEffect(() => {
    document.body.classList.add('map-city-panel-open');
    const mobile = window.matchMedia('(max-width: 900px)').matches;
    if (mobile) document.body.classList.add('map-scroll-locked');
    return () => {
      document.body.classList.remove('map-city-panel-open');
      if (mobile) document.body.classList.remove('map-scroll-locked');
    };
  }, []);

  const live = useLiveMapCity(city);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const activeCityName = useGameStore(
    (s) => s.playerCities.find((c) => c.id === s.activeCityId)?.name ?? '',
  );
  const idleTroops = useActiveCityIdleTroops();
  const resources = useActiveCityResources();
  const idleSpies = useGameStore((s) => s.cities[s.activeCityId]?.idleSpies ?? 0);
  const idleAgents = useGameStore((s) => s.cities[s.activeCityId]?.idleAgents ?? 0);
  const originCity = useGameStore((s) => s.cities[s.activeCityId]);
  const awayMap = useTroopsAwayMap(activeCityId);
  const startExpedition = useGameStore((s) => s.startExpedition);
  const startCyberVirusExpedition = useGameStore((s) => s.startCyberVirusExpedition);
  const getCyberCapabilities = useGameStore((s) => s.getCyberCapabilities);
  const mapCities = useGameStore((s) => s.mapCities);
  const playerCities = useGameStore((s) => s.playerCities);
  const playerIdeology = useGameStore((s) => s.playerIdeology);
  const researches = useGameStore((s) => s.researches);
  const watchlist = useGameStore((s) => s.watchlist ?? []);
  const reports = useGameStore((s) => s.reports ?? []);
  const addWatchTarget = useGameStore((s) => s.addWatchTarget);
  const playerName = getCurrentPlayerName();
  const gameStateSlice = useGameStore(
    useShallow((s) => ({
      playerCities: s.playerCities,
      cities: s.cities,
      mapCities: s.mapCities,
    })),
  );
  const { locked: actionLocked, runLocked } = useActionLock();

  const display = live ?? {
    live: city,
    population: city.population ?? 0,
    happiness: null,
    owner: formatMapOwnerDisplay(city, playerName),
    cyberActive: false,
    resources: null,
  };

  const mapCity = display.live;
  const targetIdeology = mapCity.ownerIdeology ?? null;
  const naturalAlly = playerIdeology && targetIdeology
    && isNaturalAlly(playerIdeology, targetIdeology)
    && mapCity.status !== 'own';
  const color = getMapCityDisplayColor(mapCity);
  const devWarBypass = bypassWarLocksForDevTest();
  const inRadarRange = isCityInOperationRange(mapCity, activeCityId, playerCities, mapCities);
  const isAnyOwnCity = mapCity.status === 'own';
  const isHostileTarget = mapCity.status !== 'own' && mapCity.status !== 'empty';
  const isConquerTarget = isConquerableMapTarget(mapCity, gameStateSlice);
  const conquestEval = useMemo(
    () => evaluateConquestAttempt(gameStateSlice, mapCity),
    [gameStateSlice, mapCity],
  );
  const canAttack = !isAnyOwnCity && (
    devWarBypass
      ? mapCity.status !== 'own'
      : isConquerTarget || (mapCity.status !== 'empty' && inRadarRange)
  );
  const canSpy = !isAnyOwnCity && (
    devWarBypass
      ? mapCity.status !== 'own'
      : (mapCity.status === 'enemy' || mapCity.status === 'bot') && inRadarRange
  );
  const outOfRange = !devWarBypass && !isConquerTarget && mapCity.status !== 'own' && !inRadarRange;
  const cyberCapabilities = getCyberCapabilities() ?? [];

  const [cargoDestId, setCargoDestId] = useState('');
  const [attackIntent, setAttackIntent] = useState('raid');

  useEffect(() => {
    if (actionMode !== 'troops' || !devWarBypass) return;
    const total = Object.values(troopQty).reduce((a, b) => a + (Number(b) || 0), 0);
    if (total > 0) return;
    const starter = idleTroops.find((t) => (t.available ?? 0) > 0);
    if (starter) {
      setTroopQty({ [starter.id]: 1 });
    }
  }, [actionMode, devWarBypass, idleTroops, troopQty]);

  useEffect(() => {
    setActionMode(null);
    setTroopQty({});
    setSpyQty(1);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [city?.name, onClose]);

  useEffect(() => {
    const others = playerCities.filter((p) => p.id !== activeCityId);
    setCargoDestId(others[0]?.id ?? '');
  }, [city?.name, activeCityId, playerCities]);

  useEffect(() => {
    if (conquestEval.raidOnly) {
      setAttackIntent('raid');
    } else if (conquestEval.ok) {
      setAttackIntent('conquest');
    } else {
      setAttackIntent('raid');
    }
  }, [mapCity.name, conquestEval.ok, conquestEval.raidOnly]);

  const originCoords = useMemo(
    () => resolveCityCoords(activeCityName, playerCities, mapCities),
    [activeCityName, playerCities, mapCities],
  );

  const attackOrigin = useMemo(() => {
    const nearest = getNearestEmpireOrigin(
      { lat: mapCity.lat, lng: mapCity.lng },
      playerCities,
      mapCities,
    );
    return (conquestEval.ok && nearest.origin) ? nearest.origin : originCoords;
  }, [mapCity.lat, mapCity.lng, playerCities, mapCities, conquestEval.ok, originCoords]);

  const attackDuration = useMemo(
    () => calcExpeditionTravelSeconds({
      origin: attackOrigin,
      target: { lat: mapCity.lat, lng: mapCity.lng },
      troopQty,
      mapCities,
      mode: 'attack',
      empireTravelMult: conquestEval.ok ? conquestEval.travelMult : 1,
    }),
    [attackOrigin, mapCity.lat, mapCity.lng, troopQty, mapCities, conquestEval],
  );

  const spyDuration = useMemo(
    () => calcSpyProbeTravelSeconds({
      origin: originCoords,
      target: { lat: mapCity.lat, lng: mapCity.lng },
      spyCount: spyQty,
      mapCities,
    }),
    [originCoords, mapCity.lat, mapCity.lng, spyQty, mapCities],
  );

  const cyberDuration = useMemo(
    () => calcCyberVirusTravelSeconds({
      origin: originCoords,
      target: { lat: mapCity.lat, lng: mapCity.lng },
      agentCount: cyberAgentQty,
      mapCities,
    }),
    [originCoords, mapCity.lat, mapCity.lng, cyberAgentQty, mapCities],
  );

  const cyberSuccessPreview = useMemo(() => {
    if (!originCity) return null;
    const attackerFw = getCyberOpsLevel(originCity);
    const defenderFw = resolveDefenderCyberOpsLevel({ mapCity, defenderCity: display.gameCity });
    const chance = calcCyberAttackSuccessChance(
      attackerFw,
      defenderFw,
      getCyberSuccessBonus(playerIdeology),
    );
    return {
      attackerFw,
      defenderFw,
      diff: attackerFw - defenderFw,
      chancePct: Math.round(chance * 100),
    };
  }, [originCity, mapCity, display.gameCity]);

  const attackTotal = Object.values(troopQty).reduce((a, b) => a + (Number(b) || 0), 0);
  const canStartAttack =
    attackTotal >= 1
    && idleTroops.every((t) => (Number(troopQty[t.id]) || 0) <= t.available);
  const canStartSpy = spyQty >= 1 && spyQty <= idleSpies;
  const airRushAttack = isAirOnlyExpedition(troopQty);

  const targetOwner = mapCity.owner && mapCity.owner !== playerName && mapCity.status !== 'empty'
    ? mapCity.owner
    : null;
  const alreadyWatched = targetOwner && watchlist.some((w) => w.targetPlayer === targetOwner);
  const intelAtk = originCity ? calcAttackerIntelPower(originCity, researches) : 0;
  const intelDef = targetOwner
    ? calcDefenderIntelDefense({ mapCity, defenderCity: display.gameCity })
    : 0;
  const canWatchIntel = Boolean(
    targetOwner
    && !alreadyWatched
    && intelAtk > intelDef
    && idleAgents >= WATCHLIST_AGENT_COST,
  );

  const empireOverview = useMemo(
    () => getEmpireOverview(gameStateSlice),
    [gameStateSlice],
  );

  const targetPc = playerCities.find((p) => p.name === mapCity.name);
  const cargoTargetPc = targetPc && targetPc.id !== activeCityId ? targetPc : null;
  const otherColonies = playerCities.filter((p) => p.id !== activeCityId);
  const showCargoToClicked = Boolean(cargoTargetPc);
  const showCargoHub = isAnyOwnCity && mapCity.name === activeCityName && otherColonies.length > 0;
  const cargoDestCity = playerCities.find((p) => p.id === cargoDestId);

  const confirmAttack = () => {
    if (!canStartAttack || actionLocked) return;
    runLocked(() => {
      const ok = startExpedition({
        targetCity: mapCity,
        troopQty,
        mode: 'attack',
        attackIntent,
      });
      if (ok) onClose();
    });
  };

  const confirmSpy = () => {
    if (!canStartSpy || actionLocked) return;
    runLocked(() => {
      const ok = startExpedition({ targetCity: mapCity, troopQty: { spies: spyQty }, mode: 'spy' });
      if (ok) onClose();
    });
  };

  const spyReport = useMemo(
    () => findSpyReportForCity(reports, mapCity.name),
    [reports, mapCity.name],
  );

  const hasResourceIntel = Boolean(
    isAnyOwnCity
    || display.resources
    || spyReport,
  );

  const resourceList = display.resources ?? [
    { id: 'food', label: 'Nüfus', icon: '👥' },
    { id: 'fuel', label: 'Petrol', icon: '🛢️' },
    { id: 'hammadde', label: 'Hammadde', icon: '🧱' },
    { id: 'energy', label: 'Enerji', icon: '⚡' },
    { id: 'money', label: 'Bütçe', icon: '💰' },
    { id: 'uranium', label: 'Uranyum', icon: '☢️' },
  ];

  return createPortal(
    <div className="map-command-modal-root map-command-modal-root--portaled" role="presentation">
      <button
        type="button"
        className="map-command-modal__backdrop"
        onClick={onClose}
        aria-label="Komuta modalını kapat"
      />
      <div
        className="map-command-modal hud-panel-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-command-modal-title"
      >
        <span className="map-command-modal__screw map-command-modal__screw--tl" aria-hidden="true" />
        <span className="map-command-modal__screw map-command-modal__screw--tr" aria-hidden="true" />
        <span className="map-command-modal__screw map-command-modal__screw--bl" aria-hidden="true" />
        <span className="map-command-modal__screw map-command-modal__screw--br" aria-hidden="true" />

        <header className="map-command-modal__header">
          <div>
            <p className="map-command-modal__eyebrow">[ MERKEZİ KOMUTA MODALI ]</p>
            <h2 id="map-command-modal-title">{mapCity.name}</h2>
            <span className="map-command-modal__status" style={{ borderColor: color, color }}>
              {formatMapStatusBadge(mapCity) || (STATUS_LABELS[mapCity.status] ?? mapCity.status)}
            </span>
            {targetIdeology && (
              <span className="map-command-modal__ideology">
                {formatIdeologyLabel(targetIdeology)}
              </span>
            )}
            {naturalAlly && (
              <span className="map-command-modal__natural-ally">◈ Doğal Müttefik</span>
            )}
          </div>
          <button type="button" className="hud-modal-close map-command-modal__close" onClick={onClose} aria-label="Kapat">
            [ X ]
          </button>
        </header>

        <div className="map-command-modal__stats">
          <div className="map-command-modal__stat">
            <span className="map-command-modal__stat-label">Sahip</span>
            <strong>{formatMapOwnerDisplay(mapCity, playerName)}</strong>
          </div>
          <div className="map-command-modal__stat">
            <span className="map-command-modal__stat-label">Nüfus</span>
            <strong>{(display.population ?? 0).toLocaleString('tr-TR')}</strong>
          </div>
          <div className="map-command-modal__stat">
            <span className="map-command-modal__stat-label">Mutluluk</span>
            <strong>
              {display.happiness != null
                ? `%${display.happiness} · ${formatHappinessLabel(display.happiness)}`
                : '—'}
            </strong>
          </div>
          <div className="map-command-modal__stat">
            <span className="map-command-modal__stat-label">Koordinat</span>
            <strong className="font-hud-data">
              {mapCity.lat?.toFixed(2)}, {mapCity.lng?.toFixed(2)}
            </strong>
          </div>
          {display.cyberActive && (
            <div className="map-command-modal__stat map-command-modal__stat--alert">
              <span className="map-command-modal__stat-label">Siber baskı</span>
              <strong>AKTİF</strong>
            </div>
          )}
        </div>

        {live?.pc && (
          <CityInflightSupply cityId={live.pc.id} cityName={live.pc.name} />
        )}

        {hasResourceIntel ? (
          <section className="map-command-modal__resources" aria-label={t('map.cityPanel.resourcesAria')}>
            <h3 className="map-command-modal__section-title">{t('map.cityPanel.resourcesTitle')}</h3>
            <ul className="map-command-modal__resource-grid">
              {resourceList.map((r) => (
                <li key={r.id}>
                  <span>{r.icon} {r.label}</span>
                  <strong>
                    {formatResourceValue(r, mapCity)}
                  </strong>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <p className="map-command-modal__intel-locked" role="status">
            {t('map.cityPanel.resourcesLocked')}
          </p>
        )}

        {outOfRange && (
          <p className="map-command-modal__warn">Radar menzili dışı — taktiksel emirler kilitli.</p>
        )}

        {targetOwner && (
          <div className="map-command-modal__watch">
            <p className="hint">
              İstihbarat: Siz {intelAtk} · Savunma {intelDef}
              {alreadyWatched && ' · Zaten izleniyor'}
            </p>
            <button
              type="button"
              className="btn btn-secondary map-watch-intel-btn"
              disabled={!canWatchIntel || actionLocked}
              title={
                !canWatchIntel
                  ? `Casusluk+YZ &gt; hedef savunması ve ${WATCHLIST_AGENT_COST} ajan gerekli`
                  : undefined
              }
              onClick={() => runLocked(() => addWatchTarget({ targetPlayer: targetOwner, mapCity }))}
            >
              [ İSTİHBARAT AĞINA AL ]
            </button>
          </div>
        )}

        {showCargoToClicked && (
          <CargoLogisticsPanel
            originCityId={activeCityId}
            originCityName={activeCityName}
            targetCityId={cargoTargetPc.id}
            targetCityName={cargoTargetPc.name}
          />
        )}

        {showCargoHub && cargoDestCity && (
          <div className="map-command-modal__cargo-hub">
            <label className="cargo-logistics-field">
              <span>Hedef koloni</span>
              <CustomDropdown
                className="expedition-launch-select"
                value={cargoDestId}
                onChange={setCargoDestId}
                aria-label="Hedef koloni"
                options={otherColonies.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            </label>
            <CargoLogisticsPanel
              originCityId={activeCityId}
              originCityName={activeCityName}
              targetCityId={cargoDestCity.id}
              targetCityName={cargoDestCity.name}
            />
          </div>
        )}

        {!isAnyOwnCity && (
          <p className="map-command-modal__empire-hint">
            İmparatorluk: {empireOverview.owned}/{empireOverview.maxSlots}
            {empireOverview.mainHqName && ` · Ana Merkez: ${empireOverview.mainHqName}`}
            {' · '}{empireOverview.slotHint}
            {conquestEval.ok && conquestEval.distanceKm > 0 && (
              <> · Mesafe ~{Math.round(conquestEval.distanceKm)} km (sefer +{Math.round((conquestEval.travelMult - 1) * 100)}%)</>
            )}
            {conquestEval.ok === false && conquestEval.reason && isConquerTarget && (
              <> · <span className="city-panel-found-warn">{conquestEval.reason}</span></>
            )}
            {conquestEval.raidOnly && (
              <> · Ana Merkez: yalnızca yağma</>
            )}
          </p>
        )}

        {!actionMode && (
          <div className="map-command-modal__actions">
            <button
              type="button"
              className={`map-cmd-btn map-cmd-btn--troops${isConquerTarget ? ' map-cmd-btn--conquest' : ''}`}
              disabled={!canAttack || outOfRange}
              title={!conquestEval.ok && conquestEval.reason ? conquestEval.reason : undefined}
              onClick={() => setActionMode('troops')}
            >
              {isConquerTarget && conquestEval.ok ? '[ FETİH SEFERİ ]' : '[ ORDULARI KAYDIR ]'}
            </button>
            <button
              type="button"
              className="map-cmd-btn map-cmd-btn--intel"
              disabled={!canSpy || outOfRange}
              onClick={() => setActionMode('intel')}
            >
              [ İSTİHBARAT GÖNDER ]
            </button>
            <button
              type="button"
              className="map-cmd-btn map-cmd-btn--cyber"
              disabled={outOfRange || cyberCapabilities.length === 0}
              onClick={() => setActionMode('cyber')}
            >
              [ SİBER OPERASYON BAŞLAT ]
            </button>
          </div>
        )}

        {actionMode === 'troops' && (
          <section className="map-command-modal__panel">
            <h3>{isConquerTarget && conquestEval.ok ? `Fetih seferi — ${mapCity.name}` : `Ordu kaydırma — ${activeCityName}`}</h3>
            {!isAnyOwnCity && (
              <div className="expedition-intent-grid" role="radiogroup" aria-label="Sefer tipi">
                <button
                  type="button"
                  className={[
                    'expedition-intent-btn',
                    attackIntent === 'raid' && 'expedition-intent-btn--active',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setAttackIntent('raid')}
                >
                  <span className="expedition-intent-btn__label">YAĞMA (RAID)</span>
                  <span className="expedition-intent-btn__risk">
                    Düşük risk · Hammadde ganimeti · Şehir ele geçmez
                  </span>
                </button>
                <button
                  type="button"
                  className={[
                    'expedition-intent-btn',
                    attackIntent === 'conquest' && 'expedition-intent-btn--active',
                  ].filter(Boolean).join(' ')}
                  disabled={!conquestEval.ok || conquestEval.raidOnly}
                  onClick={() => setAttackIntent('conquest')}
                >
                  <span className="expedition-intent-btn__label">İŞGAL (CONQUEST)</span>
                  <span className="expedition-intent-btn__risk">
                    {conquestEval.raidOnly
                      ? 'Ana Merkez — yalnızca yağma mümkün'
                      : conquestEval.ok
                        ? 'Yüksek risk · Koloni kurulumu · Ağır kayıp'
                        : (conquestEval.reason ?? 'Fetih şartları sağlanmıyor')}
                  </span>
                </button>
              </div>
            )}
            <ExpeditionEtaStrip durationSeconds={attackDuration} airRush={airRushAttack} />
            <ExpeditionTroopAccordion
              troops={idleTroops}
              renderTroopRow={(t) => (
                <TroopDispatchRow
                  key={t.id}
                  troop={t}
                  awayMap={awayMap}
                  value={troopQty[t.id] ?? 0}
                  onChange={(v) => setTroopQty((prev) => ({ ...prev, [t.id]: v }))}
                />
              )}
            />
            <div className="map-command-modal__panel-actions map-command-modal__panel-actions--sticky">
              {!canStartAttack && (
                <p className="map-command-modal__hint map-command-modal__hint--attack">
                  {devWarBypass
                    ? 'En az 1 birlik seçin (admin modunda otomatik önerilir).'
                    : 'Saldırı için en az 1 boşta birlik seçin — hammadde tek başına yeterli değildir.'}
                </p>
              )}
              <button type="button" className="btn btn-hud-primary" disabled={!canStartAttack || actionLocked} onClick={confirmAttack}>
                {isConquerTarget && conquestEval.ok ? '[ FETİH BAŞLAT ]' : '[ SEFERİ BAŞLAT ]'}
              </button>
              <HudBackButton onStepBack={() => setActionMode(null)} />
            </div>
          </section>
        )}

        {actionMode === 'intel' && (
          <section className="map-command-modal__panel">
            <h3>İstihbarat sondası — {mapCity.name}</h3>
            <p className="map-command-modal__hint">Boşta casus: <strong>{idleSpies}</strong></p>
            <ExpeditionEtaStrip durationSeconds={spyDuration} />
            <div className="map-cmd-troop-row">
              <span>Casus sayısı</span>
              <input
                type="number"
                className="input-qty"
                min={1}
                max={idleSpies}
                value={spyQty}
                onChange={(e) => setSpyQty(Math.min(idleSpies, Math.max(1, Number(e.target.value) || 1)))}
              />
            </div>
            <div className="map-command-modal__panel-actions">
              <button type="button" className="btn btn-primary map-command-modal__panel-btn" disabled={!canStartSpy || actionLocked} onClick={confirmSpy}>
                SONDA_TX
              </button>
              <HudBackButton onStepBack={() => setActionMode(null)} />
            </div>
          </section>
        )}

        {actionMode === 'cyber' && (
          <section className="map-command-modal__panel">
            <h3>Siber Virüs/Ajan — {mapCity.name}</h3>
            <p className="map-command-modal__hint">
              Boşta ajan: <strong>{idleAgents}</strong>
              {cyberSuccessPreview && (
                <> · FW {cyberSuccessPreview.attackerFw} vs {cyberSuccessPreview.defenderFw}
                  {' '}(Δ{cyberSuccessPreview.diff >= 0 ? '+' : ''}{cyberSuccessPreview.diff})
                  {' '}— Sızma: <strong>%{cyberSuccessPreview.chancePct}</strong>
                </>
              )}
            </p>
            <ExpeditionEtaStrip durationSeconds={cyberDuration} />
            <div className="map-cmd-troop-row">
              <span>Siber ajan</span>
              <input
                type="number"
                className="input-qty"
                min={1}
                max={idleAgents}
                value={cyberAgentQty}
                onChange={(e) => setCyberAgentQty(Math.min(idleAgents, Math.max(1, Number(e.target.value) || 1)))}
              />
            </div>
            <ul className="map-command-modal__cyber-list">
              {CYBER_ABILITIES.map((ability) => {
                const unlocked = cyberCapabilities.some((c) => c.id === ability.id);
                const selected = cyberAbilityId === ability.id;
                return (
                  <li key={ability.id} className={selected ? 'map-cmd-cyber-selected' : ''}>
                    <strong className="map-command-modal__cyber-code" title={ability.name}>
                      {ability.mapCode ?? ability.name}
                    </strong>
                    <span className="map-command-modal__cyber-desc">{ability.subtitle ?? ability.desc}</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm map-command-modal__cyber-btn"
                      disabled={!unlocked}
                      onClick={() => setCyberAbilityId(ability.id)}
                    >
                      {unlocked ? (selected ? 'AKTİF' : 'SEÇ') : `SV${ability.minLevel}`}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="map-command-modal__panel-actions">
              <button
                type="button"
                className="btn btn-danger"
                disabled={
                  actionLocked
                  || idleAgents < cyberAgentQty
                  || !cyberCapabilities.some((c) => c.id === cyberAbilityId)
                }
                onClick={() => runLocked(() => {
                  const ok = startCyberVirusExpedition({
                    targetCity: mapCity,
                    abilityId: cyberAbilityId,
                    agentCount: cyberAgentQty,
                  });
                  if (ok) onClose();
                })}
              >
                VIRÜS_TX
              </button>
              <HudBackButton onStepBack={() => setActionMode(null)} />
            </div>
          </section>
        )}
      </div>
    </div>,
    document.body,
  );
}
