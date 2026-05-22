/** Harita sayfasından çıkınca tam ekran / scroll kilidi / sınıf sızıntısını temizle */

export const MAP_FS_ROOT_CLASS = 'map-fs-active';
export const MAP_PSEUDO_FS_CLASS = 'map-command-theater--pseudo-fs';

export function releaseMapSessionLocks() {
  document.documentElement.classList.remove(MAP_FS_ROOT_CLASS);
  document.body.classList.remove('map-scroll-locked');

  document.querySelectorAll(`.${MAP_PSEUDO_FS_CLASS}`).forEach((el) => {
    el.classList.remove(MAP_PSEUDO_FS_CLASS);
  });

  const fsEl = document.fullscreenElement ?? document.webkitFullscreenElement;
  if (fsEl) {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch {
      /* ignore */
    }
  }
}
