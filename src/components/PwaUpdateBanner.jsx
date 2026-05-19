import { useEffect, useState } from 'react';

export default function PwaUpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onRefresh = () => setVisible(true);
    window.addEventListener('pwa-need-refresh', onRefresh);
    return () => window.removeEventListener('pwa-need-refresh', onRefresh);
  }, []);

  if (!visible) return null;

  return (
    <aside className="pwa-update-banner" role="status" aria-live="polite">
      <span className="pwa-update-banner__icon" aria-hidden="true">📡</span>
      <p className="pwa-update-banner__text">
        [ SİSTEM GÜNCELLEMESİ ALINDI — YENİDEN BAŞLAT ]
      </p>
      <button
        type="button"
        className="btn btn-primary btn-sm pwa-update-banner__btn"
        onClick={() => window.location.reload()}
      >
        Yenile
      </button>
      <button
        type="button"
        className="pwa-update-banner__dismiss"
        onClick={() => setVisible(false)}
        aria-label="Kapat"
      >
        ×
      </button>
    </aside>
  );
}
