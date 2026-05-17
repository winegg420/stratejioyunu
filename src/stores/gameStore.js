import { create } from 'zustand';
import { createInitialGameState } from '../data/gameInit';
import {
  BUILDING_RESOURCE_MAP,
  formatRate,
  formatSeconds,
  genId,
  nowReportDate,
  ratePerSecond,
  recalculateResourceRates,
} from '../lib/gameUtils';
import { useNotificationStore } from './notificationStore';

function getActiveCity(state) {
  return state.cities[state.activeCityId];
}

function patchActiveCity(set, get, patch) {
  const { activeCityId, cities } = get();
  set({
    cities: {
      ...cities,
      [activeCityId]: { ...cities[activeCityId], ...patch },
    },
  });
}

function formatTroopsSummary(troopQty, idleTroops) {
  return idleTroops
    .filter((t) => troopQty[t.id] > 0)
    .map((t) => `${troopQty[t.id]} ${t.name}`)
    .join(', ') || '—';
}

function generateBattleReport(expedition, won = true) {
  const target = expedition.target;
  return {
    id: genId('r'),
    filterType: 'battle',
    type: 'Savaş',
    title: `${target} — Saldırı Raporu`,
    date: nowReportDate(),
    preview: won ? 'Zafer! Ganimet toplandı.' : 'Yenilgi. Birlikler geri çekildi.',
    winner: won ? 'player' : 'enemy',
    attacker: 'Komutan_Alpha',
    defender: target,
    attackerLosses: won ? '8 Piyade' : '120 Piyade, 4 Tank',
    defenderLosses: won ? 'Garnizon imha' : '22 Piyade',
    loot: won
      ? [
          { icon: '🌾', label: 'Yemek', amount: 1200 + Math.floor(Math.random() * 800) },
          { icon: '⚙️', label: 'Metal', amount: 900 + Math.floor(Math.random() * 500) },
          { icon: '💰', label: 'Para', amount: 400 + Math.floor(Math.random() * 300) },
        ]
      : [],
    isNew: true,
  };
}

function generateSpyReport(expedition, success = true) {
  return {
    id: genId('r'),
    filterType: 'spy',
    type: 'Casusluk',
    title: `${expedition.target} — Keşif Raporu`,
    date: nowReportDate(),
    preview: success ? 'Hedef şehir bilgileri alındı.' : 'Casuslar yakalandı.',
    winner: null,
    intelSuccess: success,
    findings: success ? 'Depo ve birlik dağılımı kaydedildi' : 'Tüm casuslar kayıp',
    isNew: true,
  };
}

export const useGameStore = create((set, get) => ({
  ...createInitialGameState(),

  getActiveCity: () => getActiveCity(get()),

  setActiveCity: (cityId) => {
    if (!get().cities[cityId]) return;
    set({ activeCityId: cityId });
  },

  clearNavBadge: (key) => {
    set((s) => ({
      navBadges: { ...s.navBadges, [key]: false },
    }));
  },

  tick: () => {
    const state = get();
    const city = getActiveCity(state);
    if (!city) return;

    const flashes = {};
    const resources = city.resources.map((r) => {
      const increment = ratePerSecond(r.rate);
      let next = r.current + increment;
      if (r.max != null) next = Math.min(r.max, next);
      const rounded = Math.floor(next);
      if (rounded > Math.floor(r.current)) flashes[r.id] = true;
      return { ...r, current: rounded };
    });

    let constructionQueue = city.constructionQueue.map((q) => ({ ...q }));
    let productionQueue = city.productionQueue.map((q) => ({ ...q }));
    let buildings = city.buildings.map((b) => ({ ...b }));
    let idleTroops = city.idleTroops.map((t) => ({ ...t }));
    let expeditions = state.expeditions.map((e) => ({ ...e }));
    let reports = [...state.reports];
    let pastExpeditions = [...state.pastExpeditions];
    let navBadges = { ...state.navBadges };
    let completedConstruction = false;
    let completedProduction = false;
    const completedExpeditionIds = [];

    const activeBuild = constructionQueue.find((q) => !q.queued);
    if (activeBuild && activeBuild.remainingSeconds > 0) {
      activeBuild.remainingSeconds -= 1;
      if (activeBuild.remainingSeconds <= 0) completedConstruction = true;
    }

    const activeProd = productionQueue.find((q) => !q.queued);
    if (activeProd && activeProd.remainingSeconds > 0) {
      activeProd.remainingSeconds -= 1;
      if (activeProd.remainingSeconds <= 0) completedProduction = true;
    }

    expeditions = expeditions.map((e) => {
      if (e.remainingSeconds <= 0) return e;
      const next = e.remainingSeconds - 1;
      if (next <= 0) completedExpeditionIds.push(e.id);
      return { ...e, remainingSeconds: Math.max(0, next) };
    });

    patchActiveCity(set, get, {
      resources,
      constructionQueue,
      productionQueue,
      buildings,
      idleTroops,
    });
    set({ flashes, expeditions, reports, pastExpeditions, navBadges });

    if (Object.keys(flashes).length > 0) {
      setTimeout(() => {
        if (Object.keys(get().flashes).length > 0) set({ flashes: {} });
      }, 650);
    }

    if (completedConstruction) get()._completeConstruction();
    if (completedProduction) get()._completeProduction();
    completedExpeditionIds.forEach((id) => get()._completeExpedition(id));
  },

  _completeConstruction: () => {
    const state = get();
    const city = getActiveCity(state);
    const queue = [...city.constructionQueue];
    const activeIdx = queue.findIndex((q) => !q.queued);
    if (activeIdx === -1) return;

    const item = queue[activeIdx];
    let buildings = city.buildings.map((b) => {
      if (b.id !== item.buildingId && b.name !== item.name) return b;
      const nextLevel = item.targetLevel ?? b.level + 1;
      return { ...b, level: nextLevel, upgrading: false, time: '—' };
    });

    const resId = BUILDING_RESOURCE_MAP[item.buildingId];
    let resources = recalculateResourceRates(buildings, city.resources);

    queue.splice(activeIdx, 1);
    if (queue[0]) queue[0] = { ...queue[0], queued: false };

    patchActiveCity(set, get, { buildings, resources, constructionQueue: queue });

    const bName = item.name;
    const newRate = resId
      ? resources.find((r) => r.id === resId)?.rate
      : null;
    useNotificationStore.getState().addToast(
      `İnşaat Tamamlandı: ${bName}${newRate ? ` · Üretim ${newRate}` : ''}`,
      'success',
    );
  },

  _completeProduction: () => {
    const state = get();
    const city = getActiveCity(state);
    const queue = [...city.productionQueue];
    const activeIdx = queue.findIndex((q) => !q.queued);
    if (activeIdx === -1) return;

    const item = queue[activeIdx];
    let idleTroops = city.idleTroops.map((t) => {
      if (t.id !== item.unitId && t.name !== item.unit) return t;
      return { ...t, available: t.available + item.count };
    });

    queue.splice(activeIdx, 1);
    if (queue[0]) queue[0] = { ...queue[0], queued: false };

    patchActiveCity(set, get, { idleTroops, productionQueue: queue });
    useNotificationStore.getState().addToast(
      `Üretim Tamamlandı: ${item.count} ${item.unit}`,
      'success',
    );
  },

  _completeExpedition: (expeditionId) => {
    const state = get();
    const exp = state.expeditions.find((e) => e.id === expeditionId);
    if (!exp) return;

    const isSpy = exp.type.toLowerCase().includes('casus');
    const report = isSpy
      ? generateSpyReport(exp, Math.random() > 0.25)
      : generateBattleReport(exp, Math.random() > 0.35);

    const expeditions = state.expeditions.filter((e) => e.id !== expeditionId);
    const pastExpeditions = [
      {
        id: genId('past'),
        target: exp.target,
        result: report.winner === 'player' ? 'Zafer' : report.winner === 'enemy' ? 'Yenilgi' : 'Tamamlandı',
        loot: report.loot?.length
          ? report.loot.map((l) => `${l.amount} ${l.label}`).join(', ')
          : '—',
        date: report.date,
      },
      ...state.pastExpeditions,
    ];

    set({
      expeditions,
      reports: [report, ...state.reports],
      pastExpeditions,
      navBadges: {
        expeditions: expeditions.some((e) => e.direction === 'outgoing'),
        reports: true,
      },
    });

    useNotificationStore.getState().addToast(
      isSpy ? 'Casusluk Raporu Geldi' : 'Savaş Raporu Geldi',
      isSpy ? 'intel' : 'success',
    );
  },

  startExpedition: ({ targetCity, troopQty, mode = 'attack' }) => {
    const state = get();
    const city = getActiveCity(state);
    const troops = formatTroopsSummary(troopQty, city.idleTroops);
    const isSpy = mode === 'spy';
    const spyCount = troopQty?.spies ?? 0;

    let idleTroops = city.idleTroops.map((t) => ({
      ...t,
      available: Math.max(0, t.available - (troopQty[t.id] || 0)),
    }));
    let idleSpies = city.idleSpies;
    if (isSpy) idleSpies = Math.max(0, idleSpies - spyCount);

    const duration = isSpy ? 35 : 75;
    const expedition = {
      id: genId('exp'),
      target: targetCity.name,
      targetLat: targetCity.lat,
      targetLng: targetCity.lng,
      type: isSpy ? 'Casus Keşfi' : 'Saldırı',
      direction: 'outgoing',
      remainingSeconds: duration,
      _initialSeconds: duration,
      troops: isSpy ? `${spyCount} Casus` : troops,
      cancellable: true,
      player: 'Komutan_Alpha',
      units: isSpy ? spyCount : Object.values(troopQty || {}).reduce((a, b) => a + b, 0),
      distance: '—',
    };

    patchActiveCity(set, get, { idleTroops, idleSpies });
    set((s) => ({
      expeditions: [...s.expeditions, expedition],
      navBadges: { ...s.navBadges, expeditions: true },
    }));

    useNotificationStore.getState().addToast(
      `${targetCity.name} hedefine sefer yola çıktı`,
      'info',
    );

    return expedition.id;
  },

  speedUpConstruction: (queueId) => {
    const city = getActiveCity(get());
    const item = city.constructionQueue.find((q) => q.id === queueId);
    if (!item || item.queued) return;
    patchActiveCity(set, get, {
      constructionQueue: city.constructionQueue.map((q) =>
        q.id === queueId ? { ...q, remainingSeconds: 0 } : q,
      ),
    });
    get()._completeConstruction();
  },

  speedUpProduction: (queueId) => {
    const city = getActiveCity(get());
    const item = city.productionQueue.find((q) => q.id === queueId);
    if (!item || item.queued) return;
    patchActiveCity(set, get, {
      productionQueue: city.productionQueue.map((q) =>
        q.id === queueId ? { ...q, remainingSeconds: 0 } : q,
      ),
    });
    get()._completeProduction();
  },

  cancelConstruction: (queueId) => {
    const city = getActiveCity(get());
    patchActiveCity(set, get, {
      constructionQueue: city.constructionQueue.filter((q) => q.id !== queueId),
    });
  },

  cancelProduction: (queueId) => {
    const city = getActiveCity(get());
    patchActiveCity(set, get, {
      productionQueue: city.productionQueue.filter((q) => q.id !== queueId),
    });
  },

  startTicker: () => {
    const id = setInterval(() => get().tick(), 1000);
    return () => clearInterval(id);
  },
}));

export function useActiveCity() {
  return useGameStore((s) => s.cities[s.activeCityId]);
}

export function useActiveCityResources() {
  return useGameStore((s) => s.cities[s.activeCityId]?.resources ?? []);
}

export function useExpeditionSummary() {
  return useGameStore((s) => ({
    incoming: s.expeditions.filter((e) => e.direction === 'returning').length,
    outgoing: s.expeditions.filter((e) => e.direction === 'outgoing').length,
  }));
}

export function formatQueueRemaining(seconds) {
  return formatSeconds(seconds);
}
