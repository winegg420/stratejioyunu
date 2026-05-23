import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import NewsFeed from '../components/NewsFeed';
import { ADMIN_LOG_TAG, adminLogToNewsItem } from '../lib/adminOverrideEngine';
import { fetchAdminLogs } from '../lib/adminBroadcastSync';
import { isGameAdmin } from '../lib/adminAccess';
import { isDevAdminLocalEnabled } from '../lib/devTestMode';
import { useAuth } from '../context/AuthContext';
import { useGameStore } from '../stores/gameStore';

export default function AdminLog() {
  const { playerName, session } = useAuth();
  const isAdminUser = useGameStore((s) => s.isAdminUser);
  const isFounder = isGameAdmin({
    playerName,
    email: session?.user?.email ?? null,
    session,
    profileIsAdmin: isAdminUser,
  });
  const adminActive = isDevAdminLocalEnabled();
  const storeLogs = useGameStore((s) => s.adminPublicLogs ?? []);
  const refreshServerBroadcast = useGameStore((s) => s.refreshServerBroadcast);
  const enableAdminMode = useGameStore((s) => s.enableAdminMode);
  const disableAdminMode = useGameStore((s) => s.disableAdminMode);
  const [logs, setLogs] = useState(storeLogs);
  const [loading, setLoading] = useState(true);
  const [toggleBusy, setToggleBusy] = useState(false);

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

  const handleEnableAdmin = useCallback(async () => {
    setToggleBusy(true);
    try {
      await enableAdminMode();
    } finally {
      setToggleBusy(false);
    }
  }, []);

  const handleDisableAdmin = useCallback(async () => {
    setToggleBusy(true);
    try {
      await disableAdminMode();
    } finally {
      setToggleBusy(false);
    }
  }, []);

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
                  ? 'Hesabınız test güçleriyle yükseltildi. Kapatınca admin moduna girmeden önceki kayıt geri yüklenir.'
                  : 'Admin moduna geçince anında Sv.15 bina, dolu kaynak ve 100 birlik; kapatınca eski halinize dönersiniz.'}
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
            <button
              type="button"
              className="btn btn-hud-primary admin-log-dev-unlock"
              onClick={handleEnableAdmin}
              disabled={toggleBusy}
            >
              {toggleBusy ? 'Aktifleştiriliyor…' : 'Admin Moduna Geç (test)'}
            </button>
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
