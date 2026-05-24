/**
 * MIL-AI tutorial — YZ Merkezi ile başlar, 12 görev sırayla açılır.
 * Metinler i18n: milAi.tutorial.* / milAi.advice.*
 */
import { translate } from '../i18n';
import { getAiCenterLevel, isAiCenterOperational } from './aiCenterEngine';
import {
  getBuildingById,
  getHqLevel,
  HQ_BUILDING_ID,
  arePrerequisitesMet,
  getBuildingPrerequisites,
  getUnmetPrerequisites,
} from './buildingUtils';
import { isDevTestMode } from './devTestMode';

export const MIL_AI_TUTORIAL_QUEST_IDS = [
  'quest_01_ai_center',
  'quest_02_plant',
  'quest_03_refinery',
  'quest_04_plant_second',
  'quest_05_barracks',
  'quest_06_research',
  'quest_07_intel',
  'quest_08_infantry_100',
  'quest_09_airport',
  'quest_10_cyber_ops',
  'quest_11_scout',
  'quest_12_complete',
];

const LEGACY_MIL_AI_IDS = new Set([
  'build_refinery',
  'tax_balance',
  'upgrade_hq',
  'build_plant',
]);

function getActiveCity(state) {
  return state?.cities?.[state.activeCityId] ?? null;
}

function buildingLevel(state, buildingId) {
  return getBuildingById(getActiveCity(state), buildingId)?.level ?? 0;
}

function countBuildingsAtLevel(state, buildingId, minLevel = 1) {
  const city = getActiveCity(state);
  if (!city?.buildings) return 0;
  return city.buildings.filter(
    (b) => b.id === buildingId && (b.level ?? 0) >= minLevel,
  ).length;
}

function infantryCount(state) {
  const troops = getActiveCity(state)?.idleTroops ?? [];
  const inf = troops.find((t) => t.id === 'infantry');
  return inf?.available ?? 0;
}

function hasScoutExpedition(state) {
  if (state.milAiScoutLaunched) return true;
  return (state.expeditions ?? []).some((e) => e.mode === 'spy');
}

/** Eski kayıtları yeni görev sistemine sıfırla */
export function normalizeMilAiCompleted(raw = []) {
  const list = Array.isArray(raw) ? raw : [];
  if (list.some((id) => id.startsWith('quest_'))) {
    return list.filter((id) => MIL_AI_TUTORIAL_QUEST_IDS.includes(id));
  }
  if (list.some((id) => LEGACY_MIL_AI_IDS.has(id))) {
    return [];
  }
  return list;
}

export const MIL_AI_TUTORIAL_QUESTS = [
  {
    id: 'quest_01_ai_center',
    code: 'GÖREV-01',
    buildingId: 'ai_center',
    relaxPrereqs: true,
    prerequisites: [{ id: HQ_BUILDING_ID, level: 1 }],
    titleKey: 'milAi.tutorial.quest01.title',
    taskKey: 'milAi.tutorial.quest01.task',
    celebrateKey: 'milAi.tutorial.quest01.celebrate',
    check: (state) => buildingLevel(state, 'ai_center') >= 1,
  },
  {
    id: 'quest_02_plant',
    code: 'GÖREV-02',
    buildingId: 'plant',
    relaxPrereqs: true,
    prerequisites: [{ id: HQ_BUILDING_ID, level: 1 }],
    titleKey: 'milAi.tutorial.quest02.title',
    taskKey: 'milAi.tutorial.quest02.task',
    warnKey: 'milAi.tutorial.quest02.warn',
    celebrateKey: 'milAi.tutorial.quest02.celebrate',
    check: (state) => buildingLevel(state, 'plant') >= 1,
  },
  {
    id: 'quest_03_refinery',
    code: 'GÖREV-03',
    buildingId: 'refinery',
    relaxPrereqs: true,
    prerequisites: [{ id: HQ_BUILDING_ID, level: 1 }],
    titleKey: 'milAi.tutorial.quest03.title',
    taskKey: 'milAi.tutorial.quest03.task',
    celebrateKey: 'milAi.tutorial.quest03.celebrate',
    check: (state) => buildingLevel(state, 'refinery') >= 1,
  },
  {
    id: 'quest_04_plant_second',
    code: 'GÖREV-04',
    buildingId: 'plant',
    relaxPrereqs: true,
    prerequisites: [{ id: 'plant', level: 1 }],
    titleKey: 'milAi.tutorial.quest04.title',
    taskKey: 'milAi.tutorial.quest04.task',
    briefKey: 'milAi.tutorial.quest04.brief',
    celebrateKey: 'milAi.tutorial.quest04.celebrate',
    check: (state) => buildingLevel(state, 'plant') >= 2,
  },
  {
    id: 'quest_05_barracks',
    code: 'GÖREV-05',
    buildingId: 'barracks',
    relaxPrereqs: true,
    prerequisites: [{ id: HQ_BUILDING_ID, level: 1 }],
    titleKey: 'milAi.tutorial.quest05.title',
    taskKey: 'milAi.tutorial.quest05.task',
    celebrateKey: 'milAi.tutorial.quest05.celebrate',
    check: (state) => buildingLevel(state, 'barracks') >= 1,
  },
  {
    id: 'quest_06_research',
    code: 'GÖREV-06',
    buildingId: 'research',
    relaxPrereqs: true,
    prerequisites: [{ id: HQ_BUILDING_ID, level: 1 }],
    titleKey: 'milAi.tutorial.quest06.title',
    taskKey: 'milAi.tutorial.quest06.task',
    celebrateKey: 'milAi.tutorial.quest06.celebrate',
    check: (state) => buildingLevel(state, 'research') >= 1,
  },
  {
    id: 'quest_07_intel',
    code: 'GÖREV-07',
    buildingId: 'intel',
    relaxPrereqs: true,
    prerequisites: [{ id: HQ_BUILDING_ID, level: 1 }],
    titleKey: 'milAi.tutorial.quest07.title',
    taskKey: 'milAi.tutorial.quest07.task',
    celebrateKey: 'milAi.tutorial.quest07.celebrate',
    check: (state) => buildingLevel(state, 'intel') >= 1,
  },
  {
    id: 'quest_08_infantry_100',
    code: 'GÖREV-08',
    unitId: 'infantry',
    minCount: 100,
    titleKey: 'milAi.tutorial.quest08.title',
    taskKey: 'milAi.tutorial.quest08.task',
    celebrateKey: 'milAi.tutorial.quest08.celebrate',
    check: (state) => infantryCount(state) >= 100,
  },
  {
    id: 'quest_09_airport',
    code: 'GÖREV-09',
    buildingId: 'airport',
    relaxPrereqs: true,
    prerequisites: [{ id: HQ_BUILDING_ID, level: 1 }],
    titleKey: 'milAi.tutorial.quest09.title',
    taskKey: 'milAi.tutorial.quest09.task',
    celebrateKey: 'milAi.tutorial.quest09.celebrate',
    check: (state) => buildingLevel(state, 'airport') >= 1,
  },
  {
    id: 'quest_10_cyber_ops',
    code: 'GÖREV-10',
    buildingId: 'cyber_ops',
    relaxPrereqs: true,
    prerequisites: [{ id: HQ_BUILDING_ID, level: 1 }],
    titleKey: 'milAi.tutorial.quest10.title',
    taskKey: 'milAi.tutorial.quest10.task',
    celebrateKey: 'milAi.tutorial.quest10.celebrate',
    check: (state) => buildingLevel(state, 'cyber_ops') >= 1,
  },
  {
    id: 'quest_11_scout',
    code: 'GÖREV-11',
    titleKey: 'milAi.tutorial.quest11.title',
    taskKey: 'milAi.tutorial.quest11.task',
    celebrateKey: 'milAi.tutorial.quest11.celebrate',
    check: (state) => hasScoutExpedition(state),
  },
  {
    id: 'quest_12_complete',
    code: 'SİSTEM',
    titleKey: 'milAi.tutorial.quest12.title',
    completeStatusKey: 'milAi.tutorial.quest12.title',
    taskKey: 'milAi.tutorial.quest12.task',
    celebrateKey: 'milAi.tutorial.quest12.celebrate',
    autoComplete: true,
    check: () => true,
  },
];

export function isMilAiAdvisorOnline(state) {
  return buildingLevel(state, 'ai_center') >= 1;
}

export function getMilAiTutorialProgress(state) {
  const done = new Set(normalizeMilAiCompleted(state.milAiCompleted ?? []));
  let stepIndex = 0;
  let lastCompleted = null;

  for (const quest of MIL_AI_TUTORIAL_QUESTS) {
    if (!done.has(quest.id)) {
      return {
        currentQuest: quest,
        lastCompleted,
        completedIds: done,
        stepIndex,
        totalSteps: MIL_AI_TUTORIAL_QUESTS.length,
        allComplete: false,
        tutorialComplete: false,
      };
    }
    lastCompleted = quest;
    stepIndex += 1;
  }

  return {
    currentQuest: null,
    lastCompleted,
    completedIds: done,
    stepIndex: MIL_AI_TUTORIAL_QUESTS.length,
    totalSteps: MIL_AI_TUTORIAL_QUESTS.length,
    allComplete: true,
    tutorialComplete: done.has('quest_12_complete'),
  };
}

export function isMilAiTutorialActive(state) {
  if (!isMilAiAdvisorOnline(state)) return true;
  return !getMilAiTutorialProgress(state).tutorialComplete;
}

/** Üst başlık: "GÖREV TAMAMLANDI: YZ Merkezi kuruldu" */
export function formatMilAiQuestCompletedStatus(quest, t) {
  if (!quest || typeof t !== 'function') return null;
  if (quest.completeStatusKey) {
    return t('components.milAi.questCompletedStatus', { detail: t(quest.completeStatusKey) });
  }
  const name = t(quest.titleKey);
  if (quest.buildingId) {
    return t('components.milAi.questCompletedStatus', {
      detail: t('components.milAi.questBuilt', { name }),
    });
  }
  return t('components.milAi.questCompletedStatus', {
    detail: t('components.milAi.questDone', { name }),
  });
}

export function resolveMilAiCompletedStatusLabel(state, t) {
  const celebration = state?.milAiCelebration;
  if (celebration?.questId) {
    const quest = MIL_AI_TUTORIAL_QUESTS.find((q) => q.id === celebration.questId);
    const label = formatMilAiQuestCompletedStatus(quest, t);
    if (label) return label;
  }
  const progress = getMilAiTutorialProgress(state);
  if (progress.lastCompleted) {
    const label = formatMilAiQuestCompletedStatus(progress.lastCompleted, t);
    if (label) return label;
  }
  return null;
}

export function isTutorialBuildingVisible(buildingId, state) {
  if (!isMilAiTutorialActive(state)) return true;
  const city = getActiveCity(state);
  const progress = getMilAiTutorialProgress(state);
  if (progress.allComplete) return true;

  if (buildingId === HQ_BUILDING_ID) return true;
  if ((getBuildingById(city, buildingId)?.level ?? 0) >= 1) return true;
  if (progress.currentQuest?.buildingId === buildingId) return true;
  return false;
}

export function getTutorialBuildingPrerequisites(buildingId, state) {
  const progress = getMilAiTutorialProgress(state);
  const quest = progress.currentQuest;
  if (quest?.buildingId === buildingId && quest.prerequisites) {
    return quest.prerequisites;
  }
  if (quest?.buildingId === buildingId && quest.relaxPrereqs) {
    return [{ id: HQ_BUILDING_ID, level: 1 }];
  }
  return getBuildingPrerequisites(buildingId);
}

export function areTutorialPrerequisitesMet(city, buildingId, state) {
  if (isDevTestMode()) return arePrerequisitesMet(city, buildingId);
  if (!isMilAiTutorialActive(state)) {
    return arePrerequisitesMet(city, buildingId);
  }
  const progress = getMilAiTutorialProgress(state);
  const built = (getBuildingById(city, buildingId)?.level ?? 0) >= 1;
  if (built) {
    return arePrerequisitesMet(city, buildingId);
  }
  if (progress.currentQuest?.buildingId !== buildingId) {
    return false;
  }
  return getUnmetTutorialPrerequisites(city, buildingId, state).length === 0;
}

export function getUnmetTutorialPrerequisites(city, buildingId, state) {
  if (!isMilAiTutorialActive(state)) {
    return getUnmetPrerequisites(city, buildingId);
  }
  const progress = getMilAiTutorialProgress(state);
  if ((getBuildingById(city, buildingId)?.level ?? 0) >= 1) {
    return getUnmetPrerequisites(city, buildingId);
  }
  if (progress.currentQuest?.buildingId !== buildingId) {
    return [{ id: '_tutorial', level: 1 }];
  }
  const reqs = getTutorialBuildingPrerequisites(buildingId, state);
  return reqs.filter((req) => {
    const b = city?.buildings?.find((x) => x.id === req.id);
    return !b || (b.level ?? 0) < req.level;
  });
}

export function isQuestComplete(state, quest) {
  if (!quest) return false;
  if (quest.id === 'quest_12_complete') {
    const progress = getMilAiTutorialProgress(state);
    const done = progress.completedIds;
    return MIL_AI_TUTORIAL_QUESTS.slice(0, -1).every((q) => done.has(q.id));
  }
  return quest.check(state);
}

export function getNextAutoTutorialQuest(state) {
  const progress = getMilAiTutorialProgress(state);
  if (!progress.currentQuest) return null;
  if (!isQuestComplete(state, progress.currentQuest)) return null;
  return progress.currentQuest;
}

export function getMilAiAiLevel(state) {
  return getAiCenterLevel(getActiveCity(state));
}

/** YZ seviyesine göre periyodik tavsiye (tutorial sonrası) */
export function pickMilAiLevelAdvice(state, lang = 'tr') {
  const city = getActiveCity(state);
  const level = getMilAiAiLevel(state);
  if (level < 1 || !isAiCenterOperational(city)) return null;

  const resources = city?.resources ?? [];
  const fuel = resources.find((r) => r.id === 'fuel');
  const energy = resources.find((r) => r.id === 'energy');
  const candidates = [];

  if (level >= 3 && fuel?.max && fuel.current >= fuel.max * 0.88) {
    candidates.push(translate(lang, 'milAi.advice.lv3.fuelDepot'));
  }
  if (level >= 5) {
    candidates.push(translate(lang, 'milAi.advice.lv5.botWeak'));
  }
  if (level >= 8) {
    candidates.push(translate(lang, 'milAi.advice.lv8.tension'));
  }
  if (level >= 10) {
    candidates.push(translate(lang, 'milAi.advice.lv10.earlyWarning'));
  }
  if (level >= 15) {
    candidates.push(translate(lang, 'milAi.advice.lv15.combatAssist'));
  }
  if (level >= 1 && (energy?.current ?? 0) < 50) {
    candidates.push(translate(lang, 'milAi.advice.energyLow'));
  }
  if (!candidates.length) {
    candidates.push(translate(lang, 'milAi.advice.stable'));
  }

  const tick = Math.floor((state.now ?? Date.now()) / (5 * 60 * 1000));
  return candidates[tick % candidates.length];
}

export function getMilAiTutorialQuestTitle(quest, t) {
  return quest?.titleKey ? t(quest.titleKey) : '';
}

export function getMilAiTutorialQuestTask(quest, t) {
  return quest?.taskKey ? t(quest.taskKey) : '';
}
