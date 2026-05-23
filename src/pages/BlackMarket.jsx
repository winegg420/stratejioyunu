import { useState } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import EmptyState from '../components/EmptyState';
import { useGameStore } from '../stores/gameStore';
import { BLACK_MARKET_LABELS, BLACK_MARKET_TYPES } from '../lib/blackMarket';
import { getResourceDisplay } from '../data/resourceCatalog';
import CyberDataInput from '../components/CyberDataInput';

export default function BlackMarket() {
  const listings = useGameStore((s) => s.blackMarketListings ?? []);
  const crises = useGameStore((s) => s.diplomaticCrises ?? []);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const resources = useGameStore((s) => s.cities[activeCityId]?.resources ?? []);
  const postListing = useGameStore((s) => s.postBlackMarketListing);
  const buyListing = useGameStore((s) => s.buyBlackMarketListing);

  const [type, setType] = useState(BLACK_MARKET_TYPES.STOLEN_GOODS);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState('100');
  const [resourceId, setResourceId] = useState('hammadde');

  const openListings = listings.filter((l) => l.status === 'open');

  const handlePost = (e) => {
    e.preventDefault();
    postListing({
      type,
      title: title.trim() || BLACK_MARKET_LABELS[type],
      price: Number(price),
      qty: Number(qty),
      resourceId: type === BLACK_MARKET_TYPES.STOLEN_GOODS ? resourceId : null,
    });
    setTitle('');
    setPrice('');
  };

  return (
    <div className="page page--console black-market-page">
      <LocalizedPageHeader
        pageKey="blackMarket"
        className="black-market-page-header"
      />

      {crises.length > 0 && (
        <section className="panel black-market-crisis-panel" role="status">
          <h3 className="panel-title">Diplomatik Kriz</h3>
          <ul className="black-market-crisis-list">
            {crises.slice(0, 4).map((c) => (
              <li key={c.id ?? c.at}>{c.text}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel black-market-post-panel">
        <h3 className="panel-title">Anonim İlan Aç</h3>
        <form className="black-market-form" onSubmit={handlePost}>
          <label>
            <span>Tür</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(BLACK_MARKET_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Başlık</span>
            <CyberDataInput value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          {type === BLACK_MARKET_TYPES.STOLEN_GOODS && (
            <label>
              <span>Kaynak</span>
              <select value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
                {['hammadde', 'food', 'fuel'].map((id) => (
                  <option key={id} value={id}>{getResourceDisplay(id).label}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span>Miktar</span>
            <CyberDataInput
              value={qty}
              min={1}
              onChange={(e) => setQty(e.target.value)}
            />
          </label>
          <label>
            <span>Fiyat (Bütçe)</span>
            <CyberDataInput
              value={price}
              min={1}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-hud-primary">[ İLAN YAYINLA ]</button>
        </form>
        <p className="hint">
          Stok: {resources.find((r) => r.id === resourceId)?.current?.toLocaleString('tr-TR') ?? '—'}
          {' '}· İşlemler listede yalnızca takma ad ile görünür.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel-title">Aktif İlanlar</h3>
        {openListings.length > 0 ? (
          <ul className="black-market-list">
            {openListings.map((l) => (
              <li key={l.id} className="black-market-card">
                <strong>{l.title}</strong>
                <span className="font-hud-data black-market-card__alias">{l.alias}</span>
                <span>{BLACK_MARKET_LABELS[l.type] ?? l.type}</span>
                <span className="font-hud-data">
                  {l.price.toLocaleString('tr-TR')} Bütçe
                  {l.qty > 1 ? ` · ×${l.qty}` : ''}
                </span>
                <button
                  type="button"
                  className="btn btn-hud-secondary btn-sm"
                  onClick={() => buyListing(l.id)}
                >
                  [ SATIN AL ]
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            tag="[ KANAL BOŞ ]"
            icon="🕶️"
            title="Açık ilan yok"
            description="Paralı ajan, yasak silah veya çalıntı kaynak ilanı yayınlayın."
          />
        )}
      </section>
    </div>
  );
}
