import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { profile } from '../data/placeholder';

export default function Profile() {
  const { logout, playerName } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/giris', { replace: true });
  };

  return (
    <div className="page">
      <PageHeader
        title="Profil"
        subtitle="Rütbe, rozetler ve sezon geçmişi."
        action={(
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>
            Çıkış Yap
          </button>
        )}
      />
      <div className="profile-header card">
        <div className="avatar">🎖️</div>
        <div>
          <h2>{playerName}</h2>
          <p>{profile.rank} · {profile.points.toLocaleString('tr-TR')} puan</p>
          <p>Şehir: {profile.cities} · İttifak: {profile.alliance}</p>
        </div>
      </div>
      <section className="panel">
        <h3 className="panel-title">Rozetler</h3>
        <div className="badge-row">
          {profile.badges.map((b) => (
            <span key={b} className="achievement-badge">{b}</span>
          ))}
        </div>
      </section>
      <section className="panel">
        <h3 className="panel-title">Sezon Geçmişi</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Sezon</th>
              <th>Sıra</th>
              <th>Puan</th>
              <th>Şehir</th>
            </tr>
          </thead>
          <tbody>
            {profile.seasonHistory.map((s) => (
              <tr key={s.season}>
                <td>{s.season}</td>
                <td>#{s.rank}</td>
                <td>{s.points.toLocaleString('tr-TR')}</td>
                <td>{s.cities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
