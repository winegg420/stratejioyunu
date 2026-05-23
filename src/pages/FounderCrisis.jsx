import { Navigate } from 'react-router-dom';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
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
      <LocalizedPageHeader pageKey="founderCrisis" />
      <p className="hint founder-admin-hint">
        Müdahaleler <a href="/admin-log">Admin Müdahale Kayıtları</a> sayfasında tüm oyunculara açıktır.
      </p>
      <AdminCrisisPanel />
      <AdminCentralBankPanel />
      <AdminRegionalIncentivePanel />
    </div>
  );
}
