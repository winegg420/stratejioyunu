import { Navigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import AdminCrisisPanel from '../components/AdminCrisisPanel';
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
    <div className="page founder-crisis-page">
      <PageHeader
        title="Kurucu Kriz Komutası"
        subtitle="Manuel felaket tetikleme — haftalık büyük afetler ve toplu cezalandırmalar."
        status="[ GOD MODE ]"
      />
      <AdminCrisisPanel />
    </div>
  );
}
