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
  GOVERNANCE_LIBERAL,
  GOVERNANCE_PROFILES,
  GOVERNANCE_STATIST,
} from '../lib/presidencySystem';

export default function GlobalBriefingModal({
  open,
  onAccept,
  onSelectGovernance,
  selectedGovernance,
  showGovernancePick = true,
}) {
  const [mounted, setMounted] = useState(false);
  const { visibleCompleted, currentPartial, done, isTyping } = useTypewriter(
    GLOBAL_BRIEFING_PARAGRAPHS,
    { active: open, charMs: 26, pauseMs: 480 },
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  const canAccept = done && (!showGovernancePick || selectedGovernance);

  return createPortal(
    <div className="global-briefing-overlay" role="dialog" aria-modal="true" aria-labelledby="global-briefing-title">
      <div className="global-briefing-backdrop" aria-hidden="true" />
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

        {showGovernancePick && done && (
          <div className="global-briefing-governance">
            <p className="global-briefing-governance__label">[ YÖNETİM DOKTRİNİ / SEÇİM ZORUNLU ]</p>
            <div className="global-briefing-governance__grid">
              {[GOVERNANCE_LIBERAL, GOVERNANCE_STATIST].map((id) => {
                const profile = GOVERNANCE_PROFILES[id];
                const active = selectedGovernance === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`global-briefing-gov-btn${active ? ' is-active' : ''}`}
                    onClick={() => onSelectGovernance?.(id)}
                  >
                    <span className="global-briefing-gov-btn__tag">{profile.tag}</span>
                    <strong>{profile.label}</strong>
                    <span>{profile.ideology}</span>
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
