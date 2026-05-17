/** Karşı casusluk koruma yüzdesi (0–95) — istihbarat merkezi seviyesine göre. */
export function getCounterIntelProtectionPct(city) {
  const intel = city?.buildings?.find((b) => b.id === 'intel');
  const level = intel?.level ?? 0;
  if (level < 1) return 8;
  return Math.min(95, 12 + level * 6);
}
