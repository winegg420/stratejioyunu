/**
 * MIL-AI — komuta terminali (tutorial + YZ seviye tavsiyeleri).
 */
import { localizedBuildingLabel } from '../i18n';
import { getBuildingById } from './buildingUtils';
import {
  getMilAiTutorialProgress,
  getMilAiTutorialQuestTask,
  getMilAiTutorialQuestTitle,
  isMilAiAdvisorOnline,
  isMilAiTutorialActive,
  pickMilAiLevelAdvice,
  isQuestComplete,
} from './milAiTutorialQuests';

const MAX_WORDS = 12;

function clamp(text, maxWords = MAX_WORDS) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(' ');
}

export function milAiCommandLine(label, body) {
  return `[ ${label} ] ${clamp(body)}`;
}

function getActiveCity(state) {
  return state?.cities?.[state.activeCityId] ?? null;
}

function buildStandbyLine(t, lang) {
  return milAiCommandLine(
    lang === 'en' ? 'SYSTEM' : 'SİSTEM',
    t('milAi.standby.message'),
  );
}

function buildTutorialLines(state, t, lang) {
  const progress = getMilAiTutorialProgress(state);
  const quest = progress.currentQuest;
  const city = getActiveCity(state);
  const lines = [];

  if (progress.allComplete || !quest) {
    lines.push(milAiCommandLine('SİSTEM', t('milAi.tutorial.systemOnline')));
    const advice = pickMilAiLevelAdvice(state, lang);
    if (advice) {
      lines.push(milAiCommandLine(lang === 'en' ? 'ADVICE' : 'TAVSİYE', advice));
    }
    return lines;
  }

  const code = quest.code ?? `GÖREV-${String(progress.stepIndex + 1).padStart(2, '0')}`;
  lines.push(milAiCommandLine(code, getMilAiTutorialQuestTask(quest, t)));

  if (quest.buildingId) {
    const lv = getBuildingById(city, quest.buildingId)?.level ?? 0;
    const name = localizedBuildingLabel(lang, quest.buildingId, quest.buildingId);
    const target = quest.id === 'quest_04_plant_second' ? 2 : 1;
    const status = lv >= target
      ? (lang === 'en' ? 'ready' : 'hazır')
      : `${name} Sv.${lv}/${target}`;
    lines.push(milAiCommandLine(lang === 'en' ? 'STATUS' : 'DURUM', status));
  } else if (quest.id === 'quest_08_infantry_100') {
    const inf = city?.idleTroops?.find((u) => u.id === 'infantry')?.available ?? 0;
    lines.push(milAiCommandLine('DURUM', `${inf}/100 ${lang === 'en' ? 'infantry' : 'piyade'}`));
  } else if (quest.id === 'quest_11_scout') {
    const sent = state.milAiScoutLaunched || (state.expeditions ?? []).some((e) => e.mode === 'spy');
    lines.push(milAiCommandLine('DURUM', sent
      ? (lang === 'en' ? 'scout en route' : 'keşif yolda')
      : (lang === 'en' ? 'map target required' : 'harita hedefi gerekli')));
  }

  if (quest.warnKey) {
    lines.push(milAiCommandLine(lang === 'en' ? 'WARNING' : 'UYARI', t(quest.warnKey)));
  }
  if (quest.briefKey) {
    lines.push(milAiCommandLine('BRİF', t(quest.briefKey)));
  }

  lines.push(milAiCommandLine(
    lang === 'en' ? 'ORDER' : 'EMİR',
    t('milAi.tutorial.orderBuild', {
      target: quest.buildingId
        ? localizedBuildingLabel(lang, quest.buildingId, quest.buildingId)
        : getMilAiTutorialQuestTitle(quest, t),
    }),
  ));

  return lines;
}

/**
 * @returns {string[]}
 */
export function buildMilAiTerminalLines(state, t, lang = 'tr') {
  if (!isMilAiAdvisorOnline(state)) {
    return [buildStandbyLine(t, lang)];
  }

  const celebration = state.milAiCelebration;
  if (celebration?.messageKey) {
    return [
      milAiCommandLine(
        lang === 'en' ? 'COMPLETE' : 'GÖREV TAMAMLANDI',
        t(celebration.messageKey),
      ),
      ...buildTutorialLines(state, t, lang).slice(0, 2),
    ];
  }

  if (isMilAiTutorialActive(state)) {
    return buildTutorialLines(state, t, lang);
  }

  const advice = pickMilAiLevelAdvice(state, lang);
  return [
    milAiCommandLine('SİSTEM', t('milAi.tutorial.systemOnline')),
    milAiCommandLine(lang === 'en' ? 'ADVICE' : 'TAVSİYE', advice ?? t('milAi.advice.stable')),
  ];
}

/** @deprecated */
export function buildMilAiDynamicAdviceLines(state, t, lang = 'tr') {
  return buildMilAiTerminalLines(state, t, lang).filter((line) => (
    line.includes('TAVSİYE') || line.includes('ADVICE') || line.includes('İSTİHBARAT')
  ));
}

export { isQuestComplete };
