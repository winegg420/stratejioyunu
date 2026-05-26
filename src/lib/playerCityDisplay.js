/**
 * Oyuncu üssü — Ana Merkez feed ve tip etiketleri (eski "şehir" terminolojisi → ülke/üs).
 */

const LEGACY_HQ_TYPES = /Ulusal Komuta|İç Anadolu Üssü|Ana Merkez|Komuta Merkezi/i;

/** Sol panel feed satırı — üs tipi */
export function resolveHomeFeedSectorType(activeCity, t) {
  const raw = String(activeCity?.type ?? '').trim();
  if (!raw || LEGACY_HQ_TYPES.test(raw)) {
    return t('pages.home.feed.globalHq');
  }
  return raw;
}
