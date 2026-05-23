import { create } from 'zustand';

const MAX_LINES = 100;

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Alt terminal — sayfa değişimlerinde kalıcı sistem günlüğü */
export const useTerminalLogStore = create((set, get) => ({
  lines: [
    {
      id: 'boot',
      at: Date.now(),
      tag: 'SİSTEM',
      text: '> C4ISR terminal bağlantısı kuruldu',
    },
  ],

  append: (text, tag = 'SİSTEM') => {
    const line = {
      id: makeId(),
      at: Date.now(),
      tag,
      text: text.startsWith('>') ? text : `> ${text}`,
    };
    set((s) => ({ lines: [...s.lines, line].slice(-MAX_LINES) }));
    return line.id;
  },

  appendRoute: (pathname) => {
    get().append(`ROUTE_SYNC ${pathname}`, 'NAV');
  },
}));
