import { Navigate } from 'react-router-dom';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import AdminCrisisPanel from '../components/AdminCrisisPanel';
import AdminCentralBankPanel from '../components/AdminCentralBankPanel';
import AdminRegionalIncentivePanel from '../components/AdminRegionalIncentivePanel';
import { useAuth } from '../context/AuthContext';
import { canOpenFounderCrisisPanel } from '../lib/adminAccess';
import { isDevAdminLocalEnabled } from '../lib/devTestMode';
import { useGameStore } from '../stores/gameStore';
import '../styles/crisis.css';

export default function FounderCrisis() {
  const { playerName, session } = useAuth();
  const isAdminUser = useGameStore((s) => s.isAdminUser);
  const devTestModeActive = useGameStore((s) => s.devTestModeActive);

  const canAccess = canOpenFounderCrisisPanel({
    playerName,
    email: session?.user?.email,
    session,
    profileIsAdmin: isAdminUser,
    devTestModeActive: devTestModeActive || isDevAdminLocalEnabled(),
  });

  if (!canAccess) {
    return <Navigate to="/admin-log" replace />;
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
