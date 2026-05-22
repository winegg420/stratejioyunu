/**
 * MIL-AI — oyuncu durumuna göre dinamik askeri tavsiyeler (typewriter terminal).
 */
import { BUILDING_LABELS, getBuildingById } from './buildingUtils';
import { getMilAiNextStep, buildMilAiGuideLines } from './aiProgression';

const HAPPINESS_LOW = 45;
const HAPPINESS_CRITICAL = 30;

function getActiveCity(state) {
  return state?.cities?.[state.activeCityId] ?? null;
}

function hasOutgoingExpedition(state) {
  return (state.expeditions ?? []).some(
    (e) => e.direction === 'outgoing' && (e.endsAt == null || e.endsAt > Date.now()),
  );
}

function pickConstructionAdvice(city) {
  const queue = city?.constructionQueue ?? [];
  const active = queue.find((q) => !q.queued);
  if (active) return null;

  if (queue.length === 0) {
    const refinery = getBuildingById(city, 'refinery');
    const plant = getBuildingById(city, 'plant');
    if ((refinery?.level ?? 0) < 3) {
      return 'Başkan, inşaat kuyruğu boş. Hammadde üretiminizi artırmak için Yakıt Rafinerisi yükseltmesini öneririm.';
    }
    if ((plant?.level ?? 0) < 2) {
      return 'Başkan, inşaat hattı atıl. Enerji Santrali yükseltmesi tüm üs verimini çarpanlar.';
    }
    const hq = getBuildingById(city, 'hq');
    if ((hq?.level ?? 0) < 4) {
      return 'Başkan, kuyruk boş. Komuta Merkezi yükseltmesi yeni bina ve koridor kapılarını açar.';
    }
    return 'Başkan, inşaat kuyruğu boş. Üretim binalarını yükseltmek veya askeri tesis açmak için Binalar sekmesini kullanın.';
  }

  return 'Başkan, sıradaki inşaat emri kuyrukta — aktif yükseltmeyi başlatın.';
}

function pickMoraleAdvice(city) {
  const happiness = city?.happiness ?? 72;
  if (happiness <= HAPPINESS_CRITICAL) {
    return 'Başkan, moral kritik seviyede. Vergi oranını düşürün, Yakıt Rafinerisi ve lojistik hatlarını güçlendirin.';
  }
  if (happiness <= HAPPINESS_LOW) {
    return 'Başkan, garnizon morali düşük. Vergiyi dengeleyin ve üretim hatlarını canlı tutun.';
  }
  return null;
}

function pickExpeditionAdvice(state) {
  if (hasOutgoingExpedition(state)) return null;
  const idle = (state.expeditions ?? []).length === 0;
  if (idle) {
    return 'Başkan, aktif sefer yok. Haritadan düşman üssü seçerek keşif veya saldırı konvoyu gönderin.';
  }
  return 'Başkan, sahadaki birlikleriniz beklemede. Yeni operasyon için Seferler veya Harita hattını kullanın.';
}

function pickResourceAdvice(city) {
  const resources = city?.resources ?? [];
  const hammadde = resources.find((r) => r.id === 'hammadde');
  const fuel = resources.find((r) => r.id === 'fuel');
  if (hammadde && hammadde.max != null && hammadde.current / hammadde.max > 0.92) {
    return 'Başkan, hammadde deposu dolmak üzere. Ticaret Terminali veya sefer ganimeti ile dengeleyin.';
  }
  if (fuel && fuel.current < 200) {
    return 'Başkan, petrol rezervi zayıf. Yakıt Rafinerisi üretimini artırın veya Pazar üzerinden ikmal alın.';
  }
  return null;
}

function pickProductionAdvice(city) {
  const pq = city?.productionQueue ?? [];
  const barracks = getBuildingById(city, 'barracks');
  if ((barracks?.level ?? 0) >= 1 && pq.length === 0) {
    return 'Başkan, Kışla üretim hattı boş. Kara birliği emri vererek garnizonu güçlendirin.';
  }
  return null;
}

/**
 * @returns {string[]}
 */
export function buildMilAiDynamicAdviceLines(state) {
  const city = getActiveCity(state);
  if (!city) return ['> MIL-AI // Şehir verisi bekleniyor...'];

  const tips = [
    pickMoraleAdvice(city),
    pickConstructionAdvice(city),
    pickExpeditionAdvice(state),
    pickResourceAdvice(city),
    pickProductionAdvice(city),
  ].filter(Boolean);

  if (!tips.length) {
    return ['> Başkan, operasyonel göstergeler stabil. Rehber hedeflerine odaklanın.'];
  }

  return tips.map((t) => `> ${t}`);
}

/** Rehber + dinamik tavsiye satırları (typewriter için) */
export function buildMilAiTerminalLines(state) {
  const guide = getMilAiNextStep(state);
  const guideLines = buildMilAiGuideLines(guide, state);
  const dynamic = buildMilAiDynamicAdviceLines(state);

  return [
    ...guideLines,
    '> —— OPERASYONEL TAVSİYE ——',
    ...dynamic,
  ];
}
