/** PWA kayıt — güncelleme kontrolü; otomatik yenileme yok (kararlılık). */
export function registerAppUpdates() {
  if (!import.meta.env.PROD) return undefined;
  return undefined;
}
