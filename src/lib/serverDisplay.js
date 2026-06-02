import { SERVER_NAME } from '../data/placeholder';
import { DEFAULT_SERVER_ID } from './adminOverrideEngine';

/** Aktif sunucu / sezon etiketi — sidebar ve brifing. */
export function formatActiveServerSeasonLabel(serverId) {
  const id = String(serverId ?? DEFAULT_SERVER_ID).trim().toLowerCase();
  if (!id || id === DEFAULT_SERVER_ID) return SERVER_NAME;
  if (id.startsWith('global-')) {
    const n = id.split('-')[1] ?? '1';
    return `Küresel-${n} Sezon`;
  }
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
}
