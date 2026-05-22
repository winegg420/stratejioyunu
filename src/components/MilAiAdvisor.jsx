import { useEffect, useMemo, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useTypewriter } from '../hooks/useTypewriter';
import { getMilAiNextStep } from '../lib/aiProgression';
import { buildMilAiTerminalLines } from '../lib/milAiDynamicAdvice';

export default function MilAiAdvisor() {
  const activeCityId = useGameStore((s) => s.activeCityId);
  const city = useGameStore((s) => s.cities[s.activeCityId]);
  const researches = useGameStore((s) => s.researches);
  const expeditions = useGameStore((s) => s.expeditions);

  const guideState = useMemo(
    () => ({ activeCityId, cities: { [activeCityId]: city }, researches, expeditions }),
    [activeCityId, city, researches, expeditions],
  );

  const guide = useMemo(() => getMilAiNextStep(guideState), [guideState]);

  const lineSignature = useMemo(() => {
    const { nextStep, lastCompleted, allComplete, stepIndex } = guide;
    const city = guideState.cities?.[guideState.activeCityId];
    const hasOutgoing = (guideState.expeditions ?? []).some(
      (e) => e.direction === 'outgoing' && (e.endsAt == null || e.endsAt > Date.now()),
    );
    return [
      stepIndex,
      allComplete ? 'done' : '',
      lastCompleted?.id ?? '',
      nextStep?.id ?? '',
      nextStep?.progressHint?.(guideState) ?? '',
      city?.happiness ?? '',
      (city?.constructionQueue?.length ?? 0),
      (guideState.expeditions?.length ?? 0),
      hasOutgoing ? 'out' : 'idle',
    ].join('|');
  }, [guide, guideState]);

  const lines = useMemo(
    () => buildMilAiTerminalLines(guideState),
    [lineSignature, guideState],
  );

  const { visibleCompleted, currentPartial, done, isTyping } = useTypewriter(lines, {
    active: true,
    charMs: 18,
    pauseMs: 340,
  });

  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [visibleCompleted, currentPartial, done, lineSignature]);

  return (
    <aside
      className={`mil-ai-advisor mil-ai-terminal mil-ai-terminal--guide glass-panel${guide.allComplete ? ' mil-ai-advisor--done' : ''}`}
    >
      <div className="mil-ai-advisor__head">
        <span className="mil-ai-advisor__badge">MIL-AI REHBER</span>
        <span className="mil-ai-advisor__pulse" aria-hidden="true" />
        <span className="mil-ai-terminal__status font-hud-data" aria-live="polite">
          {guide.allComplete ? (
            'REHBER TAMAM'
          ) : (
            <>
              <span className="mil-ai-terminal__status-dot" aria-hidden="true" />
              <span className="mil-ai-terminal__status-label">AKTİF</span>
              {isTyping && (
                <span className="mil-ai-terminal__status-hint"> · YAZIYOR</span>
              )}
              {!isTyping && done && (
                <span className="mil-ai-terminal__status-hint">
                  {` · ADIM ${guide.stepIndex + 1}/3`}
                </span>
              )}
            </>
          )}
        </span>
      </div>

      <div className="mil-ai-terminal__screen" ref={scrollRef}>
        <div className="mil-ai-terminal__body">
          {visibleCompleted.map((line, i) => (
            <p
              key={`${lineSignature}-done-${i}`}
              className={[
                'mil-ai-terminal__line',
                'mil-ai-terminal__line--done',
                line.includes('GÖREV TAMAMLANDI') && 'mil-ai-terminal__line--complete',
                line.includes('SIRADAKİ HEDEF') && 'mil-ai-terminal__line--next',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {line}
            </p>
          ))}
          {currentPartial && (
            <p className="mil-ai-terminal__line mil-ai-terminal__line--active">
              {currentPartial}
              <span className="mil-ai-terminal__cursor" aria-hidden="true" />
            </p>
          )}
        </div>
      </div>

      {!guide.allComplete && guide.nextStep && !isTyping && done && (
        <span className="mil-ai-advisor__pending mil-ai-advisor__pending--guide">
          Aktif hedef: {guide.nextStep.title}
        </span>
      )}
    </aside>
  );
}
