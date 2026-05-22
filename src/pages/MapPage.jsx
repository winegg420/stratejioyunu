import TurkeyMap from '../map/TurkeyMap';

export default function MapPage() {
  return (
    <div className="page page--console map-page-wrapper map-page-wrapper--tactical">
      <header className="map-page-compact-header">
        <h1 className="map-page-compact-header__title">Harita</h1>
        <span className="map-page-compact-header__meta">Taktik komuta · bot cephesi · canlı üs verisi</span>
      </header>
      <TurkeyMap />
    </div>
  );
}
