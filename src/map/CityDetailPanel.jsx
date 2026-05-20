import { useEffect, useMemo, useState } from 'react';
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
import { isCityInOperationRange } from '../lib/mapRange';
import { getCityOwnerLabel } from './mapOwnership';
import { CITY_STATUS_COLORS } from './mapUtils';
import TroopStockLabel from '../components/TroopStockLabel';
import ExpeditionEtaStrip from '../components/ExpeditionEtaStrip';
import {
  calcExpeditionTravelSeconds,
  isAirOnlyExpedition,
  resolveCityCoords,
} from '../lib/expeditionTravel';
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
  empty: 'Boş — işgal edilebilir',
  vassal: 'Vasal üs',
  bot: 'Bot üssü',
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
          className="input-qty"
          min={0}
          max={idleCap}
          value={value}
          onChange={(e) => onChange(Math.min(idleCap, Math.max(0, Number(e.target.value) || 0)))}
        />
        <button type="button" className="btn btn-max" onClick={() => onChange(idleCap)}>
          MAX
        </button>
      </div>
    </div>
  );
}

function useLiveMapCity(mapCity) {
  const playerName = getCurrentPlayerName();

  return useGameStore(
    useShallow((s) => {
      if (!mapCity?.name) return null;
      const live = s.mapCities.find((c) => c.name === mapCity.name) ?? mapCity;
      const pc = s.playerCities.find((p) => p.name === mapCity.name);
      const gameCity = pc ? s.cities[pc.id] : null;
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
    }),
  );
}

export default function CityDetailPanel({ city, onClose }) {
  if (!city) return null;
  return <MapCommandModal city={city} onClose={onClose} />;
}

function MapCommandModal({ city, onClose }) {
  const [actionMode, setActionMode] = useState(null);
  const [troopQty, setTroopQty] = useState({});
  const [spyQty, setSpyQty] = useState(1);
  const [cyberAgentQty, setCyberAgentQty] = useState(1);
  const [cyberAbilityId, setCyberAbilityId] = useState(CYBER_ABILITIES[0]?.id ?? '');

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
  const { locked: actionLocked, runLocked } = useActionLock();

  const display = live ?? {
    live: city,
    population: city.population ?? 0,
    happiness: null,
    owner: city.owner || 'Boş',
    cyberActive: false,
    resources: null,
  };

  const mapCity = display.live;
  const color = CITY_STATUS_COLORS[mapCity.status] || '#9ca3af';
  const inRadarRange = isCityInOperationRange(mapCity, activeCityId, playerCities, mapCities);
  const isAnyOwnCity = mapCity.status === 'own';
  const canAttack = !isAnyOwnCity && mapCity.status !== 'empty' && inRadarRange;
  const canSpy = !isAnyOwnCity && (mapCity.status === 'enemy' || mapCity.status === 'bot') && inRadarRange;
  const outOfRange = mapCity.status !== 'own' && !inRadarRange;
  const cyberCapabilities = getCyberCapabilities();

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

  const originCoords = useMemo(
    () => resolveCityCoords(activeCityName, playerCities, mapCities),
    [activeCityName, playerCities, mapCities],
  );

  const attackDuration = useMemo(
    () => calcExpeditionTravelSeconds({
      origin: originCoords,
      target: { lat: mapCity.lat, lng: mapCity.lng },
      troopQty,
      mapCities,
      mode: 'attack',
    }),
    [originCoords, mapCity.lat, mapCity.lng, troopQty, mapCities],
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
    const chance = calcCyberAttackSuccessChance(attackerFw, defenderFw);
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

  const confirmAttack = () => {
    if (!canStartAttack || actionLocked) return;
    runLocked(() => {
      const ok = startExpedition({ targetCity: mapCity, troopQty, mode: 'attack' });
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

  const resourceList = display.resources ?? [
    { id: 'food', label: 'Nüfus', icon: '👥' },
    { id: 'fuel', label: 'Petrol', icon: '🛢️' },
    { id: 'metal', label: 'Metal', icon: '🔩' },
    { id: 'energy', label: 'Enerji', icon: '⚡' },
    { id: 'money', label: 'Bütçe', icon: '💰' },
    { id: 'uranium', label: 'Uranyum', icon: '☢️' },
  ];

  return (
    <div className="map-command-modal-root" role="presentation">
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
              {STATUS_LABELS[mapCity.status] ?? mapCity.status}
            </span>
          </div>
          <button type="button" className="map-command-modal__close" onClick={onClose} aria-label="Kapat">
            ×
          </button>
        </header>

        <div className="map-command-modal__stats">
          <div className="map-command-modal__stat">
            <span className="map-command-modal__stat-label">Sahip</span>
            <strong>{display.live.owner || 'Boş'}</strong>
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

        <section className="map-command-modal__resources" aria-label="Kaynak durumu">
          <h3 className="map-command-modal__section-title">Kaynak Durumu</h3>
          <ul className="map-command-modal__resource-grid">
            {resourceList.map((r) => (
              <li key={r.id}>
                <span>{r.icon} {r.label}</span>
                <strong>
                  {typeof r.current === 'number'
                    ? Math.floor(r.current).toLocaleString('tr-TR')
                    : '—'}
                  {r.max != null ? ` / ${Math.floor(r.max).toLocaleString('tr-TR')}` : ''}
                </strong>
              </li>
            ))}
          </ul>
        </section>

        {outOfRange && (
          <p className="map-command-modal__warn">Radar menzili dışı — taktiksel emirler kilitli.</p>
        )}

        {!actionMode && (
          <div className="map-command-modal__actions">
            <button
              type="button"
              className="map-cmd-btn map-cmd-btn--troops"
              disabled={!canAttack || outOfRange}
              onClick={() => setActionMode('troops')}
            >
              [ ORDULARI KAYDIR ]
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
            <h3>Ordu kaydırma — {activeCityName}</h3>
            <ExpeditionEtaStrip durationSeconds={attackDuration} airRush={airRushAttack} />
            {idleTroops.map((t) => (
              <TroopDispatchRow
                key={t.id}
                troop={t}
                awayMap={awayMap}
                value={troopQty[t.id] ?? 0}
                onChange={(v) => setTroopQty((prev) => ({ ...prev, [t.id]: v }))}
              />
            ))}
            <div className="map-command-modal__panel-actions">
              <button type="button" className="btn btn-danger" disabled={!canStartAttack || actionLocked} onClick={confirmAttack}>
                Seferi Başlat
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActionMode(null)}>
                Geri
              </button>
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
              <button type="button" className="btn btn-primary" disabled={!canStartSpy || actionLocked} onClick={confirmSpy}>
                Sonda Gönder
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActionMode(null)}>
                Geri
              </button>
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
                    <strong>{ability.name}</strong>
                    <span>{ability.subtitle ?? ability.desc}</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={!unlocked}
                      onClick={() => setCyberAbilityId(ability.id)}
                    >
                      {unlocked ? (selected ? 'Seçili' : 'Seç') : `Sv.${ability.minLevel}`}
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
                Virüs Gönder
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActionMode(null)}>
                Geri
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
