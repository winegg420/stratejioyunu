import { GAME_TAB_TITLE } from '../data/placeholder';

/** Tarayıcı sekmesi — oyun adı kesinleşene kadar sabit başlık */
export function applyDocumentTitle(pageSuffix) {
  if (typeof document === 'undefined') return;
  document.title = pageSuffix ? `${pageSuffix} · ${GAME_TAB_TITLE}` : GAME_TAB_TITLE;
}
