import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomDropdown from '../components/CustomDropdown';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import EmptyState from '../components/EmptyState';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import {
  calcTradeDepotOverflow,
  sumTradeAmounts,
} from '../lib/tradeUtils';
import { STORE_EMPTY_ARRAY, useGameStore, getExpeditionOriginLabel } from '../stores/gameStore';
import { BUILDING_LABELS } from '../lib/buildingUtils';

const SENDABLE_IDS = ['food', 'fuel', 'hammadde', 'money'];

const EMPTY_AMOUNTS = { food: 0, fuel: 0, hammadde: 0, money: 0 };

export default function Trade() {
  const now = useGameStore((s) => s.now);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const market = useGameStore((s) =>
    s.cities[s.activeCityId]?.buildings?.find((b) => b.id === 'market'),
  );
  const marketReady = (market?.level ?? 0) >= 1;
  const expeditions = useGameStore((s) => s.expeditions);
  const startTradeExpedition = useGameStore((s) => s.startTradeExpedition);
  const requestMapTradeFocus = useGameStore((s) => s.requestMapTradeFocus);
  const recallExpedition = useGameStore((s) => s.recallExpedition);
  const centralBank = useGameStore((s) => s.centralBank);
  const regionalIncentive = useGameStore((s) => s.regionalIncentive);

  const [targetName, setTargetName] = useState('');
  const [amounts, setAmounts] = useState({ ...EMPTY_AMOUNTS });

  const tradeTargets = useMemo(
    () => playerCities.filter((c) => c.id !== activeCityId),
    [playerCities, activeCityId],
  );

  const tradeExpeditions = useMemo(
    () => expeditions.filter((e) => e.mode === 'trade'),
    [expeditions],
  );

  const targetCity = useGameStore((s) =>
    targetName ? s.cities[s.playerCities.find((c) => c.name === targetName)?.id] : null,
  );

  const overflow = useMemo(() => {
    if (!targetCity || sumTradeAmounts(amounts) <= 0) return [];
    return calcTradeDepotOverflow(targetCity.resources, amounts);
  }, [targetCity, amounts]);

  const totalSend = sumTradeAmounts(amounts);
  const canSubmit = marketReady && totalSend > 0 && targetName && overflow.length === 0;

  const setAmount = (id, val) => {
    setAmounts((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(Number(val) || 0)) }));
  };

  const halveResource = (id) => {
    const res = resources.find((r) => r.id === id);
    if (!res) return;
    setAmount(id, Math.floor(res.current / 2));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = startTradeExpedition({ targetCityName: targetName, sendAmounts: amounts });
    if (ok) {
      setAmounts({ ...EMPTY_AMOUNTS });
    }
  };

  return (
    <div className="page page--console">
      <LocalizedPageHeader
        pageKey="trade"
        action={(
          <Link to="/harita" className="btn btn-primary">
            Haritayı Aç
          </Link>
        )}
      />

      {(centralBank?.fuelBasePrice !== 1 || regionalIncentive?.active) && (
        <section className="panel trade-market-panel">
          <h3 className="panel-title">Pazar & Merkez Bankası</h3>
          <p className="hint">
            Petrol taban çarpanı: <strong className="font-hud-data">×{(centralBank?.fuelBasePrice ?? 1).toFixed(2)}</strong>
            {regionalIncentive?.active && (
              <>
                {' '}
                · Teşvik: {regionalIncentive.regionName} — {regionalIncentive.resourceId} üretim ×
                {regionalIncentive.multiplier}
              </>
            )}
          </p>
          <p className="hint">
            <a href="/admin-log">Admin müdahale kayıtları</a> (şeffaf log)
          </p>
        </section>
      )}

      <section className="panel">
        <h3 className="panel-title">Yeni Ticaret Seferi</h3>
        {!marketReady && (
          <p className="alert alert-warn" role="status">
            Ticaret için önce <strong>{BUILDING_LABELS.market}</strong> inşa edin (Binalar sekmesi).
          </p>
        )}
        <form className="trade-form" onSubmit={handleSubmit}>
          <label className="trade-form-field">
            <span>Hedef şehir</span>
            <CustomDropdown
              value={targetName}
              onChange={setTargetName}
              className="city-switcher-select"
              placeholder="Seçin…"
              aria-label="Hedef şehir"
              options={[
                { value: '', label: 'Seçin…', disabled: true },
                ...tradeTargets.map((c) => ({ value: c.name, label: c.name })),
              ]}
            />
          </label>

          <div className="trade-resource-grid">
            {SENDABLE_IDS.map((id) => {
              const res = resources.find((r) => r.id === id);
              if (!res) return null;
              const over = overflow.find((o) => o.id === id);
              return (
                <div
                  key={id}
                  className={`trade-resource-row${over ? ' trade-resource-row--overflow' : ''}`}
                >
                  <span className="trade-res-label">
                    {res.icon} {res.label}
                  </span>
                  <span className="trade-res-stock">
                    Depo: {res.current.toLocaleString('tr-TR')}
                    {res.max != null && ` / ${res.max.toLocaleString('tr-TR')}`}
                  </span>
                  <div className="trade-res-inputs">
                    <input
                      type="number"
                      className="input-qty"
                      min={0}
                      max={res.current}
                      value={amounts[id] || 0}
                      onChange={(e) => setAmount(id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm trade-half-btn"
                      onClick={() => halveResource(id)}
                      title="Mevcut stoğun yarısını yaz"
                    >
                      1/2
                    </button>
                  </div>
                  {over && (
                    <p className="trade-overflow-warn" role="alert">
                      Hedef depo sınırını aşar (+{over.excess.toLocaleString('tr-TR')} taşma)
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {totalSend <= 0 && targetName && (
            <p className="trade-empty-warn">Gönderilecek kaynak miktarı 0 — sefer başlatılamaz.</p>
          )}

          <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
            Konvoy Gönder
          </button>
        </form>
      </section>

      <section className="panel">
        <h3 className="panel-title">Aktif Kervanlar</h3>
        {tradeExpeditions.length > 0 ? (
          <ul className="trade-caravan-list">
            {tradeExpeditions.map((e) => {
              const origin = getExpeditionOriginLabel(e, playerCities);
              const remaining = formatSeconds(remainingFromEndsAt(e.endsAt, now));
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className="trade-caravan-card"
                    onClick={() => requestMapTradeFocus(e.id)}
                  >
                    <strong>
                      {origin} → {e.target}
                    </strong>
                    <span>{e.troops}</span>
                    <span className="timer">{remaining}</span>
                    <span className="trade-caravan-hint">Haritada rotayı göster</span>
                  </button>
                  {e.direction === 'outgoing' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => recallExpedition(e.id)}
                    >
                      Geri Çağır
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            tag="[ KONVOY YOK ]"
            icon="🐪"
            title="Yolda kervan yok"
            actionLabel="Haritayı Aç"
            actionTo="/harita"
            description="Kaynak gönderdiğinizde neon ticaret hattı ve hareketli kargo haritada görünür."
          />
        )}
      </section>
    </div>
  );
}
