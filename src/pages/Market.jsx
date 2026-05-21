import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';
import { BUILDING_LABELS } from '../lib/buildingUtils';
import {
  MARKET_TRADABLE_IDS,
  formatMarketPriceLabel,
  getMarketUnitPrices,
} from '../lib/marketExchange';
import { getResourceDisplay } from '../data/resourceCatalog';

const EMPTY_QTY = Object.fromEntries(MARKET_TRADABLE_IDS.map((id) => [id, '']));

export default function Market() {
  const resources = useGameStore((s) => s.cities[s.activeCityId]?.resources ?? STORE_EMPTY_ARRAY);
  const market = useGameStore((s) =>
    s.cities[s.activeCityId]?.buildings?.find((b) => b.id === 'market'),
  );
  const centralBank = useGameStore((s) => s.centralBank);
  const executeMarketTrade = useGameStore((s) => s.executeMarketTrade);
  const postMarketOffer = useGameStore((s) => s.postMarketOffer);
  const marketOffers = useGameStore((s) => s.marketOffers ?? []);

  const marketReady = (market?.level ?? 0) >= 1;
  const unitPrices = useMemo(() => getMarketUnitPrices(centralBank), [centralBank]);

  const [buyQty, setBuyQty] = useState({ ...EMPTY_QTY });
  const [sellQty, setSellQty] = useState({ ...EMPTY_QTY });
  const [offerResource, setOfferResource] = useState('metal');
  const [offerQty, setOfferQty] = useState('');
  const [offerPrice, setOfferPrice] = useState('');

  const setBuy = (id, val) => {
    setBuyQty((prev) => ({ ...prev, [id]: val }));
  };

  const setSell = (id, val) => {
    setSellQty((prev) => ({ ...prev, [id]: val }));
  };

  const handleTrade = (resourceId, mode) => {
    const raw = mode === 'buy' ? buyQty[resourceId] : sellQty[resourceId];
    const qty = Math.max(0, Math.floor(Number(raw) || 0));
    if (!qty) return;
    const ok = executeMarketTrade({ resourceId, qty, mode });
    if (ok) {
      if (mode === 'buy') setBuy(resourceId, '');
      else setSell(resourceId, '');
    }
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
      <PageHeader
        title="Pazar"
        subtitle="> Küresel kaynak borsası — Merkez Bankası pariteleri canlı..."
        className="market-page-header"
      />

      {!marketReady && (
        <p className="market-page-warn" role="status">
          Pazar işlemleri için önce <strong>{BUILDING_LABELS.market}</strong> inşa edin (Binalar).
        </p>
      )}

      <section className="panel market-exchange-panel">
        <h3 className="panel-title">Kaynak Alım / Satım</h3>
        <p className="market-exchange-hint">
          Fiyatlar Merkez Bankası paritelerine göre güncellenir. Miktar girin ve işlem yapın.
        </p>
        <div className="market-exchange-grid">
          {MARKET_TRADABLE_IDS.map((id) => {
            const res = resources.find((r) => r.id === id);
            const { label, icon } = getResourceDisplay(id);
            const stock = res?.current ?? 0;
            const prices = unitPrices[id];
            return (
              <article key={id} className="market-exchange-row">
                <div className="market-exchange-row__head">
                  <span className="market-exchange-row__label">
                    {icon} {label}
                  </span>
                  <span className="market-exchange-row__stock font-hud-data">
                    Stok: {stock.toLocaleString('tr-TR')}
                  </span>
                  <span className="market-exchange-row__rates font-hud-data">
                    Al {prices.buy} · Sat {prices.sell} Bütçe/birim
                  </span>
                </div>
                <div className="market-exchange-row__actions">
                  <label className="market-exchange-field">
                    <span>Alım</span>
                    <input
                      type="number"
                      className="input-qty market-input-qty"
                      min={0}
                      disabled={!marketReady}
                      value={buyQty[id]}
                      onChange={(e) => setBuy(id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-hud-primary btn-sm"
                      disabled={!marketReady}
                      onClick={() => handleTrade(id, 'buy')}
                    >
                      Satın Al
                    </button>
                  </label>
                  <label className="market-exchange-field">
                    <span>Satım</span>
                    <input
                      type="number"
                      className="input-qty market-input-qty"
                      min={0}
                      max={stock}
                      disabled={!marketReady}
                      value={sellQty[id]}
                      onChange={(e) => setSell(id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-hud-secondary btn-sm"
                      disabled={!marketReady}
                      onClick={() => handleTrade(id, 'sell')}
                    >
                      Sat
                    </button>
                  </label>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel market-offer-panel">
        <h3 className="panel-title">Teklif Defteri</h3>
        <form className="market-offer-form" onSubmit={handleOffer}>
          <label className="market-offer-field">
            <span>Kaynak</span>
            <select
              className="market-offer-select"
              value={offerResource}
              onChange={(e) => setOfferResource(e.target.value)}
              disabled={!marketReady}
            >
              {MARKET_TRADABLE_IDS.map((id) => (
                <option key={id} value={id}>
                  {formatMarketPriceLabel(id, centralBank)}
                </option>
              ))}
            </select>
          </label>
          <label className="market-offer-field">
            <span>Miktar</span>
            <input
              type="number"
              className="input-qty market-input-qty"
              min={1}
              value={offerQty}
              onChange={(e) => setOfferQty(e.target.value)}
              disabled={!marketReady}
            />
          </label>
          <label className="market-offer-field">
            <span>Birim fiyat (Bütçe)</span>
            <input
              type="number"
              className="input-qty market-input-qty"
              min={1}
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              disabled={!marketReady}
            />
          </label>
          <button
            type="submit"
            className="btn btn-hud-primary market-offer-submit"
            disabled={!marketReady}
          >
            [ TEKLİF VER ]
          </button>
        </form>

        {marketOffers.length > 0 ? (
          <ul className="market-offer-list">
            {marketOffers.map((o) => {
              const { label, icon } = getResourceDisplay(o.resourceId);
              return (
                <li key={o.id} className="market-offer-card">
                  <strong>
                    {icon} {label} ×{o.qty.toLocaleString('tr-TR')}
                  </strong>
                  <span className="font-hud-data">
                    {o.unitPrice.toLocaleString('tr-TR')} Bütçe / birim
                  </span>
                  <span className="market-offer-card__author">{o.author}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            tag="[ DEFTER BOŞ ]"
            icon="📒"
            title="Açık teklif yok"
            description="İlk teklifi siz verin — diğer komutanlar pazar defterinde görecek."
          />
        )}
      </section>
    </div>
  );
}
