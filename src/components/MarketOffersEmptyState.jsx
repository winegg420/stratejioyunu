export default function MarketOffersEmptyState() {
  return (
    <div className="market-offers-empty" role="status" aria-live="polite">
      <div className="market-offers-empty__mesh" aria-hidden="true" />
      <div className="market-offers-empty__radar" aria-hidden="true">
        <span className="market-offers-empty__radar-ring" />
        <span className="market-offers-empty__radar-ring market-offers-empty__radar-ring--2" />
        <span className="market-offers-empty__radar-sweep" />
      </div>
      <p className="market-offers-empty__text">
        [ YER ALTI AĞINDA AKTİF İLAN ARANIYOR... ]
      </p>
    </div>
  );
}
