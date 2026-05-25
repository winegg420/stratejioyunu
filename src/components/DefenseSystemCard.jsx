import { useState } from 'react';
import { DEFENSE_MAX_LEVEL } from '../data/defenseCatalog';
import {
  getDefenseDescription,
  getDefenseDisplayName,
  isDefenseAtMaxLevel,
  scaleDefenseUpgradeCost,
} from '../lib/defenseSystemUtils';
import { formatReadableDuration, parseTimeToSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import { toRawInputNumber } from '../lib/formatNumber';
import { flushGameSave } from '../lib/gameActionSync';
import { canAffordCost, calcMaxAffordable } from '../utils/resourceCosts';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { useLanguage } from '../context/LanguageContext';
import CyberDataInput from './CyberDataInput';
import ProcessingActionButton from './ProcessingActionButton';
import CostParts from './CostParts';

export default function DefenseSystemCard({ def, inventory, queueBusy }) {
  const { t, lang } = useLanguage();
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const now = useGameStore((s) => s.now);
  const defenseQueue = useGameStore((s) => s.cities[s.activeCityId]?.defenseQueue ?? STORE_EMPTY_ARRAY);
  const enqueueDefenseProduction = useGameStore((s) => s.enqueueDefenseProduction);
  const enqueueDefenseUpgrade = useGameStore((s) => s.enqueueDefenseUpgrade);

  const [qtyInput, setQtyInput] = useState('1');
  const [processingAction, setProcessingAction] = useState(null);

  const name = getDefenseDisplayName(def, t);
  const desc = getDefenseDescription(def, t);
  const level = inventory?.level ?? 0;
  const count = inventory?.count ?? 0;
  const atMaxLevel = isDefenseAtMaxLevel(level);
  const upgradeCost = scaleDefenseUpgradeCost(def.upgradeCost, level);

  const activeItem = defenseQueue.find((q) => q.systemId === def.id && !q.queued);
  const queuedItem = defenseQueue.find((q) => q.systemId === def.id && q.queued);
  const remaining = activeItem ? remainingFromEndsAt(activeItem.endsAt, now) : 0;

  const qty = Number(qtyInput);
  const validQty = Number.isFinite(qty) && qty > 0;
  const canAffordUnits = validQty && canAffordCost(def.unitCost, qty, resources);
  const canAffordUpgrade = !atMaxLevel && canAffordCost(upgradeCost, 1, resources);
  const isBusy = processingAction != null || queueBusy;

  const handleMax = () => {
    const max = calcMaxAffordable(def.unitCost, resources);
    setQtyInput(toRawInputNumber(Math.max(1, max)));
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

  const runProduce = async (addToQueue) => {
    if (!canAffordUnits || isBusy) return;
    const actionKey = addToQueue ? 'queue' : 'produce';
    setProcessingAction(actionKey);
    try {
      const ok = enqueueDefenseProduction(def.id, qty, { addToQueue });
      if (ok) {
        setQtyInput('1');
        await flushGameSave({ cityId: activeCityId });
      }
    } finally {
      setProcessingAction(null);
    }
  };

  const runUpgrade = async (addToQueue) => {
    if (!canAffordUpgrade || isBusy) return;
    const actionKey = addToQueue ? 'upgradeQueue' : 'upgrade';
    setProcessingAction(actionKey);
    try {
      const ok = enqueueDefenseUpgrade(def.id, { addToQueue });
      if (ok) {
        await flushGameSave({ cityId: activeCityId });
      }
    } finally {
      setProcessingAction(null);
    }
  };

  const unitTimeLabel = def.unitTime && def.unitTime !== '—'
    ? formatReadableDuration(parseTimeToSeconds(def.unitTime) || 0, lang)
    : null;
  const upgradeTimeLabel = def.upgradeTime && def.upgradeTime !== '—'
    ? formatReadableDuration(parseTimeToSeconds(def.upgradeTime) || 0, lang)
    : null;

  return (
    <article
      className={[
        'card',
        'content-card--slim',
        'content-card--defense',
        activeItem && 'upgrading',
        queuedItem && 'is-queued',
      ].filter(Boolean).join(' ')}
    >
      <div className="content-card__stack">
        <div className="content-card__head defense-card__head">
          <span className="defense-card__icon" aria-hidden="true">{def.icon}</span>
          <div className="defense-card__titles">
            <h3>{name}</h3>
            <span className="defense-card__version">{def.version}</span>
          </div>
          <div className="defense-card__badges">
            <span className="badge">{t('pages.defense.levelBadge', { level, max: DEFENSE_MAX_LEVEL })}</span>
            <span className="badge badge-troop-stock">{t('pages.defense.countBadge', { count })}</span>
            {activeItem && (
              <span className="timer-badge">{formatReadableDuration(remaining, lang)}</span>
            )}
            {queuedItem && !activeItem && (
              <span className="timer-badge">{t('pages.defense.queued')}</span>
            )}
          </div>
        </div>

        <p className="defense-card__desc">{desc}</p>

        <div className="defense-card__tier">
          <p className="content-card__meta">
            <span className="defense-card__section-label">{t('pages.defense.produceSection')}</span>
            <CostParts costStr={def.unitCost} className="unit-card__cost-parts" />
            {unitTimeLabel ? (
              <span className="unit-card__time">
                {' · '}
                {unitTimeLabel}
                {t('pages.defense.perUnit')}
              </span>
            ) : null}
          </p>
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
              disabled={!canAffordUnits || isBusy}
              onClick={() => runProduce(false)}
            >
              {t('pages.defense.produce')}
            </ProcessingActionButton>
            <ProcessingActionButton
              type="button"
              className="btn btn-secondary"
              processing={processingAction === 'queue'}
              disabled={!canAffordUnits || isBusy}
              onClick={() => runProduce(true)}
            >
              {t('pages.defense.queueAdd')}
            </ProcessingActionButton>
          </div>
        </div>

        <div className="defense-card__tier defense-card__tier--upgrade">
          <p className="content-card__meta">
            <span className="defense-card__section-label">{t('pages.defense.upgradeSection')}</span>
            {!atMaxLevel ? (
              <>
                <CostParts costStr={upgradeCost} className="unit-card__cost-parts" />
                {upgradeTimeLabel ? <span className="unit-card__time"> · {upgradeTimeLabel}</span> : null}
              </>
            ) : (
              <strong>{t('pages.defense.maxLevel')}</strong>
            )}
          </p>
          {!atMaxLevel && (
            <div className="card-actions">
              <ProcessingActionButton
                type="button"
                className="btn btn-primary"
                processing={processingAction === 'upgrade'}
                disabled={!canAffordUpgrade || isBusy}
                onClick={() => runUpgrade(false)}
              >
                {t('pages.defense.upgrade')}
              </ProcessingActionButton>
              <ProcessingActionButton
                type="button"
                className="btn btn-secondary"
                processing={processingAction === 'upgradeQueue'}
                disabled={!canAffordUpgrade || isBusy}
                onClick={() => runUpgrade(true)}
              >
                {t('pages.defense.queueUpgrade')}
              </ProcessingActionButton>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
