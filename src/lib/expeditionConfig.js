export const EXPEDITION_DURATIONS = {
  attack: 75,
  spy: 35,
  found: 90,
  trade: 55,
};

export function formatArrivalClock(durationSeconds, now = Date.now()) {
  const arrival = new Date(now + Math.max(0, durationSeconds) * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(arrival.getHours())}:${pad(arrival.getMinutes())}`;
}
