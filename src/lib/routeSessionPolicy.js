/**
 * Sayfa oturum politikası — hangi rotalar tam oyun verisi bekler.
 * Yeni global gate eklerken buraya bakın; salt okuma / admin sayfaları hafif tutulur.
 */
export const LIGHT_SESSION_ROUTES = new Set([
  '/admin-log',
]);

/** Tam şehir/kaynak hydrate zorunlu değil (yalnızca auth yeterli). */
export function isLightSessionRoute(pathname = '') {
  const path = String(pathname).split('?')[0].replace(/\/$/, '') || '/';
  return LIGHT_SESSION_ROUTES.has(path);
}

/** Route loader (FETCHING DATA) bu rotalarda oyun verisi beklemez. */
export function routeNeedsGameData(pathname = '') {
  const path = String(pathname).split('?')[0].replace(/\/$/, '') || '/';
  if (path === '/giris' || path === '/') return false;
  return !isLightSessionRoute(path);
}
