import { useMemo, useState } from 'react';
import { landUnits } from '../data/placeholder';
import { simulateBattle } from '../lib/battleSimulator';
import { extractCityFromReportTitle, findSpyReportForCity, getEnemyTroopsFromReport } from '../lib/spyIntel';
import { toRawInputNumber } from '../lib/formatNumber';
import { getTroopStock } from '../lib/troopStock';
import { mergeCityIdleTroops } from '../lib/buildingUtils';
import { useGameStore, useTroopsAwayMap } from '../stores/gameStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useLanguage } from '../context/LanguageContext';
import CyberDataInput from './CyberDataInput';
import CyberToggle from './CyberToggle';
import UnitMilitaryIcon from './UnitMilitaryIcon';

function emptyCounts() {
  return Object.fromEntries(landUnits.map((u) => [u.id, '']));
}

function sanitizeQtyInput(raw) {
  if (raw === '' || raw == null) return '';
  const n = Math.floor(Number(toRawInputNumber(raw) || 0));
  if (!Number.isFinite(n) || n < 0) return '0';
  return String(n);
}

function TroopInputGrid({
  title, counts, onChange, enabled, onToggleEnabled, side = 'u', readOnly = false, t, unitName,
}) {
  return (
    <fieldset className="battle-sim-fieldset">
      <legend>{title}</legend>
      <div className="battle-sim-grid">
        {landUnits.map((u) => {
          const key = `${side}-${u.id}`;
          const on = enabled[key] !== false;
          const label = unitName(u.id, u.name);
          return (
            <div
              key={key}
              className={`battle-sim-input-row${on ? '' : ' battle-sim-input-row--off'}`}
            >
              <span className="battle-sim-unit-label">
                <UnitMilitaryIcon unitId={u.id} size={20} />
                {label}
              </span>
              <CyberToggle
                checked={on}
                showX
                activeLabel={t('components.battleSimulator.toggleActive')}
                lockedLabel={t('components.battleSimulator.toggleLocked')}
                aria-label={t('components.battleSimulator.includeInSim', { name: label })}
                onChange={(v) => onToggleEnabled?.(key, v)}
              />
              <CyberDataInput
                value={counts[u.id] ?? ''}
                min={0}
                disabled={readOnly || !on}
                onChange={(e) => onChange(u.id, sanitizeQtyInput(e.target.value))}
              />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export default function BattleSimulator({ defaultTargetCity = '' }) {
  const { t, unitName } = useLanguage();
  const reports = useGameStore((s) => s.reports);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const rawIdleTroops = useGameStore((s) => s.cities[s.activeCityId]?.idleTroops);
  const idleTroops = useMemo(
    () => mergeCityIdleTroops(rawIdleTroops ?? []),
    [rawIdleTroops],
  );
  const awayMap = useTroopsAwayMap(activeCityId);

  const [targetCity, setTargetCity] = useState(defaultTargetCity);
  const [attacker, setAttacker] = useState(emptyCounts);
  const [defender, setDefender] = useState(emptyCounts);
  const [simulated, setSimulated] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultKey, setResultKey] = useState(0);
  const [unitEnabled, setUnitEnabled] = useState(() =>
    Object.fromEntries(
      landUnits.flatMap((u) => [[`atk-${u.id}`, true], [`def-${u.id}`, true]]),
    ),
  );

  const spyReport = useMemo(
    () => findSpyReportForCity(reports, targetCity.trim()),
    [reports, targetCity],
  );

  const fillFromGarrison = () => {
    const next = emptyCounts();
    const troopById = Object.fromEntries(idleTroops.map((t) => [t.id, t]));
    let filled = 0;

    landUnits.forEach((u) => {
      const troop = troopById[u.id];
      if (!troop) return;
      const idle = getTroopStock(troop, awayMap).idle;
      if (idle > 0) {
        next[u.id] = String(idle);
        filled += 1;
      }
    });

    if (!filled) {
      useNotificationStore.getState().addToast(t('components.battleSimulator.noIdleTroops'), 'warn');
      return;
    }

    setAttacker(next);
    setUnitEnabled((prev) => {
      const patch = { ...prev };
      landUnits.forEach((u) => {
        if (next[u.id]) patch[`atk-${u.id}`] = true;
      });
      return patch;
    });
    setSimulated(false);
    setShowResults(false);
  };

  const fillFromSpyReport = () => {
    const troops = getEnemyTroopsFromReport(spyReport);
    if (!troops) return;
    const next = emptyCounts();
    Object.entries(troops).forEach(([id, count]) => {
      next[id] = toRawInputNumber(count);
    });
    setDefender(next);
    if (!targetCity && spyReport) {
      setTargetCity(extractCityFromReportTitle(spyReport.title));
    }
    setSimulated(false);
    setShowResults(false);
  };

  const parsedAttacker = useMemo(() => {
    const o = {};
    landUnits.forEach((u) => {
      if (unitEnabled[`atk-${u.id}`] === false) return;
      o[u.id] = Number(attacker[u.id]) || 0;
    });
    return o;
  }, [attacker, unitEnabled]);

  const parsedDefender = useMemo(() => {
    const o = {};
    landUnits.forEach((u) => {
      if (unitEnabled[`def-${u.id}`] === false) return;
      o[u.id] = Number(defender[u.id]) || 0;
    });
    return o;
  }, [defender, unitEnabled]);

  const totalAttacker = useMemo(
    () => Object.values(parsedAttacker).reduce((sum, n) => sum + n, 0),
    [parsedAttacker],
  );
  const totalDefender = useMemo(
    () => Object.values(parsedDefender).reduce((sum, n) => sum + n, 0),
    [parsedDefender],
  );
  const canSimulate = totalAttacker > 0 && totalDefender > 0;

  const result = useMemo(() => {
    if (!showResults || !simulated || !canSimulate) return null;
    return simulateBattle(parsedAttacker, parsedDefender);
  }, [showResults, simulated, canSimulate, parsedAttacker, parsedDefender]);

  const handleSimulate = () => {
    if (!canSimulate) return;
    setSimulated(true);
    setShowResults(true);
    setResultKey((k) => k + 1);
  };

  const handleClear = () => {
    setTargetCity(defaultTargetCity || '');
    setAttacker(emptyCounts());
    setDefender(emptyCounts());
    setSimulated(false);
    setShowResults(false);
    setResultKey((k) => k + 1);
  };

  const setAttackerVal = (id, val) => {
    setAttacker((prev) => ({ ...prev, [id]: sanitizeQtyInput(val) }));
    setSimulated(false);
    setShowResults(false);
  };

  const setDefenderVal = (id, val) => {
    setDefender((prev) => ({ ...prev, [id]: sanitizeQtyInput(val) }));
    setSimulated(false);
    setShowResults(false);
  };

  const outcomeLabel = result?.outcome === 'win'
    ? t('components.battleSimulator.outcomeWin')
    : result?.outcome === 'loss'
      ? t('components.battleSimulator.outcomeLoss')
      : t('components.battleSimulator.outcomeUncertain');

  return (
    <section className="panel battle-simulator-panel">
      <h3 className="panel-title">{t('components.battleSimulator.title')}</h3>
      <p className="battle-sim-hint">
        {t('components.battleSimulator.hint')}
      </p>

      <label className="battle-sim-target">
        {t('components.battleSimulator.targetCity')}
        <input
          type="text"
          className="input-text"
          placeholder={t('components.battleSimulator.targetPlaceholder')}
          value={targetCity}
          onChange={(e) => {
            setTargetCity(e.target.value);
            setSimulated(false);
            setShowResults(false);
          }}
        />
      </label>

      <div className="battle-sim-actions-row">
        <button type="button" className="btn btn-secondary btn-sm" onClick={fillFromGarrison}>
          {t('components.battleSimulator.fillGarrison')}
        </button>
        {spyReport && (
          <button type="button" className="btn btn-primary btn-sm" onClick={fillFromSpyReport}>
            {t('components.battleSimulator.fillFromReport')}
          </button>
        )}
      </div>

      <TroopInputGrid
        title={t('components.battleSimulator.attackerTitle')}
        side="atk"
        counts={attacker}
        enabled={unitEnabled}
        onToggleEnabled={(id, v) => setUnitEnabled((prev) => ({ ...prev, [id]: v }))}
        onChange={setAttackerVal}
        t={t}
        unitName={unitName}
      />
      <TroopInputGrid
        title={t('components.battleSimulator.defenderTitle')}
        side="def"
        counts={defender}
        enabled={unitEnabled}
        onToggleEnabled={(id, v) => setUnitEnabled((prev) => ({ ...prev, [id]: v }))}
        onChange={setDefenderVal}
        t={t}
        unitName={unitName}
      />

      <div className="battle-sim-actions-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canSimulate}
          onClick={handleSimulate}
        >
          {t('components.battleSimulator.simulate')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleClear}>
          {t('components.battleSimulator.clear')}
        </button>
      </div>
      {!canSimulate && (
        <p className="battle-sim-hint">{t('components.battleSimulator.minUnitsHint')}</p>
      )}

      {showResults && result && (
        <div key={resultKey} className={`battle-sim-result battle-sim-result--${result.outcome}`}>
          <div className="battle-sim-outcome-grid">
            <article
              className={[
                'battle-sim-outcome-card',
                'battle-sim-outcome-card--primary',
                result.outcome === 'win' && 'battle-sim-outcome-card--win',
                result.outcome === 'loss' && 'battle-sim-outcome-card--loss',
              ].filter(Boolean).join(' ')}
            >
              <span className="battle-sim-outcome-card__tag">{t('components.battleSimulator.outcomeTag')}</span>
              <strong className="battle-sim-outcome-card__value" title={result.outcomeLabel}>
                {outcomeLabel}
              </strong>
            </article>
            <article className="battle-sim-outcome-card">
              <span className="battle-sim-outcome-card__tag">{t('components.battleSimulator.winChance')}</span>
              <strong className="battle-sim-outcome-card__value">%{result.winProbability}</strong>
            </article>
            <article className="battle-sim-outcome-card battle-sim-outcome-card--loss">
              <span className="battle-sim-outcome-card__tag">{t('components.battleSimulator.lossYou')}</span>
              <strong className="battle-sim-outcome-card__value">~%{result.attackerLossPct}</strong>
            </article>
            <article className="battle-sim-outcome-card">
              <span className="battle-sim-outcome-card__tag">{t('components.battleSimulator.lossEnemy')}</span>
              <strong className="battle-sim-outcome-card__value">~%{result.defenderLossPct}</strong>
            </article>
          </div>
          <dl className="battle-sim-stats">
            <div>
              <dt>{t('components.battleSimulator.attackPower')}</dt>
              <dd title={String(result.attackerPower)}>{result.attackerPower.toLocaleString()}</dd>
            </div>
            <div>
              <dt>{t('components.battleSimulator.defensePower')}</dt>
              <dd title={String(result.defenderPower)}>{result.defenderPower.toLocaleString()}</dd>
            </div>
          </dl>
          <p className="battle-sim-disclaimer">
            {t('components.battleSimulator.disclaimer', { label: outcomeLabel })}
          </p>
        </div>
      )}
    </section>
  );
}
