import PageHeader from '../components/PageHeader';
import TurkeyMap from '../map/TurkeyMap';

export default function MapPage() {
  return (
    <div className="page map-page-wrapper">
      <PageHeader title="Harita" subtitle="Türkiye haritası — 81 il lazy loading, ilçeler tıklanınca yüklenir." />
      <TurkeyMap />
    </div>
  );
}
