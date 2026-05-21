import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import NewsFeed from '../components/NewsFeed';
import { ADMIN_LOG_TAG, adminLogToNewsItem } from '../lib/adminOverrideEngine';
import { fetchAdminLogs } from '../lib/adminBroadcastSync';
import { useGameStore } from '../stores/gameStore';

export default function AdminLog() {
  const storeLogs = useGameStore((s) => s.adminPublicLogs ?? []);
  const refreshServerBroadcast = useGameStore((s) => s.refreshServerBroadcast);
  const [logs, setLogs] = useState(storeLogs);
  const [loading, setLoading] = useState(true);

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

  const newsItems = (logs.length ? logs : storeLogs).map(adminLogToNewsItem);

  return (
    <div className="page page--console admin-log-page">
      <PageHeader
        title="Admin Müdahale Kayıtları"
        subtitle="> Admin override log — tüm müdahaleler şeffaf ve kalıcı kayıt altında..."
        status={ADMIN_LOG_TAG}
      />
      <section className="panel admin-log-intro">
        <p>
          Deprem, salgın, Merkez Bankası fiyat müdahalesi ve bölgesel teşvikler burada{' '}
          <strong>{ADMIN_LOG_TAG}</strong> etiketiyle listelenir. Hiçbir müdahale gizlenmez.
        </p>
      </section>
      {loading ? (
        <p className="admin-log-loading">Kayıtlar yükleniyor…</p>
      ) : (
        <NewsFeed items={newsItems} />
      )}
    </div>
  );
}
