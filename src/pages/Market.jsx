import { useState } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import MarketOffersEmptyState from '../components/MarketOffersEmptyState';
import MarketPriceTag from '../components/MarketPriceTag';
import ProcessingActionButton from '../components/ProcessingActionButton';
import { useKeyedAsyncLock } from '../hooks/useAsyncActionLock';
import { useMarketTicker } from '../hooks/useMarketTicker';
import { flushGameSave } from '../lib/gameActionSync';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { BUILDING_LABELS } from '../lib/buildingUtils';
import {
  MARKET_TRADABLE_IDS,
  formatMarketPriceLabel,
  getMarketUnitPrices,
} from '../lib/marketExchange';
import { formatSupplyTrend } from '../lib/openMarket';
import { getResourceDisplay } from '../data/resourceCatalog';
import CyberDataInput from '../components/CyberDataInput';
import CustomDropdown from '../components/CustomDropdown';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { useLanguage } from '../context/LanguageContext';
import { getEmpireMoneyTotal } from '../lib/empireTreasury';
import MarketPriceChart from '../components/MarketPriceChart';

const EMPTY_QTY = Object.fromEntries(MARKET_TRADABLE_IDS.map((id) => [id, '']));

export default function Market() {
  const { t } = useLanguage();
  const activeCityId = useGameStore((s) => s.activeCityId);
  const cities = useGameStore((s) => s.cities);
  const resources = useGameStore((s) => s.cities[activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const userBalance = getEmpireMoneyTotal(cities);
  const market = useGameStore((s) =>
    s.cities[s.activeCityId]?.buildings?.find((b) => b.id === 'market'),
  );
  const centralBank = useGameStore((s) => s.centralBank);
  const executeMarketTrade = useGameStore((s) => s.executeMarketTrade);
  const postMarketOffer = useGameStore((s) => s.postMarketOffer);
  const acceptMarketOffer = useGameStore((s) => s.acceptMarketOffer);
  const cancelMarketOffer = useGameStore((s) => s.cancelMarketOffer);
  const marketOffers = useGameStore((s) => s.marketOffers ?? []);
  const openMarketPrices = useGameStore((s) => s.openMarketPrices ?? {});
  const openMarketSupplyIndex = useGameStore((s) => s.openMarketSupplyIndex ?? 0);
  const playerName = getCurrentPlayerName();

  const marketReady = (market?.level ?? 0) >= 1;
  const ticker = useMarketTicker(centralBank);

  const [buyQty, setBuyQty] = useState({ ...EMPTY_QTY });
  const [sellQty, setSellQty] = useState({ ...EMPTY_QTY });
  const [offerResource, setOfferResource] = useState('hammadde');
  const [offerQty, setOfferQty] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const { runLocked, isBusy, isProcessing } = useKeyedAsyncLock();

  const setBuy = (id, val) => {
    setBuyQty((prev) => ({ ...prev, [id]: val }));
  };

  const setSell = (id, val) => {
    setSellQty((prev) => ({ ...prev, [id]: val }));
  };

  const maxBuyQty = (id) => {
    const prices = ticker[id];
    const budget = resources.find((r) => r.id === 'money')?.current ?? 0;
    const unitPrice = prices?.buy?.value ?? 0;
    if (!unitPrice) return '0';
    return String(Math.floor(budget / unitPrice));
  };

  const handleTrade = (resourceId, mode) => {
    const lockKey = `trade-${resourceId}-${mode}`;
    if (isBusy) return;

    const raw = mode === 'buy' ? buyQty[resourceId] : sellQty[resourceId];
    const qty = Math.max(0, Math.floor(Number(raw) || 0));
    if (!qty) return;

    runLocked(lockKey, async () => {
      const ok = executeMarketTrade({ resourceId, qty, mode });
      if (ok) {
        if (mode === 'buy') setBuy(resourceId, '');
        else setSell(resourceId, '');
        await flushGameSave({ cityId: activeCityId });
      }
    });
  };

  const handleOffer = (e) => {
    e.preventDefault();
    const qty = Math.floor(Number(offerQty) || 0);
    const price = Math.floor(Number(offerPrice) || 0);
    if (!qty || !price) return;
    postMarketOffer({ resourceId: offerResource, qty, unitPrice: price });
    setOfferQty('');
    setOfferPrice('');
  };

  return (
    <div className="page page--console market-page">
      <LocalizedPageHeader
        pageKey="market"
        className="market-page-header"
      />

      {!marketReady && (
        <p className="market-page-warn" role="status">
          Pazar işlemleri için önce <strong>{BUILDING_LABELS.market}</strong> inşa edin (Binalar).
        </p>
      )}

      <section className="panel market-spot-panel glass-panel">
        <h3 className="panel-title">Açık Hammadde Pazarı</h3>
        <p className="market-exchange-hint">
          {formatSupplyTrend(openMarketSupplyIndex)}
          {' '}
          · Küresel arz endeksi: {openMarketSupplyIndex.toLocaleString('tr-TR')}
        </p>
        <MarketPriceChart resourceId="hammadde" />
        <div className="market-spot-grid">
          {MARKET_TRADABLE_IDS.map((id) => {
            const spot = openMarketPrices[id];
            const { label, icon } = getResourceDisplay(id);
            if (!spot) return null;
            return (
              <article key={id} className="market-spot-card">
                <span className="market-spot-card__icon" aria-hidden="true">{icon}</span>
                <strong>{label}</strong>
                <span className="font-hud-data">Al {spot.buy} / Sat {spot.sell}</span>
                <span className="market-spot-card__mult">×{spot.mult}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel market-exchange-panel glass-panel">
        <h3 className="panel-title">Kaynak Alım / Satım</h3>
        <p className="market-exchange-hint">
          Ortak Hazine: <strong className="font-hud-data">{userBalance.toLocaleString('tr-TR')}</strong> Bütçe
        </p>
        <p className="market-exchange-hint">
          Fiyatlar Merkez Bankası paritelerine göre güncellenir. Miktar girin ve işlem yapın.
        </p>
        <div className="market-exchange-grid">
          {MARKET_TRADABLE_IDS.map((id) => {
            const res = resources.find((r) => r.id === id);
            const { label, icon } = getResourceDisplay(id);
            const stock = res?.current ?? 0;
            const prices = openMarketPrices[id]
              ? { buy: { value: openMarketPrices[id].buy }, sell: { value: openMarketPrices[id].sell } }
              : ticker[id];
            return (
              <article key={id} className="market-exchange-row glass-panel">
                <div className="market-exchange-row__head">
                  <span className="market-exchange-row__label">
                    <span className={`resource-icon--metallic resource-icon--metallic--${id}`} aria-hidden="true">
                      {icon}
                    </span>
                    {label}
                  </span>
                  <span className="market-exchange-row__stock font-hud-data">
                    Stok: {stock.toLocaleString('tr-TR')}
                  </span>
                  <span className="market-exchange-row__rates">
                    <MarketPriceTag label="Al" value={prices.buy.value} direction={prices.buy.dir} />
                    <MarketPriceTag label="Sat" value={prices.sell.value} direction={prices.sell.dir} />
                    <span className="market-exchange-row__unit">Bütçe/birim</span>
                  </span>
                </div>
                <div className="market-exchange-row__actions">
                  <label className="market-exchange-field">
                    <span>Alım</span>
                    <div className="market-data-cell">
                      <span className="market-data-cell__icon" aria-hidden="true">{icon}</span>
                      <div className="market-data-cell__body">
                        <CyberDataInput
                          className="market-data-cell__input"
                          inputClassName="market-input-qty"
                          value={buyQty[id]}
                          min={0}
                          disabled={!marketReady || isBusy}
                          onChange={(e) => setBuy(id, e.target.value)}
                          onMax={() => {
                            const next = maxBuyQty(id);
                            setBuy(id, next);
                            return next;
                          }}
                        />
                      </div>
                    </div>
                    <ProcessingActionButton
                      type="button"
                      className="btn btn-hud-primary btn-sm market-hud-btn market-hud-btn--buy"
                      processing={isProcessing(`trade-${id}-buy`)}
                      disabled={!marketReady || isBusy}
                      onClick={() => handleTrade(id, 'buy')}
                    >
                      Satın Al
                    </ProcessingActionButton>
                  </label>
                  <label className="market-exchange-field">
                    <span>Satım</span>
                    <div className="market-data-cell">
                      <span className="market-data-cell__icon" aria-hidden="true">{icon}</span>
                      <div className="market-data-cell__body">
                        <CyberDataInput
                          inputClassName="market-input-qty"
                          value={sellQty[id]}
                          min={0}
                          max={stock}
                          disabled={!marketReady || isBusy}
                          onChange={(e) => setSell(id, e.target.value)}
                          onMax={() => {
                            const next = String(stock);
                            setSell(id, next);
                            return next;
                          }}
                        />
                      </div>
                    </div>
                    <ProcessingActionButton
                      type="button"
                      className="btn btn-hud-secondary btn-sm market-hud-btn market-hud-btn--sell"
                      processing={isProcessing(`trade-${id}-sell`)}
                      disabled={!marketReady || isBusy}
                      onClick={() => handleTrade(id, 'sell')}
                    >
                      Sat
                    </ProcessingActionButton>
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel market-offer-panel glass-panel">
        <h3 className="panel-title">Teklif Defteri</h3>
        <form className="market-offer-form market-offer-form--terminal" onSubmit={handleOffer}>
          <label className="market-offer-field">
            <span>Kaynak</span>
            <div className="market-data-cell market-data-cell--offer">
              <span className="market-data-cell__icon" aria-hidden="true">
                {getResourceDisplay(offerResource).icon}
              </span>
              <div className="market-data-cell__body">
                <CustomDropdown
                  className="market-offer-select market-terminal-select tactical-terminal-select"
                  value={offerResource}
                  onChange={setOfferResource}
                  disabled={!marketReady}
                  aria-label="Teklif kaynağı"
                  options={MARKET_TRADABLE_IDS.map((rid) => ({
                    value: rid,
                    label: formatMarketPriceLabel(rid, centralBank),
                  }))}
                />
              </div>
            </div>
          </label>
          <label className="market-offer-field">
            <span>Miktar</span>
            <div className="market-data-cell">
              <span className="market-data-cell__icon" aria-hidden="true">
                {getResourceDisplay(offerResource).icon}
              </span>
              <div className="market-data-cell__body">
                <CyberDataInput
                  inputClassName="market-input-qty"
                  value={offerQty}
                  min={1}
                  disabled={!marketReady}
                  onChange={(e) => setOfferQty(e.target.value)}
                />
              </div>
            </div>
          </label>
          <label className="market-offer-field">
            <span>Birim fiyat (Bütçe)</span>
            <div className="market-data-cell">
              <span className="market-data-cell__icon" aria-hidden="true">💰</span>
              <div className="market-data-cell__body">
                <CyberDataInput
                  inputClassName="market-input-qty"
                  value={offerPrice}
                  min={1}
                  disabled={!marketReady}
                  onChange={(e) => setOfferPrice(e.target.value)}
                />
              </div>
            </div>
          </label>
          <div className="market-offer-submit-wrap">
            <div className="market-data-cell">
              <span className="market-data-cell__icon" aria-hidden="true">◆</span>
              <div className="market-data-cell__body market-offer-submit-wrap__btn">
                <button
                  type="submit"
                  className="btn btn-hud-primary market-hud-btn market-hud-btn--offer market-offer-submit"
                  disabled={!marketReady}
                >
                  [ TEKLİF VER ]
                </button>
              </div>
            </div>
          </div>
        </form>

        {marketOffers.length > 0 ? (
          <ul className="market-offer-list">
            {marketOffers.map((o) => {
              const { label, icon } = getResourceDisplay(o.resourceId);
              return (
                <li key={o.id} className="market-offer-card">
                  <strong>
                    <span className={`resource-icon--metallic resource-icon--metallic--${o.resourceId}`} aria-hidden="true">
                      {icon}
                    </span>
                    {label} ×{o.qty.toLocaleString('tr-TR')}
                  </strong>
                  <span className="font-hud-data">
                    {o.unitPrice.toLocaleString('tr-TR')} Bütçe / birim
                  </span>
                  <span className="market-offer-card__author">{o.author}</span>
                  {o.author === playerName ? (
                    <button
                      type="button"
                      className="btn btn-hud-danger btn-sm market-offer-cancel-btn"
                      onClick={() => cancelMarketOffer(o.id)}
                    >
                      [ İLANI İPTAL ET ]
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-hud-primary btn-sm"
                      disabled={!marketReady}
                      onClick={() => acceptMarketOffer(o.id)}
                    >
                      [ ONAYLA · AL ]
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <MarketOffersEmptyState />
        )}
      </section>
    </div>
  );
}
