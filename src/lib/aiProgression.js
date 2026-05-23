/**
 * MIL-AI dinamik rehber — Madenler → Laboratuvar → Ekonomi araştırması.
 */
import { getBuildingById, RESEARCH_BUILDING_ID } from './buildingUtils';
import { localizedBuildingLabel } from '../i18n';

/** Üretim hatları (Sv.5 hedefi). */
export const MINE_BUILDING_IDS = ['refinery', 'plant'];

export const ECONOMY_RESEARCH_ID = 'r10';

export const AI_PROGRESSION_STEPS = [
  {
    id: 'mines_lv5',
    titleKey: 'milAi.steps.mines.title',
    hintKey: 'milAi.steps.mines.hint',
    requiredLevel: 5,
    check: (state) => minesMeetLevel(state, 5),
    progressHint: (state, lang) => formatMinesProgress(state.cities?.[state.activeCityId], 5, lang),
  },
  {
    id: 'lab_lv3',
    titleKey: 'milAi.steps.lab.title',
    hintKey: 'milAi.steps.lab.hint',
    requiredLevel: 3,
    buildingId: RESEARCH_BUILDING_ID,
    check: (state) => {
      const city = state.cities?.[state.activeCityId];
      return (getBuildingById(city, RESEARCH_BUILDING_ID)?.level ?? 0) >= 3;
    },
    progressHint: (state, lang) => {
      const city = state.cities?.[state.activeCityId];
      const lv = getBuildingById(city, RESEARCH_BUILDING_ID)?.level ?? 0;
      const label = localizedBuildingLabel(lang, RESEARCH_BUILDING_ID, 'R&D');
      return `${label} Sv.${lv}/3`;
    },
  },
  {
    id: 'economy_research',
    titleKey: 'milAi.steps.economy.title',
    hintKey: 'milAi.steps.economy.hint',
    requiredLevel: 1,
    researchId: ECONOMY_RESEARCH_ID,
    check: (state) => getResearchLevel(state, ECONOMY_RESEARCH_ID) >= 1,
    progressHint: (ctx, lang, t) => t('milAi.steps.economy.progress', {
      current: getResearchLevel(ctx, ECONOMY_RESEARCH_ID),
    }),
  },
];

function getResearchLevel(state, researchId) {
  return state.researches?.find((r) => r.id === researchId)?.level ?? 0;
}

function minesMeetLevel(state, target) {
  const city = state.cities?.[state.activeCityId];
  return MINE_BUILDING_IDS.every(
    (id) => (getBuildingById(city, id)?.level ?? 0) >= target,
  );
}

function formatMinesProgress(city, target, lang) {
  return MINE_BUILDING_IDS.map((id) => {
    const lv = getBuildingById(city, id)?.level ?? 0;
    const label = localizedBuildingLabel(lang, id, id);
    const ok = lv >= target ? '✓' : '○';
    return `${ok} ${label} Sv.${lv}/${target}`;
  }).join(' · ');
}

export function getMilAiStepTitle(step, t) {
  return step?.titleKey ? t(step.titleKey) : step?.title ?? '';
}

export function getMilAiStepHint(step, t) {
  return step?.hintKey ? t(step.hintKey) : step?.hint ?? '';
}

/**
 * Oyuncunun sıradaki MIL-AI hedefini ve tamamlanan son adımı döner.
 */
export function getMilAiNextStep(state) {
  let lastCompleted = null;
  let stepIndex = 0;

  for (const step of AI_PROGRESSION_STEPS) {
    if (!step.check(state)) {
      return {
        nextStep: step,
        lastCompleted,
        allComplete: false,
        stepIndex,
      };
    }
    lastCompleted = step;
    stepIndex += 1;
  }

  return {
    nextStep: null,
    lastCompleted,
    allComplete: true,
    stepIndex: AI_PROGRESSION_STEPS.length,
  };
}

/** @deprecated buildMilAiTerminalLines (milAiDynamicAdvice) kullanın */
export function buildMilAiGuideLines(guide, state, t, lang = 'tr') {
  void guide;
  void state;
  void t;
  void lang;
  return [];
}
