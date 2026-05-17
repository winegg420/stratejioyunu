import { create } from 'zustand';
import { resources as initialResources } from '../data/placeholder';

function ratePerSecond(rate) {
  const match = rate?.match(/\+(\d+)/);
  if (!match) return 0;
  return Number(match[1]) / 3600;
}

function cloneResources() {
  return initialResources.map((r) => ({ ...r }));
}

export const useResourceStore = create((set, get) => ({
  resources: cloneResources(),
  flashes: {},

  tick: () => {
    set((state) => {
      const flashes = {};
      const resources = state.resources.map((r) => {
        const increment = ratePerSecond(r.rate);
        let next = r.current + increment;
        if (r.max != null) next = Math.min(r.max, next);
        const rounded = Math.floor(next);
        if (rounded > Math.floor(r.current)) flashes[r.id] = true;
        return { ...r, current: rounded };
      });
      return { resources, flashes };
    });

    setTimeout(() => {
      if (Object.keys(get().flashes).length > 0) set({ flashes: {} });
    }, 650);
  },

  startTicker: () => {
    const id = setInterval(() => get().tick(), 1000);
    return () => clearInterval(id);
  },
}));
