import { Navigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import AdminCrisisPanel from '../components/AdminCrisisPanel';
import AdminCentralBankPanel from '../components/AdminCentralBankPanel';
import AdminRegionalIncentivePanel from '../components/AdminRegionalIncentivePanel';
import { useAuth } from '../context/AuthContext';
import { isFounderPlayer } from '../lib/adminAccess';
import '../styles/crisis.css';

export default function FounderCrisis() {
  const { playerName, session } = useAuth();
  const email = session?.user?.email ?? null;

  if (!isFounderPlayer(playerName, email)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page page--console founder-crisis-page">
      <PageHeader
        title="Kurucu Komuta Merkezi"
        subtitle="> Kurucu konsol — kriz motoru, merkez bankası ve bölgesel teşvik modülleri..."
        status="[ GOD MODE ]"
      />
      <p className="hint founder-admin-hint">
        Müdahaleler <a href="/admin-log">Admin Müdahale Kayıtları</a> sayfasında tüm oyunculara açıktır.
      </p>
      <AdminCrisisPanel />
      <AdminCentralBankPanel />
      <AdminRegionalIncentivePanel />
    </div>
  );
}
