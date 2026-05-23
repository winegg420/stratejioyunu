const TR_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/**
 * State Mail ve resmi yazışma tarihleri — "2044-05-18 …" → "18 Mayıs 2044"
 */
export function formatStateMailDate(timeStr, lang = 'tr') {
  if (!timeStr) return '';
  const isoMatch = String(timeStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!isoMatch) return timeStr;

  const year = Number(isoMatch[1]);
  const month = Number(isoMatch[2]);
  const day = Number(isoMatch[3]);
  if (!year || month < 1 || month > 12 || !day) return timeStr;

  if (lang === 'en') {
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return `${day} ${TR_MONTHS[month - 1]} ${year}`;
}
