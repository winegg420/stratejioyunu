import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BRIEFING_CTA_ALT_LABEL,
  BRIEFING_CTA_LABEL,
  GLOBAL_BRIEFING_PARAGRAPHS,
  GLOBAL_BRIEFING_SUBTITLE,
  GLOBAL_BRIEFING_TITLE,
} from '../data/globalBriefing';
import { useTypewriter } from '../hooks/useTypewriter';
import {
  IDEOLOGY_IDS,
  IDEOLOGY_PROFILES,
} from '../lib/ideologySystem';

export default function GlobalBriefingModal({
  open,
  onAccept,
  onSelectIdeology,
  selectedIdeology,
  showIdeologyPick = true,
}) {
  const [mounted, setMounted] = useState(false);
  const { visibleCompleted, currentPartial, done, isTyping, skipToEnd } = useTypewriter(
    GLOBAL_BRIEFING_PARAGRAPHS,
    { active: open, charMs: 26, pauseMs: 480 },
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const canAccept = done && (!showIdeologyPick || selectedIdeology);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && canAccept) onAccept?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, canAccept, onAccept]);

  if (!mounted || !open) return null;

  const completeTyping = () => {
    if (!done) skipToEnd();
  };

  const handleBackdrop = () => {
    if (!done) {
      skipToEnd();
      return;
    }
    if (canAccept) onAccept?.();
  };

  return createPortal(
    <div
      className="global-briefing-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-briefing-title"
      onClick={completeTyping}
    >
      <button
        type="button"
        className="global-briefing-backdrop"
        onClick={handleBackdrop}
        aria-label="Brifingi kapat"
      />
      <article className="global-briefing-panel">
        <header className="global-briefing-panel__head">
          <span className="global-briefing-panel__eyebrow">[ {GLOBAL_BRIEFING_TITLE} ]</span>
          <h2 id="global-briefing-title" className="global-briefing-panel__title">
            Küresel Durum Brifingi
          </h2>
          <p className="global-briefing-panel__sub">{GLOBAL_BRIEFING_SUBTITLE}</p>
          <div className="global-briefing-panel__status" aria-live="polite">
            <span className="global-briefing-panel__pulse" />
            {isTyping ? 'AKIŞ AKTİF' : 'BRİFİNG TAMAMLANDI'}
          </div>
        </header>

        <div className="global-briefing-panel__body">
          <div className="global-briefing-terminal">
            {visibleCompleted.map((para) => (
              <p key={para} className="global-briefing-line global-briefing-line--done">
                {para}
              </p>
            ))}
            {currentPartial && (
              <p className="global-briefing-line global-briefing-line--active">
                {currentPartial}
                <span className="global-briefing-cursor" aria-hidden="true" />
              </p>
            )}
          </div>
        </div>

        {showIdeologyPick && done && (
          <div className="global-briefing-governance global-briefing-ideology">
            <p className="global-briefing-governance__label">[ SİYASİ İDEOLOJİ / ZORUNLU SEÇİM ]</p>
            <p className="global-briefing-ideology__hint">
              7 gün koruma süresince ideolojinizi değiştirebilirsiniz. Hiçbir yol kilitlenmez — uzmanlık çarpanları uygulanır.
            </p>
            <div className="global-briefing-governance__grid global-briefing-ideology__grid">
              {IDEOLOGY_IDS.map((id) => {
                const profile = IDEOLOGY_PROFILES[id];
                const active = selectedIdeology === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`global-briefing-gov-btn global-briefing-ideology-btn${active ? ' is-active' : ''}`}
                    style={{ '--ideology-color': profile.color }}
                    onClick={() => onSelectIdeology?.(id)}
                  >
                    <span className="global-briefing-gov-btn__tag">{profile.tag}</span>
                    <strong>{profile.emoji} {profile.label}</strong>
                    <span>{profile.subtitle}</span>
                    <span className="global-briefing-gov-btn__blurb">{profile.blurb}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <footer className="global-briefing-panel__foot">
          <button
            type="button"
            className="btn global-briefing-cta"
            disabled={!canAccept}
            onClick={onAccept}
          >
            <span className="global-briefing-cta__glow" aria-hidden="true" />
            {BRIEFING_CTA_LABEL}
          </button>
          <span className="global-briefing-cta-hint">{BRIEFING_CTA_ALT_LABEL}</span>
        </footer>
      </article>
    </div>,
    document.body,
  );
}
