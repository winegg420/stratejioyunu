import PageHeader from '../components/PageHeader';
import TurkeyMap from '../map/TurkeyMap';

export default function MapPage() {
  return (
    <div className="page page--console map-page-wrapper">
      <PageHeader
        title="Harita"
        subtitle="> Taktik ızgara aktif — hedef nişangahları ve canlı üs verisi yükleniyor..."
      />
      <TurkeyMap />
    </div>
  );
}
