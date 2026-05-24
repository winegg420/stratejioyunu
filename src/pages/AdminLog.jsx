import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import NewsFeed from '../components/NewsFeed';
import { ADMIN_LOG_TAG, adminLogToNewsItem } from '../lib/adminOverrideEngine';
import { fetchAdminLogs } from '../lib/adminBroadcastSync';
import { isGameAdmin } from '../lib/adminAccess';
import { isDevAdminLocalEnabled } from '../lib/devTestMode';
import {
  isAdminPanelUnlocked,
  matchesAdminUnlockPair,
  setAdminPanelUnlocked,
} from '../lib/adminUnlock';
import { useAuth } from '../context/AuthContext';
import { useGameStore } from '../stores/gameStore';
import { useNotificationStore } from '../stores/notificationStore';

export default function AdminLog() {
  const { playerName, session } = useAuth();
  const isAdminUser = useGameStore((s) => s.isAdminUser);
  const devTestModeActive = useGameStore((s) => s.devTestModeActive);
  const addToast = useNotificationStore((s) => s.addToast);
  const isFounder = isGameAdmin({
    playerName,
    email: session?.user?.email ?? null,
    session,
    profileIsAdmin: isAdminUser,
  });
  const adminActive = devTestModeActive || isDevAdminLocalEnabled();
  const storeLogs = useGameStore((s) => s.adminPublicLogs ?? []);
  const refreshServerBroadcast = useGameStore((s) => s.refreshServerBroadcast);
  const enableAdminMode = useGameStore((s) => s.enableAdminMode);
  const disableAdminMode = useGameStore((s) => s.disableAdminMode);
  const [logs, setLogs] = useState(storeLogs);
  const [loading, setLoading] = useState(true);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [unlockUser, setUnlockUser] = useState('test@');
  const [unlockCode, setUnlockCode] = useState('aktif@');
  const [panelUnlocked, setPanelUnlocked] = useState(
    () => isAdminPanelUnlocked() || isDevAdminLocalEnabled(),
  );

  const canUseAdminToggle = isFounder || panelUnlocked || adminActive;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await refreshServerBroadcast();
      const rows = await fetchAdminLogs(100);
      if (!cancelled) {
        setLogs(rows);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshServerBroadcast]);

  const sessionUserId = session?.user?.id ?? null;

  const handleEnableAdmin = useCallback(async () => {
    if (!canUseAdminToggle) {
      addToast('Önce test@ / aktif@ ile paneli açın.', 'warn');
      return;
    }
    setToggleBusy(true);
    try {
      await enableAdminMode(sessionUserId);
      addToast('Admin test modu etkin — sayfa yenilenmedi.', 'success');
    } finally {
      setToggleBusy(false);
    }
  }, [enableAdminMode, addToast, canUseAdminToggle, sessionUserId]);

  const handleDisableAdmin = useCallback(async () => {
    setToggleBusy(true);
    try {
      await disableAdminMode(sessionUserId);
      addToast('Admin test modu kapatıldı — kaydınız geri yüklendi.', 'success');
    } finally {
      setToggleBusy(false);
    }
  }, [disableAdminMode, sessionUserId, addToast]);

  const handleUnlockPanel = useCallback((e) => {
    e.preventDefault();
    if (matchesAdminUnlockPair(unlockUser, unlockCode)) {
      setAdminPanelUnlocked(true);
      setPanelUnlocked(true);
      addToast('Admin paneli açıldı — modu başlatmak için butona basın.', 'success');
    } else {
      addToast('Geçersiz kod. Kullanıcı: test@ · Kod: aktif@', 'error');
    }
  }, [unlockUser, unlockCode, addToast]);

  const newsItems = (logs.length ? logs : storeLogs).map(adminLogToNewsItem);

  return (
    <div className="page page--console admin-log-page">
      <LocalizedPageHeader
        pageKey="adminLog"
        status={ADMIN_LOG_TAG}
      />
      <section className="panel admin-log-intro">
        <p>
          Deprem, salgın, Merkez Bankası fiyat müdahalesi ve bölgesel teşvikler burada{' '}
          <strong>{ADMIN_LOG_TAG}</strong> etiketiyle listelenir. Hiçbir müdahale gizlenmez.
        </p>
        <div className="admin-log-dev-actions">
          {isFounder ? (
            <>
              <span className="admin-log-dev-badge">
                {adminActive ? 'Admin test modu aktif' : 'Kurucu erişimi (test modu kapalı)'}
              </span>
              <p className="hint admin-log-dev-hint">
                {adminActive
                  ? 'Hesabınız test güçleriyle yükseltildi. Durdurunca normal kaydınız anında geri yüklenir.'
                  : 'Admin modu: Sv.15 bina, dolu kaynak, 100 birlik — sayfa yenilenmeden uygulanır.'}
              </p>
              <div className="admin-log-dev-actions__row">
                {adminActive ? (
                  <>
                    <Link to="/kurucu-kriz" className="btn btn-hud-secondary btn-sm">
                      Kurucu Komuta Merkezi →
                    </Link>
                    <button
                      type="button"
                      className="btn btn-hud-secondary btn-sm"
                      onClick={handleDisableAdmin}
                      disabled={toggleBusy}
                    >
                      {toggleBusy ? 'Geri yükleniyor…' : 'Admin modunu durdur'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-hud-primary admin-log-dev-unlock"
                    onClick={handleEnableAdmin}
                    disabled={toggleBusy}
                  >
                    {toggleBusy ? 'Aktifleştiriliyor…' : 'Admin moduna geç'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {!canUseAdminToggle && !adminActive && (
                <form className="admin-log-unlock" onSubmit={handleUnlockPanel}>
                  <p className="hint admin-log-dev-hint">
                    Admin test modu yalnızca bu panelden açılır. Kod: <strong>test@</strong> / <strong>aktif@</strong>
                  </p>
                  <div className="admin-log-unlock__row">
                    <input
                      type="text"
                      className="admin-log-unlock__input"
                      value={unlockUser}
                      onChange={(e) => setUnlockUser(e.target.value)}
                      placeholder="test@"
                      autoComplete="off"
                    />
                    <input
                      type="text"
                      className="admin-log-unlock__input"
                      value={unlockCode}
                      onChange={(e) => setUnlockCode(e.target.value)}
                      placeholder="aktif@"
                      autoComplete="off"
                    />
                    <button type="submit" className="btn btn-hud-secondary btn-sm">
                      Paneli aç
                    </button>
                  </div>
                </form>
              )}
              {canUseAdminToggle && (
                <>
                  <span className="admin-log-dev-badge">
                    {adminActive ? 'Admin test modu aktif' : 'Panel açık — mod kapalı'}
                  </span>
                  <p className="hint admin-log-dev-hint">
                    {adminActive
                      ? 'Durdurunca normal oyuncu kaydınız anında geri yüklenir.'
                      : 'Admin moduna geçince test güçleri anında yüklenir (sayfa yenilenmez).'}
                  </p>
                  <div className="admin-log-dev-actions__row">
                    {adminActive ? (
                      <button
                        type="button"
                        className="btn btn-hud-secondary btn-sm"
                        onClick={handleDisableAdmin}
                        disabled={toggleBusy}
                      >
                        {toggleBusy ? 'Geri yükleniyor…' : 'Admin modunu durdur'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-hud-primary admin-log-dev-unlock"
                        onClick={handleEnableAdmin}
                        disabled={toggleBusy}
                      >
                        {toggleBusy ? 'Aktifleştiriliyor…' : 'Admin moduna geç'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
      {loading ? (
        <p className="admin-log-loading">Kayıtlar yükleniyor…</p>
      ) : (
        <NewsFeed items={newsItems} />
      )}
    </div>
  );
}
