import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import { useAuth } from '../context/AuthContext';
import { isFounderPlayer } from '../lib/adminAccess';
import { profile } from '../data/placeholder';
import {
  MIN_VIP_DEVELOPMENT_SCORE,
  formatVipBonusPercent,
  getVipProductionMultiplier,
} from '../lib/vipPrestige';
import { formatInactivityDays } from '../lib/serverCleansing';
import {
  IDEOLOGY_IDS,
  IDEOLOGY_PROFILES,
  formatIdeologyChangeDeadline,
  formatIdeologyLabel,
} from '../lib/ideologySystem';
import {
  IDEOLOGY_CHANGE_COST_MONEY,
  IDEOLOGY_CHANGE_REAL_MONEY_NOTE,
  formatLoyaltyScore,
} from '../lib/loyaltySystem';
import { PROTECTION_DAYS } from '../data/placeholder';
import { getProgressionState } from '../lib/progressionSystem';
import { useGameStore } from '../stores/gameStore';

export default function Profile() {
  const { logout, playerName, session } = useAuth();
  const isFounder = isFounderPlayer(playerName, session?.user?.email);
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [regimeConfirm, setRegimeConfirm] = useState(null);

  const playerMeta = useGameStore((s) => s.playerMeta);
  const developmentScore = useGameStore((s) => s.getDevelopmentScore());
  const canVipAscend = useGameStore((s) => s.canVipAscend());
  const performVipAscension = useGameStore((s) => s.performVipAscension);
  const playerCities = useGameStore((s) => s.playerCities);
  const playerIdeology = useGameStore((s) => s.playerIdeology);
  const protectionEndsAt = useGameStore((s) => s.protectionEndsAt);
  const canChangeIdeologyFree = useGameStore((s) => s.canChangeIdeology);
  const canAffordIdeologyChange = useGameStore((s) => s.canAffordIdeologyChange);
  const loyaltyScore = useGameStore((s) => s.loyaltyScore ?? 0);
  const cosmeticTitles = useGameStore((s) => s.cosmeticTitles ?? []);
  const setPlayerIdeology = useGameStore((s) => s.setPlayerIdeology);
  const activeCity = useGameStore((s) => s.cities[s.activeCityId]);
  const ideologyUnlocked = getProgressionState(activeCity).ideologyUnlocked;
  const ideologyLockHint = getProgressionState(activeCity).locks.ideology;

  const freeWindow = canChangeIdeologyFree();
  const paidChange = Boolean(playerIdeology) && !freeWindow;

  const vipTier = playerMeta?.vipTier ?? 0;
  const allBadges = useMemo(() => {
    const fromMeta = playerMeta?.badges ?? [];
    const merged = [...profile.badges];
    for (const b of fromMeta) {
      if (!merged.includes(b)) merged.push(b);
    }
    for (const t of cosmeticTitles) {
      const label = typeof t === 'string' ? t : t?.label;
      if (label && !merged.includes(label)) merged.push(label);
    }
    return merged;
  }, [playerMeta?.badges, cosmeticTitles]);

  const handleLogout = () => {
    logout();
    navigate('/giris', { replace: true });
  };

  const handleVipConfirm = () => {
    const ok = performVipAscension();
    setConfirmOpen(false);
    if (ok) navigate('/harita', { replace: false });
  };

  const handleIdeologyPick = (id) => {
    if (id === playerIdeology) return;
    if (paidChange && !canAffordIdeologyChange()) return;
    if (playerIdeology && (paidChange || freeWindow)) {
      setRegimeConfirm(id);
      return;
    }
    setPlayerIdeology(id, { force: !playerIdeology });
  };

  const confirmRegimeChange = () => {
    if (!regimeConfirm) return;
    setPlayerIdeology(regimeConfirm);
    setRegimeConfirm(null);
  };

  return (
    <div className={`page page--console profile-page${confirmOpen ? ' profile-page--vip-reset' : ''}`}>
      {confirmOpen && (
        <div className="profile-vip-reset-overlay" aria-hidden="true">
          <p className="profile-vip-reset-msg">SERVER RESET INITIATED</p>
        </div>
      )}
      <LocalizedPageHeader
        pageKey="profile"
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
            İdeoloji sadakati:{' '}
            <span className="font-hud-data">{formatLoyaltyScore(loyaltyScore)}</span>
            {' '}
            ·{' '}
            <button type="button" className="link-btn" onClick={() => navigate('/siralama')}>
              Liderlik tablosu
            </button>
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

      {isFounder && (
        <section className="panel profile-founder-panel">
          <h3 className="panel-title">Kurucu Komuta</h3>
          <p className="hint">Gizli kriz müdahale paneli — God Mode.</p>
          <button type="button" className="btn btn-danger" onClick={() => navigate('/kurucu-kriz')}>
            Kriz Komut Merkezi
          </button>
        </section>
      )}

      <section className="panel profile-ideology-panel">
        <h3 className="panel-title">Siyasi İdeoloji</h3>
        <p className="profile-ideology-current">
          Aktif doktrin:{' '}
          <strong>{playerIdeology ? formatIdeologyLabel(playerIdeology) : 'Seçilmedi'}</strong>
        </p>
        <p className="hint profile-ideology-window">
          {freeWindow
            ? `${PROTECTION_DAYS} gün yeni hesap koruması — ücretsiz ideoloji değişimi: ${formatIdeologyChangeDeadline(protectionEndsAt)}`
            : `Koruma kapandı. Rejim değişimi maliyeti: ${IDEOLOGY_CHANGE_COST_MONEY.toLocaleString('tr-TR')} Bütçe. Mutluluk sert düşer; küresel haber duyurulur.`}
        </p>
        {!freeWindow && (
          <p className="hint profile-ideology-paid-note">{IDEOLOGY_CHANGE_REAL_MONEY_NOTE}</p>
        )}
        {!ideologyUnlocked && (
          <p className="hint profile-ideology-lock">
            🔒 {ideologyLockHint ?? 'İdeoloji politikaları henüz kilitli.'}
          </p>
        )}
        <div className={`profile-ideology-grid profile-ideology-grid--doctrine${!ideologyUnlocked ? ' profile-ideology-grid--locked' : ''}`}>
          {IDEOLOGY_IDS.map((id) => {
            const p = IDEOLOGY_PROFILES[id];
            const active = playerIdeology === id;
            const disabled = !ideologyUnlocked || (paidChange && !canAffordIdeologyChange() && !active);
            return (
              <button
                key={id}
                type="button"
                className={`doctrine-card${active ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}
                style={{ '--ideology-color': p.color }}
                disabled={disabled}
                title={!ideologyUnlocked ? ideologyLockHint ?? '' : undefined}
                onClick={() => handleIdeologyPick(id)}
              >
                <span className="doctrine-card__rank">{p.tag}</span>
                <div className="doctrine-card__head">
                  <span className="doctrine-card__emoji" aria-hidden="true">{p.emoji}</span>
                  <span className="doctrine-card__title">{p.label}</span>
                </div>
                <span className="doctrine-card__subtitle">{p.subtitle}</span>
                <p className="doctrine-card__blurb">{p.blurb}</p>
              </button>
            );
          })}
        </div>
      </section>

      {regimeConfirm && (
        <div className="profile-regime-modal card" role="dialog" aria-labelledby="regime-title">
          <h3 id="regime-title" className="panel-title">Rejim değişikliği</h3>
          <p>
            Doktrini{' '}
            <strong>{formatIdeologyLabel(regimeConfirm)}</strong>
            {' '}
            olarak değiştirmek istiyor musunuz?
          </p>
          {paidChange && (
            <p className="profile-regime-cost">
              Maliyet:{' '}
              <span className="font-hud-data">
                {IDEOLOGY_CHANGE_COST_MONEY.toLocaleString('tr-TR')}
              </span>
              {' '}
              Bütçe
            </p>
          )}
          <p className="hint">Tüm şehirlerde mutluluk geçici olarak düşer; küresel haber akışına duyuru düşer.</p>
          <div className="profile-vip-confirm-btns">
            <button type="button" className="btn btn-danger" onClick={confirmRegimeChange}>
              Doktrini ilan et
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setRegimeConfirm(null)}>
              İptal
            </button>
          </div>
        </div>
      )}

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
            <span
              key={b}
              className={`achievement-badge${
                b.includes('VIP') || b.includes('🏆') ? ' achievement-badge--vip' : ''
              }`}
            >
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
