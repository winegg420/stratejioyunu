import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { profile } from '../data/placeholder';
import {
  MIN_VIP_DEVELOPMENT_SCORE,
  formatVipBonusPercent,
  getVipProductionMultiplier,
} from '../lib/vipPrestige';
import { formatInactivityDays } from '../lib/serverCleansing';
import { useGameStore } from '../stores/gameStore';

export default function Profile() {
  const { logout, playerName } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const playerMeta = useGameStore((s) => s.playerMeta);
  const developmentScore = useGameStore((s) => s.getDevelopmentScore());
  const canVipAscend = useGameStore((s) => s.canVipAscend());
  const performVipAscension = useGameStore((s) => s.performVipAscension);
  const playerCities = useGameStore((s) => s.playerCities);

  const vipTier = playerMeta?.vipTier ?? 0;
  const allBadges = useMemo(() => {
    const fromMeta = playerMeta?.badges ?? [];
    const merged = [...profile.badges];
    for (const b of fromMeta) {
      if (!merged.includes(b)) merged.push(b);
    }
    return merged;
  }, [playerMeta?.badges]);

  const handleLogout = () => {
    logout();
    navigate('/giris', { replace: true });
  };

  const handleVipConfirm = () => {
    const ok = performVipAscension();
    setConfirmOpen(false);
    if (ok) navigate('/harita', { replace: false });
  };

  return (
    <div className={`page profile-page${confirmOpen ? ' profile-page--vip-reset' : ''}`}>
      {confirmOpen && (
        <div className="profile-vip-reset-overlay" aria-hidden="true">
          <p className="profile-vip-reset-msg">SERVER RESET INITIATED</p>
        </div>
      )}
      <PageHeader
        title="Profil"
        subtitle="Rütbe, rozetler, VIP katmanı ve sezon geçmişi."
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
          <p>
            {profile.rank} ·{' '}
            <span className="font-hud-data">{developmentScore.toLocaleString('tr-TR')}</span> gelişim puanı
          </p>
          <p>
            Şehir: {playerCities.length} · İttifak: {profile.alliance}
            {vipTier > 0 && (
              <>
                {' '}
                · VIP Katman {vipTier} ({formatVipBonusPercent(vipTier)} maden)
              </>
            )}
          </p>
        </div>
      </div>

      <section className="panel profile-vip-panel">
        <h3 className="panel-title">VIP Atma (Prestige)</h3>
        <p className="profile-vip-desc">
          Gelişim puanı <strong className="font-hud-data">{MIN_VIP_DEVELOPMENT_SCORE.toLocaleString('tr-TR')}</strong>
          {' '}
          ve üzerine ulaştığınızda mevcut imparatorluğunuzu sıfırlayıp kalıcı askeri madalya ve maden üretim
          bonusu kazanabilirsiniz. Her VIP atışında tüm şehirleriniz haritadan kaldırılır; tek yeni üs ile
          başlarsınız.
        </p>
        <ul className="profile-vip-perks">
          <li>Kalıcı <strong>{formatVipBonusPercent(1)}</strong> maden üretim hızı (katman başına)</li>
          <li>
            Mevcut katman bonusunuz:{' '}
            <strong className="font-hud-data">{formatVipBonusPercent(Math.max(1, vipTier))}</strong>
            {' '}
            (çarpan ×{getVipProductionMultiplier(vipTier).toFixed(2)})
          </li>
          <li>Profilde görünen VIP askeri madalya rozeti</li>
        </ul>

        <div className="profile-vip-actions">
          {!canVipAscend || !confirmOpen ? (
            <button
              type="button"
              className="btn btn-danger profile-vip-btn"
              disabled={!canVipAscend}
              onClick={() => canVipAscend && setConfirmOpen(true)}
            >
              VIP At
            </button>
          ) : (
              <div className="profile-vip-confirm">
                <p className="profile-vip-warn">
                  Tüm şehirler, binalar ve ordular silinecek. Bu işlem geri alınamaz. Onaylıyor musunuz?
                </p>
                <div className="profile-vip-confirm-btns">
                  <button type="button" className="btn btn-danger" onClick={handleVipConfirm}>
                    Evet, VIP At
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmOpen(false)}>
                    İptal
                  </button>
                </div>
              </div>
            )}
        </div>
        {!canVipAscend && (
          <p className="profile-vip-locked">
            VIP At için{' '}
            <span className="font-hud-data">
              {Math.max(0, MIN_VIP_DEVELOPMENT_SCORE - developmentScore).toLocaleString('tr-TR')}
            </span>
            {' '}
            gelişim puanı daha gerekli.
          </p>
        )}
      </section>

      <section className="panel profile-cleansing-panel">
        <h3 className="panel-title">Sunucu Temizlik Motoru</h3>
        <p className="profile-vip-desc">
          Son <strong>{formatInactivityDays()} gün</strong> giriş yapmayan oyuncuların şehirleri otomatik
          hayalet statüsünden geçirilip haritada gri, sahipsiz boş araziye dönüştürülür. Aktif oyuncular
          için sürekli yer açılır.
        </p>
      </section>

      <section className="panel">
        <h3 className="panel-title">Rozetler</h3>
        <div className="badge-row">
          {allBadges.map((b) => (
            <span key={b} className={`achievement-badge${b.includes('VIP') ? ' achievement-badge--vip' : ''}`}>
              {b}
            </span>
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
                <td className="font-hud-data">{s.points.toLocaleString('tr-TR')}</td>
                <td>{s.cities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
