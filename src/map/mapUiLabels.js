/** Harita HUD — i18n anahtarı eksikse güvenli yedek metin */
export function resolveIdeologyToggleLabel(t) {
  const label = t('map.ideology.toggle');
  if (label && label !== 'map.ideology.toggle' && !label.startsWith('MAP.')) return label;
  const alt = t('map.ideology.politicalView');
  if (alt && alt !== 'map.ideology.politicalView' && !alt.startsWith('MAP.')) return alt;
  return '[ İDEOLOJİ HARİTASI ]';
}
