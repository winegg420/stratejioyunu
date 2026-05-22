/**
 * MIL-AI dinamik rehber — Madenler → Laboratuvar → Ekonomi araştırması.
 */
import { BUILDING_LABELS, getBuildingById, RESEARCH_BUILDING_ID } from './buildingUtils';

/** Üretim hatları (Sv.5 hedefi). */
export const MINE_BUILDING_IDS = ['refinery', 'plant'];

export const ECONOMY_RESEARCH_ID = 'r10';

export const AI_PROGRESSION_STEPS = [
  {
    id: 'mines_lv5',
    title: 'Madenleri Sv.5\'e yükseltin',
    hint: 'Rafineri ve Enerji Santralini Sv.5\'e çıkarın (Binalar → Üretim sektörü).',
    requiredLevel: 5,
    check: (state) => minesMeetLevel(state, 5),
    progressHint: (state) => formatMinesProgress(state.cities?.[state.activeCityId], 5),
  },
  {
    id: 'lab_lv3',
    title: 'Laboratuvarı Sv.3 yapın',
    hint: 'Ar-Ge Merkezi (laboratuvar) Sv.3 — araştırma kapıları açılır.',
    requiredLevel: 3,
    buildingId: RESEARCH_BUILDING_ID,
    check: (state) => {
      const city = state.cities?.[state.activeCityId];
      return (getBuildingById(city, RESEARCH_BUILDING_ID)?.level ?? 0) >= 3;
    },
    progressHint: (state) => {
      const city = state.cities?.[state.activeCityId];
      const lv = getBuildingById(city, RESEARCH_BUILDING_ID)?.level ?? 0;
      return `${BUILDING_LABELS.research} Sv.${lv}/3`;
    },
  },
  {
    id: 'economy_research',
    title: 'Ekonomi araştırması',
    hint: 'Araştırma → Ağır Sanayi & Nükleer Enerji en az Sv.1 — üretim verimini artırın.',
    requiredLevel: 1,
    researchId: ECONOMY_RESEARCH_ID,
    check: (state) => getResearchLevel(state, ECONOMY_RESEARCH_ID) >= 1,
    progressHint: (ctx) => `Ağır Sanayi Sv.${getResearchLevel(ctx, ECONOMY_RESEARCH_ID)}/1`,
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

function formatMinesProgress(city, target) {
  return MINE_BUILDING_IDS.map((id) => {
    const lv = getBuildingById(city, id)?.level ?? 0;
    const label = BUILDING_LABELS[id] ?? id;
    const ok = lv >= target ? '✓' : '○';
    return `${ok} ${label} Sv.${lv}/${target}`;
  }).join(' · ');
}

/**
 * Oyuncunun sıradaki MIL-AI hedefini ve tamamlanan son adımı döner.
 * @returns {{
 *   nextStep: typeof AI_PROGRESSION_STEPS[number] | null,
 *   lastCompleted: typeof AI_PROGRESSION_STEPS[number] | null,
 *   allComplete: boolean,
 *   stepIndex: number,
 * }}
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

/** Terminal satırları — tamamlanan adım + sıradaki hedef. */
export function buildMilAiGuideLines(guide, state) {
  const city = state?.cities?.[state.activeCityId];

  if (guide.allComplete) {
    return [
      '> MIL-AI REHBER // TÜM HEDEFLER TAMAM',
      '> Maden · Laboratuvar · Ekonomi protokolü tamamlandı.',
      '> Stratejik kararlar sizde, Başkanım.',
    ];
  }

  const { nextStep, lastCompleted } = guide;
  if (!nextStep) {
    return ['> MIL-AI REHBER // SENKRON'];
  }

  const lines = ['> MIL-AI REHBER // BAĞLANTI AKTİF'];

  if (lastCompleted) {
    lines.push(`> GÖREV TAMAMLANDI: ${lastCompleted.title}`);
    lines.push(`> SIRADAKİ HEDEF: ${nextStep.title}`);
  } else {
    lines.push(`> HEDEF: ${nextStep.title}`);
  }

  lines.push(`> BRİF: ${nextStep.hint}`);

  const progress = nextStep.progressHint?.(state);
  if (progress) {
    lines.push(`> İLERLEME: ${progress}`);
  }

  return lines;
}
