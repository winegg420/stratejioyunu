import { useMemo, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { buildMilAiTerminalLines } from '../lib/milAiDynamicAdvice';
import {
  getMilAiTutorialProgress,
  isMilAiAdvisorOnline,
  isMilAiTutorialActive,
  resolveMilAiCompletedStatusLabel,
} from '../lib/milAiTutorialQuests';
import { useLanguage } from '../context/LanguageContext';
import { useMilAiLiveContext } from '../hooks/useMilAiLiveContext';

function lineClassName(line) {
  if (line.startsWith('[ GÖREV') || line.startsWith('[ GÖREV-') || /^GÖREV-\d+/.test(line)) {
    return 'mil-ai-terminal__line--task';
  }
  if (line.includes('GÖREV TAMAMLANDI') || line.includes('COMPLETE')) {
    return 'mil-ai-terminal__line--celebrate';
  }
  if (line.startsWith('[ DURUM') || line.startsWith('[ STATUS')) {
    return 'mil-ai-terminal__line--status';
  }
  if (line.startsWith('[ EMİR') || line.startsWith('[ ORDER') || line.startsWith('[ EMİR')) {
    return 'mil-ai-terminal__line--order';
  }
  if (line.startsWith('[ UYARI') || line.startsWith('[ WARNING')) {
    return 'mil-ai-terminal__line--severity-warn';
  }
  if (line.startsWith('[ BRİF')) {
    return 'mil-ai-terminal__line--intel';
  }
  if (line.startsWith('[ SİSTEM') || line.startsWith('[ SYSTEM')) {
    return 'mil-ai-terminal__line--standby';
  }
  if (line.startsWith('[ TAVSİYE') || line.startsWith('[ ADVICE')) {
    return 'mil-ai-terminal__line--intel';
  }
  if (line.includes('Kritik') || line.includes('Critical')) {
    return 'mil-ai-terminal__line--severity-critical';
  }
  return 'mil-ai-terminal__line--done';
}

/** MIL-AI — YZ Merkezi ile aktif; tutorial + seviye tavsiyeleri */
export default function MilAiAdvisor() {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const city = useGameStore((s) => s.cities[activeCityId]);
  const researches = useGameStore((s) => s.researches);
  const expeditions = useGameStore((s) => s.expeditions);
  const milAiCompleted = useGameStore((s) => s.milAiCompleted);
  const milAiCelebration = useGameStore((s) => s.milAiCelebration);
  const milAiScoutLaunched = useGameStore((s) => s.milAiScoutLaunched);
  const milAiRemote = useMilAiLiveContext();

  const guideState = useMemo(
    () => ({
      activeCityId,
      cities: { [activeCityId]: city },
      researches,
      expeditions,
      milAiCompleted,
      milAiCelebration,
      milAiScoutLaunched,
      now: Date.now(),
    }),
    [activeCityId, city, researches, expeditions, milAiCompleted, milAiCelebration, milAiScoutLaunched],
  );

  const online = useMemo(() => isMilAiAdvisorOnline(guideState), [guideState]);
  const progress = useMemo(() => getMilAiTutorialProgress(guideState), [guideState]);
  const tutorialActive = useMemo(() => isMilAiTutorialActive(guideState), [guideState]);

  const completedStatusLabel = useMemo(
    () => resolveMilAiCompletedStatusLabel(guideState, t),
    [guideState, t],
  );

  const lines = useMemo(
    () => buildMilAiTerminalLines(guideState, t, lang, milAiRemote),
    [guideState, t, lang, milAiRemote],
  );

  const toggle = () => setExpanded((v) => !v);

  return (
    <aside
      className={[
        'mil-ai-advisor',
        'mil-ai-terminal',
        'mil-ai-terminal--guide',
        'glass-panel',
        !online && 'mil-ai-advisor--standby',
        progress.tutorialComplete && 'mil-ai-advisor--done',
        expanded ? 'mil-ai-advisor--expanded' : 'mil-ai-advisor--collapsed',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="mil-ai-advisor__head mil-ai-advisor__head--toggle"
        onClick={toggle}
        aria-expanded={expanded}
        aria-controls="mil-ai-terminal-panel"
      >
        <span className="mil-ai-advisor__badge">{t('components.milAi.badge')}</span>
        <span className="mil-ai-advisor__pulse" aria-hidden="true" />
        {expanded ? (
          <span className="mil-ai-terminal__status font-hud-data" aria-live="polite">
            {!online ? (
              <span className="mil-ai-terminal__status-label">{t('milAi.standby.short')}</span>
            ) : (progress.tutorialComplete || milAiCelebration) && completedStatusLabel ? (
              completedStatusLabel
            ) : progress.tutorialComplete ? (
              t('components.milAi.statusComplete')
            ) : (
              <>
                <span className="mil-ai-terminal__status-dot" aria-hidden="true" />
                <span className="mil-ai-terminal__status-label">{t('components.milAi.statusActive')}</span>
                <span className="mil-ai-terminal__status-hint">
                  {t('components.milAi.stepHint', {
                    current: progress.stepIndex + 1,
                    total: progress.totalSteps,
                  })}
                </span>
              </>
            )}
          </span>
        ) : (
          <span className="mil-ai-advisor__collapsed-label">
            {!online ? t('milAi.standby.short') : t('components.milAi.expandHint')}
          </span>
        )}
        <span className="mil-ai-advisor__chevron" aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {expanded ? (
        <div id="mil-ai-terminal-panel" className="mil-ai-advisor__panel">
          <div className="mil-ai-terminal__screen">
            <div className="mil-ai-terminal__body">
              {lines.map((line) => (
                <p key={line} className={['mil-ai-terminal__line', lineClassName(line)].join(' ')}>
                  {line}
                </p>
              ))}
            </div>
          </div>
          {tutorialActive && online && progress.currentQuest && (
            <p className="mil-ai-advisor__quest-meta font-hud-data">
              {progress.currentQuest.code}
              {' · '}
              {t('milAi.tutorial.stepOf', {
                current: progress.stepIndex + 1,
                total: progress.totalSteps,
              })}
            </p>
          )}
        </div>
      ) : null}
    </aside>
  );
}
