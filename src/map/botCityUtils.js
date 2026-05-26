/**
 * Bot üsleri — haritada gerçek ülke/şehir adı; bot kimliği ayrı tutulur.
 */
import { resolveCountryDisplayName, resolveCountryIso2 } from '../data/worldCountriesCatalog';

const BOT_PRESETS = [
  {
    match: (c) => c.botId === 'Bot_USS_03' || c.name === 'Bot_USS_03' || c.owner === 'Bot_USS_03',
    name: 'Konya',
  },
  { match: (c) => c.owner?.startsWith?.('Bot_') || /^Bot_/i.test(c.name), name: null },
];

const FALLBACK_NAMES = [
  'Gaziantep', 'Adana', 'Samsun', 'Erzurum', 'Diyarbakır', 'Antalya', 'Bursa', 'Eskişehir',
];

function hashBotId(id = '') {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % FALLBACK_NAMES.length;
  return FALLBACK_NAMES[h] ?? 'Kayseri';
}

export function resolveBotDisplayName(city) {
  const preset = BOT_PRESETS.find((p) => p.match(city));
  if (preset?.name) return preset.name;

  const provinceName = String(city?.provinceName ?? '').trim();
  if (provinceName && !/^Bot_/i.test(provinceName)) {
    const fromProvince = resolveCountryDisplayName(provinceName, city?.province ?? '');
    if (fromProvince && !/^Bot_/i.test(fromProvince)) return fromProvince;
    return provinceName;
  }

  const displayName = String(city?.name ?? '').trim();
  if (displayName && !/^Bot_/i.test(displayName)) {
    return resolveCountryDisplayName(displayName, city?.province ?? '') || displayName;
  }

  const botId = city?.botId || city?.owner || '';
  if (botId) {
    const isoGuess = String(botId).replace(/^Bot_/i, '').replace(/_/g, '');
    const iso = resolveCountryIso2('', isoGuess);
    if (iso) {
      const fromBot = resolveCountryDisplayName('', iso);
      if (fromBot && !/^Bot_/i.test(fromBot)) return fromBot;
    }
  }

  return hashBotId(botId || displayName);
}

/** Harita ve store için bot şehir normalizasyonu */
export function normalizeMapCity(city) {
  if (!city || city.status !== 'bot') return city;
  const botId = city.botId || city.owner || (/^Bot_/i.test(city.name) ? city.name : null);
  const displayName = /^Bot_/i.test(city.name) ? resolveBotDisplayName(city) : city.name;
  return {
    ...city,
    name: displayName,
    botId: botId ?? undefined,
    owner: null,
    tier: 'town',
    type: city.type || 'Küçükşehir',
  };
}

export function normalizeMapCities(cities) {
  const list = Array.isArray(cities) ? cities : [];
  return list.map(normalizeMapCity);
}

export function isBotMapCity(city) {
  return city?.status === 'bot';
}
