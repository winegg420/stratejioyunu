import { useMemo, useState } from 'react';
import { landUnits } from '../data/placeholder';
import { simulateBattle } from '../lib/battleSimulator';
import { extractCityFromReportTitle, findSpyReportForCity, getEnemyTroopsFromReport } from '../lib/spyIntel';
import { toRawInputNumber } from '../lib/formatNumber';
import { getTroopStock } from '../lib/troopStock';
import { useActiveCityIdleTroops, useGameStore, useTroopsAwayMap } from '../stores/gameStore';
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

function TroopInputGrid({ title, counts, onChange, enabled, onToggleEnabled, side = 'u', readOnly = false }) {
  return (
    <fieldset className="battle-sim-fieldset">
      <legend>{title}</legend>
      <div className="battle-sim-grid">
        {landUnits.map((u) => {
          const key = `${side}-${u.id}`;
          const on = enabled[key] !== false;
          return (
            <div
              key={key}
              className={`battle-sim-input-row${on ? '' : ' battle-sim-input-row--off'}`}
            >
              <span className="battle-sim-unit-label">
                <UnitMilitaryIcon unitId={u.id} size={20} />
                {u.name}
              </span>
              <CyberToggle
                checked={on}
                showX
                activeLabel="DAHİL"
                lockedLabel="KİLİTLİ"
                aria-label={`${u.name} simülasyona dahil`}
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
  const reports = useGameStore((s) => s.reports);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const idleTroops = useActiveCityIdleTroops();
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
    idleTroops.forEach((t) => {
      const idle = getTroopStock(t, awayMap).idle;
      if (idle > 0) next[t.id] = toRawInputNumber(idle);
    });
    setAttacker(next);
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

  return (
    <section className="panel battle-simulator-panel">
      <h3 className="panel-title">Savaş Simülatörü</h3>
      <p className="battle-sim-hint">
        Kendi birlikleriniz ve hedef garnizon tahminiyle savaş sonucunu önceden görün.
      </p>

      <label className="battle-sim-target">
        Hedef şehir
        <input
          type="text"
          className="input-text"
          placeholder="Örn: Ankara"
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
          Boştaki Askerlerimle Doldur
        </button>
        {spyReport && (
          <button type="button" className="btn btn-primary btn-sm" onClick={fillFromSpyReport}>
            Rapora Göre Simüle Et
          </button>
        )}
      </div>

      <TroopInputGrid
        title="Saldıran (siz)"
        side="atk"
        counts={attacker}
        enabled={unitEnabled}
        onToggleEnabled={(id, v) => setUnitEnabled((prev) => ({ ...prev, [id]: v }))}
        onChange={setAttackerVal}
      />
      <TroopInputGrid
        title="Savunan (düşman)"
        side="def"
        counts={defender}
        enabled={unitEnabled}
        onToggleEnabled={(id, v) => setUnitEnabled((prev) => ({ ...prev, [id]: v }))}
        onChange={setDefenderVal}
      />

      <div className="battle-sim-actions-row">
        <button
          type="button"
          className="btn btn-primary"
          disabled={!canSimulate}
          onClick={handleSimulate}
        >
          Simüle Et
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleClear}>
          Temizle
        </button>
      </div>
      {!canSimulate && (
        <p className="battle-sim-hint">Simülasyon için her iki tarafta da en az 1 birlik girin.</p>
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
              <span className="battle-sim-outcome-card__tag">SONUÇ</span>
              <strong className="battle-sim-outcome-card__value" title={result.outcomeLabel}>
                {result.outcome === 'win' ? 'BAŞARILI' : result.outcome === 'loss' ? 'KAYIP RİSKİ' : 'BELİRSİZ'}
              </strong>
            </article>
            <article className="battle-sim-outcome-card">
              <span className="battle-sim-outcome-card__tag">ZAFER OLASILIĞI</span>
              <strong className="battle-sim-outcome-card__value">%{result.winProbability}</strong>
            </article>
            <article className="battle-sim-outcome-card battle-sim-outcome-card--loss">
              <span className="battle-sim-outcome-card__tag">KAYIP (SİZ)</span>
              <strong className="battle-sim-outcome-card__value">~%{result.attackerLossPct}</strong>
            </article>
            <article className="battle-sim-outcome-card">
              <span className="battle-sim-outcome-card__tag">KAYIP (DÜŞMAN)</span>
              <strong className="battle-sim-outcome-card__value">~%{result.defenderLossPct}</strong>
            </article>
          </div>
          <dl className="battle-sim-stats">
            <div>
              <dt>Saldırı gücü</dt>
              <dd title={String(result.attackerPower)}>{result.attackerPower.toLocaleString('tr-TR')}</dd>
            </div>
            <div>
              <dt>Savunma gücü</dt>
              <dd title={String(result.defenderPower)}>{result.defenderPower.toLocaleString('tr-TR')}</dd>
            </div>
          </dl>
          <p className="battle-sim-disclaimer">
            {result.outcomeLabel} — Simülasyon tahminidir; gerçek savaşta teknoloji ve şans faktörleri etkili olabilir.
          </p>
        </div>
      )}
    </section>
  );
}
