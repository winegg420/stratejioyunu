/**
 * Bot üsleri — haritada gerçek şehir adı; bot kimliği ayrı tutulur.
 */
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
  const botId = city.owner || city.name || '';
  if (/^Bot_/i.test(city.name) && city.name !== botId) return city.name;
  return hashBotId(botId);
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

export function normalizeMapCities(cities = []) {
  return cities.map(normalizeMapCity);
}

export function isBotMapCity(city) {
  return city?.status === 'bot';
}
