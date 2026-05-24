import { useMemo, useState } from 'react';
import { landUnits } from '../data/placeholder';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import {
  canRecallMeydanTroops,
  meydanRecallLockLabel,
  MEYDAN_PREP_SECONDS,
} from '../lib/meydanBattleConfig';
import { useActiveCityIdleTroops, useGameStore } from '../stores/gameStore';
import { useLanguage } from '../context/LanguageContext';
import CustomDropdown from './CustomDropdown';

export default function MeydanBattlePanel() {
  const { t } = useLanguage();
  const now = useGameStore((s) => s.now);
  const battle = useGameStore((s) => s.meydanBattle);
  const mapCities = useGameStore((s) => s.mapCities);
  const idleTroops = useActiveCityIdleTroops();
  const declareMeydanBattle = useGameStore((s) => s.declareMeydanBattle);
  const contributeMeydanTroops = useGameStore((s) => s.contributeMeydanTroops);
  const recallMeydanContribution = useGameStore((s) => s.recallMeydanContribution);

  const [targetPick, setTargetPick] = useState('');
  const [troopQty, setTroopQty] = useState({});

  const targets = useMemo(
    () => mapCities.filter((c) => c.status === 'enemy' || c.status === 'bot' || c.status === 'empty'),
    [mapCities],
  );

  if (!battle && !targets.length) return null;

  const prepRemaining = battle ? remainingFromEndsAt(battle.battleAt, now) : MEYDAN_PREP_SECONDS;
  const canRecall = battle ? canRecallMeydanTroops(battle, now) : true;
  const lockHint = battle ? meydanRecallLockLabel(battle, now) : '';

  const handleContribute = () => {
    if (contributeMeydanTroops(troopQty)) setTroopQty({});
  };

  const handleDeclare = () => {
    if (!targetPick) return;
    const ok = window.confirm(
      t('pages.expeditions.meydanConfirm', { target: targetPick }),
    );
    if (ok) declareMeydanBattle(targetPick);
  };

  return (
    <section className="panel meydan-battle-panel">
      <h3 className="panel-title">Meydan Savaşı (İstila) — Modül 9</h3>
      <p className="meydan-battle-desc">
        Hazırlık süresi <strong>24 saat</strong>. Savaş saatine son{' '}
        <strong>5 dakika</strong> kala birlik gönderme ve geri çekme kilitlenir.
      </p>

      {!battle ? (
        <div className="meydan-battle-declare">
          <label className="meydan-battle-field">
            <span>Hedef şehir</span>
            <CustomDropdown
              className="input-text"
              value={targetPick}
              onChange={setTargetPick}
              placeholder="Seçin…"
              aria-label="Hedef şehir"
              options={[
                { value: '', label: 'Seçin…', disabled: true },
                ...targets.map((c) => ({
                  value: c.name,
                  label: `${c.name} (${c.status})`,
                })),
              ]}
            />
          </label>
          <button
            type="button"
            className="btn btn-danger btn-sm meydan-battle-declare-btn"
            disabled={!targetPick}
            onClick={handleDeclare}
          >
            {t('pages.expeditions.meydanDeclare')}
          </button>
        </div>
      ) : (
        <>
          <div className="meydan-battle-status">
            <p>
              Hedef: <strong>{battle.targetName}</strong>
            </p>
            <p className="meydan-battle-timer">
              Savaşa kalan: <strong>{formatSeconds(prepRemaining)}</strong>
            </p>
            {lockHint?.trim() && (
              <p className={`meydan-battle-lock-hint${canRecall ? '' : ' is-locked'}`}>{lockHint}</p>
            )}
          </div>

          {battle.contributions.length > 0 ? (
            <ul className="meydan-contrib-list">
              {battle.contributions.map((c) => (
                <li key={c.id} className="meydan-contrib-row">
                  <span>
                    {c.originCityName}: {c.troops}
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={!canRecall}
                    title={canRecall ? 'Birlikleri geri çek' : 'Son 5 dk — kilitli'}
                    onClick={() => recallMeydanContribution(c.id)}
                  >
                    Geri Çek
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Henüz birlik gönderilmedi.</p>
          )}

          <div className="meydan-battle-send">
            <p className="meydan-battle-send-title">Birlik gönder</p>
            {landUnits.filter((u) => u.id !== 'colonist').map((u) => {
              const troop = idleTroops.find((t) => t.id === u.id);
              const max = troop?.available ?? 0;
              return (
                <label key={u.id} className="meydan-troop-row">
                  <span>{u.image} {u.name}</span>
                  <input
                    type="number"
                    className="input-qty"
                    min={0}
                    max={max}
                    disabled={!canRecall}
                    value={troopQty[u.id] ?? 0}
                    onChange={(e) =>
                      setTroopQty((prev) => ({
                        ...prev,
                        [u.id]: Math.min(max, Math.max(0, Number(e.target.value) || 0)),
                      }))
                    }
                  />
                </label>
              );
            })}
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!canRecall}
              onClick={handleContribute}
            >
              Meydana Gönder
            </button>
          </div>
        </>
      )}
    </section>
  );
}
