/** C4ISR ticker — kritik uyarı (kırmızı bant) sınıflandırması */

export function isKbrnAlarmItem(item) {
  const id = String(item?.id ?? '').toLowerCase();
  const text = String(item?.text ?? '').toLowerCase();
  return id.includes('kbrn') || id.includes('global-alarm') || id.includes('outbreak')
    || text.includes('kbrn') || text.includes('biyolojik') || text.includes('kimyasal');
}

export function isCriticalTickerItem(item) {
  if (!item) return false;
  if (isKbrnAlarmItem(item)) return true;

  const id = String(item.id ?? '').toLowerCase();
  const tag = String(item.tag ?? '').toLowerCase();
  const text = String(item.text ?? '').toLowerCase();

  if (id === 'incoming-atk' || id === 'crisis' || id === 'cbrn') return true;
  if (id.startsWith('exp-out-')) return true;

  if (tag.includes('tehlike') || tag.includes('danger') || tag.includes('alarm')) return true;

  if (/saldır|attack|incoming|düşman|enemy|kritik|critical/.test(text)) return true;
  if (/radar.*(çök|çökt|offline|kapalı|down|arıza)|early.?warning.*fail/i.test(text)) return true;

  return false;
}
