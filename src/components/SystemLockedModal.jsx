import { useEffect } from 'react';

export default function SystemLockedModal({ open, featureLabel, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="system-locked-root" role="dialog" aria-modal="true" aria-labelledby="system-locked-title">
      <button type="button" className="system-locked-backdrop" onClick={onClose} aria-label="Kapat" />
      <div className="system-locked-panel">
        <div className="system-locked-led" aria-hidden="true">
          <span className="system-locked-led__dot" />
          <span className="system-locked-led__scan" />
        </div>
        <p className="system-locked-eyebrow">SECURE CHANNEL</p>
        <h2 id="system-locked-title" className="system-locked-title">
          SYSTEM LOCKED
        </h2>
        <p className="system-locked-sub">ACCESS DENIED</p>
        {featureLabel ? (
          <p className="system-locked-feature">
            Hedef modül: <strong>{featureLabel}</strong>
          </p>
        ) : null}
        <p className="system-locked-hint">Bu modül bir sonraki operasyon paketinde devreye alınacak.</p>
        <button type="button" className="btn btn-secondary system-locked-close" onClick={onClose}>
          [ KAPAT ]
        </button>
      </div>
    </div>
  );
}
