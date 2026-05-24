/** Harita sürükleme sonrası yanlışlıkla şehir/il seçimini engelle */
export function isMapClickSuppressed(map) {
  return Boolean(map?._suppressMapClickUntil && Date.now() < map._suppressMapClickUntil);
}
