import { create } from 'zustand';

const TOAST_MS = 4000;

export const useNotificationStore = create((set, get) => ({
  toasts: [],
  feedItems: [],
  unreadCount: 0,

  addToast: (message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry = { id, message, type, at: Date.now() };
    set((state) => ({
      toasts: [...state.toasts, entry],
      feedItems: [entry, ...state.feedItems].slice(0, 40),
      unreadCount: state.unreadCount + 1,
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, TOAST_MS);
  },

  clearUnread: () => set({ unreadCount: 0 }),

  startDemoEvents: () => {
    const demos = [
      { delay: 6000, message: 'İnşaat Tamamlandı: Fabrika Seviye 2', type: 'success' },
      { delay: 14000, message: 'Casusluk Raporu Geldi', type: 'intel' },
      { delay: 22000, message: 'Depo %90 dolu — Ambar yükseltmesi önerilir', type: 'warn' },
    ];

    const timers = demos.map(({ delay, message, type }) =>
      setTimeout(() => get().addToast(message, type), delay),
    );

    return () => timers.forEach(clearTimeout);
  },
}));
