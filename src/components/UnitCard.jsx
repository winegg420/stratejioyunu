import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { toRawInputNumber } from '../lib/formatNumber';
import { flushGameSave } from '../lib/gameActionSync';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { canAffordCost, calcMaxAffordable } from '../utils/resourceCosts';
import { canAffordPopulation, getUnitPopulationCost } from '../lib/populationUtils';
import { resolveUnitInfoPayload } from '../lib/contentInfoResolver';
import TroopStockLabel from './TroopStockLabel';
import CostParts from './CostParts';
import CyberDataInput from './CyberDataInput';
import ProcessingActionButton from './ProcessingActionButton';
import UnitMilitaryIcon from './UnitMilitaryIcon';
import { formatReadableDuration, parseTimeToSeconds } from '../lib/gameUtils';

export default function UnitCard({ unit, awayMap, iconDomain }) {
  const { t, lang } = useLanguage();
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const enqueueProduction = useGameStore((s) => s.enqueueProduction);
  const openContentInfo = useGameStore((s) => s.openContentInfo);
  const [qtyInput, setQtyInput] = useState('10');
  const [processingAction, setProcessingAction] = useState(null);

  const qty = Number(qtyInput);
  const validQty = Number.isFinite(qty) && qty > 0;
  const popCost = validQty ? getUnitPopulationCost(unit.id, qty) : 0;
  const canAfford = validQty && canAffordCost(unit.cost, qty, resources);
  const hasPopulation = validQty && canAffordPopulation(city, popCost);
  const canProduce = canAfford && hasPopulation;
  const isBusy = processingAction != null;

  const handleMax = () => {
    const max = calcMaxAffordable(unit.cost, resources);
    const next = toRawInputNumber(max);
    setQtyInput(next);
    return next;
  };

  const handleQtyChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setQtyInput('');
      return;
    }
    const n = Math.max(0, Math.floor(Number(raw) || 0));
    setQtyInput(toRawInputNumber(n));
  };

  const resetQty = () => setQtyInput('');

  const runProduction = async (addToQueue) => {
    if (!canProduce || isBusy) return;
    const actionKey = addToQueue ? 'queue' : 'produce';
    setProcessingAction(actionKey);
    try {
      const ok = enqueueProduction(unit.id, qty, addToQueue ? { addToQueue: true } : undefined);
      if (ok) {
        resetQty();
        await flushGameSave({ cityId: activeCityId, saveAllUnits: true });
      }
    } finally {
      setProcessingAction(null);
    }
  };

  const openInfo = () => openContentInfo(resolveUnitInfoPayload(unit));
  const timeLabel = unit.time && unit.time !== '—'
    ? formatReadableDuration(parseTimeToSeconds(unit.time) || 0, lang)
    : null;

  return (
    <article className="card unit-card content-card--slim">
      <span className="content-card__intel-badge">[ i ]</span>
      <div className="content-card__stack">
        <button
          type="button"
          className="content-card__intel-hit"
          onClick={openInfo}
          aria-label={t('components.unitCard.encyclopediaAria', { name: unit.name })}
        >
          <div className="card-visual unit-card-visual">
            <UnitMilitaryIcon
              unitId={unit.id}
              domain={iconDomain}
              className="unit-military-icon--card"
              title={unit.name}
              size={52}
            />
          </div>
          <div className="content-card__head unit-card-header">
            <h3>{unit.name}</h3>
            <span className="badge badge-troop-stock">
              <TroopStockLabel
                troop={{ id: unit.id, available: unit.idle ?? unit.count }}
                awayMap={awayMap}
              />
            </span>
          </div>
        </button>
        <p className="content-card__meta unit-card__cost-row">
          <span className="unit-card__cost-label">{t('components.unitCard.unitCost')}</span>
          <CostParts costStr={unit.cost} className="unit-card__cost-parts" />
          {timeLabel ? <span className="unit-card__time"> · {timeLabel}</span> : null}
        </p>
      </div>
      <div className="card-actions unit-card-actions">
        <CyberDataInput
          value={qtyInput}
          min={0}
          disabled={isBusy}
          onChange={handleQtyChange}
          onMax={handleMax}
        />
        <ProcessingActionButton
          type="button"
          className="btn btn-unit-produce"
          processing={processingAction === 'produce'}
          disabled={!canProduce || isBusy}
          onClick={() => runProduction(false)}
        >
          {t('components.unitCard.produce')}
        </ProcessingActionButton>
        <ProcessingActionButton
          type="button"
          className="btn btn-secondary"
          processing={processingAction === 'queue'}
          disabled={!canProduce || isBusy}
          onClick={() => runProduction(true)}
        >
          {t('components.unitCard.queueAdd')}
        </ProcessingActionButton>
      </div>
    </article>
  );
}
