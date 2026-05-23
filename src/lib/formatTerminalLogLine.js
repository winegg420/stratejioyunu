const LOG_TYPE_MAP = {
  SİSTEM: 'SYS_LOG',
  SISTEM: 'SYS_LOG',
  NAV: 'NAV_LOG',
  ACİL: 'ALERT_LOG',
  ACIL: 'ALERT_LOG',
  UYARI: 'WARN_LOG',
  HATA: 'ERR_LOG',
  SAVAŞ: 'COMBAT_LOG',
  TİCARET: 'TRADE_LOG',
  İSTİHBARAT: 'INTEL_LOG',
};

/** Sistem saati — HH:MM:SS (24s) */
export function formatTerminalLogTime(at = Date.now()) {
  const d = new Date(at);
  return d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/** Etiket → [SYS_LOG] benzeri tip kodu */
export function normalizeTerminalLogType(tag = 'SİSTEM') {
  const raw = String(tag || 'SİSTEM').trim().toUpperCase();
  if (/_LOG$/.test(raw) || raw.includes('_LOG')) return raw;
  if (LOG_TYPE_MAP[raw]) return LOG_TYPE_MAP[raw];
  const slug = raw.replace(/[^\wÇĞİÖŞÜçğıöşü]/gi, '_').replace(/_+/g, '_');
  return `${slug || 'SYS'}_LOG`;
}

/**
 * Terminal satırı: [14:24:37] [SYS_LOG]: İşlem başarılı
 */
export function formatTerminalLogLine({ at, tag, text }) {
  const time = formatTerminalLogTime(at);
  const type = normalizeTerminalLogType(tag);
  const body = String(text ?? '').replace(/^>\s*/, '').trim();
  return `[${time}] [${type}]: ${body}`;
}
