/**
 * MIL-AI — haritadaki bot hedefi için atmosferik ülke/üs adı.
 */
import { translate } from '../i18n';
import { resolveBotDisplayName } from '../map/botCityUtils';
const MIL_AI_BOT_BUCKET_MS = 5 * 60 * 1000;

function isBotMapCity(city) {
  return city?.status === 'bot' || /^Bot_/i.test(city?.owner ?? '') || /^Bot_/i.test(city?.name ?? '');
}

function scoreBotTarget(city) {
  const name = String(city?.name ?? '');
  const province = String(city?.provinceName ?? '');
  let score = 0;
  if (province && !/^Bot_/i.test(province)) score += 4;
  if (name && !/^Bot_/i.test(name)) score += 3;
  if (city?.worldRole === 'mega_city' || city?.worldRole === 'bot_capital') score += 2;
  if (city?.population > 500_000) score += 1;
  return score;
}

/** Tavsiye metni için düşman ülke/üs etiketi */
export function pickMilAiBotTargetName(state, lang = 'tr') {
  const mapCities = state?.mapCities ?? [];
  const bots = mapCities.filter(isBotMapCity);
  if (!bots.length) {
    return translate(lang, 'milAi.advice.lv5.botWeakFallback');
  }

  const now = state?.now ?? Date.now();
  const bucket = Math.floor(now / MIL_AI_BOT_BUCKET_MS);
  const ranked = [...bots].sort((a, b) => scoreBotTarget(b) - scoreBotTarget(a));
  const target = ranked[bucket % ranked.length];
  const label = resolveBotDisplayName(target)
    || target.provinceName
    || target.name
    || translate(lang, 'milAi.advice.lv5.botWeakFallback');

  if (/^Bot_/i.test(label)) {
    return translate(lang, 'milAi.advice.lv5.botWeakFallback');
  }

  return label;
}

export function buildMilAiBotWeakAdvice(state, lang = 'tr') {
  const target = pickMilAiBotTargetName(state, lang);
  if (target === translate(lang, 'milAi.advice.lv5.botWeakFallback')) {
    return target;
  }
  return translate(lang, 'milAi.advice.lv5.botWeak', { target });
}
