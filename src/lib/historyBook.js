/**
 * Devlet Tarih Kitabı — sezon kroniklerinin otomatik derlenmesi.
 */
import { genId } from './gameUtils';
import { formatIdeologyLabel } from './ideologySystem';
import { SERVER_NAME } from '../data/placeholder';

export const CHRONICLE_TYPES = {
  WAR: 'war',
  REGIME: 'regime',
  BETRAYAL: 'betrayal',
};

export const SERVER_SLUG = 'turkiye-1';

/** Büyük savaş eşiği — toplam zayiat birimi */
export const WAR_CASUALTY_THRESHOLD = 55;

/** Pakt bozulduktan sonra ihanet penceresi */
export const BETRAYAL_WINDOW_MS = 72 * 60 * 60 * 1000;

const MS_MONTH = 30 * 24 * 60 * 60 * 1000;

function sumLossMap(losses = {}) {
  return Object.values(losses).reduce((a, b) => a + Math.max(0, Number(b) || 0), 0);
}

export function getCurrentSeasonId(now = Date.now()) {
  const d = new Date(now);
  return `${SERVER_SLUG}-${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function formatSeasonLabel(seasonId) {
  if (!seasonId) return SERVER_NAME;
  const m = seasonId.match(/(\d{4})-(\d{2})$/);
  if (!m) return seasonId;
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  const mi = Number(m[2]) - 1;
  return `${SERVER_NAME} · ${months[mi] ?? m[2]} ${m[1]}`;
}

export function formatChronicleDate(at = Date.now()) {
  const d = new Date(at);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

export function totalCombatCasualties(combat) {
  if (!combat) return 0;
  const atk = sumLossMap(combat.totalAttackerLosses);
  const def = sumLossMap(combat.totalDefenderLosses);
  return atk + def;
}

export function isMajorBattle(combat, { attackerWon = false } = {}) {
  const total = totalCombatCasualties(combat);
  if (total >= WAR_CASUALTY_THRESHOLD) return true;
  const defLoss = sumLossMap(combat?.totalDefenderLosses);
  return attackerWon && defLoss >= 35;
}

export function isMissileOrHeavyExpedition(expedition) {
  const type = `${expedition?.type ?? ''} ${expedition?.mode ?? ''}`.toLowerCase();
  return type.includes('füze') || type.includes('fuze') || type.includes('missile')
    || type.includes('kbrn') || type.includes('meydan');
}

export function formatWarChronicle({
  at,
  attacker,
  defender,
  targetCity,
  casualties,
  decisive = false,
  operationType = 'ordu',
}) {
  const date = formatChronicleDate(at);
  const verb = decisive
    ? `${defender} üssünü haritadan sildi`
    : `${defender} üssüne yıkıcı ${operationType} saldırısı düzenledi`;
  return `[ SAVAŞ KRONİĞİ ]: ${date} tarihinde, ${attacker} ${verb}. ${casualties.toLocaleString('tr-TR')} zayiat verildi!`;
}

export function formatRegimeChronicle({
  at,
  player,
  oldIdeology,
  newIdeology,
}) {
  const date = formatChronicleDate(at);
  const oldL = formatIdeologyLabel(oldIdeology);
  const newL = formatIdeologyLabel(newIdeology);
  return `[ REJİM KRONİĞİ ]: ${date} — President ${player}, ${oldL} doktrinini terk ederek ${newL} safına geçti.`;
}

export function formatBetrayalChronicle({
  at,
  allianceA,
  allianceB,
  attacker,
  defender,
}) {
  const date = formatChronicleDate(at);
  const a = allianceA || 'İttifak A';
  const b = allianceB || 'İttifak B';
  const actors = attacker && defender
    ? `${attacker} ve ${defender}`
    : `${a} ve ${b}`;
  return `[ İHANET KRONİĞİ ]: ${date} — ${actors} arasındaki pakt çöktü; eski dostlar namluları birbirine çevirdi.`;
}

export function createChronicleEntry({
  type,
  text,
  at = Date.now(),
  seasonId = getCurrentSeasonId(at),
  payload = {},
}) {
  return {
    id: genId('chr'),
    type,
    text,
    at,
    seasonId,
    payload,
  };
}

export function buildWarChronicleFromCombat({
  combat,
  expedition,
  attackerName,
  defenderName,
  decisive = false,
}) {
  const casualties = totalCombatCasualties(combat);
  const operationType = isMissileOrHeavyExpedition(expedition) ? 'füze' : 'ordu';
  const text = formatWarChronicle({
    at: Date.now(),
    attacker: attackerName,
    defender: defenderName ?? expedition?.target,
    targetCity: expedition?.target,
    casualties,
    decisive: decisive || (combat?.attackerWon && sumLossMap(combat?.totalDefenderLosses) >= 40),
    operationType,
  });
  return createChronicleEntry({
    type: CHRONICLE_TYPES.WAR,
    text,
    payload: {
      attacker: attackerName,
      defender: defenderName,
      targetCity: expedition?.target,
      casualties,
      attackerWon: combat?.attackerWon,
    },
  });
}

export function buildRegimeChronicle({ player, oldIdeology, newIdeology }) {
  const text = formatRegimeChronicle({
    at: Date.now(),
    player,
    oldIdeology,
    newIdeology,
  });
  return createChronicleEntry({
    type: CHRONICLE_TYPES.REGIME,
    text,
    payload: { player, oldIdeology, newIdeology },
  });
}

export function buildBetrayalChronicle({
  allianceA,
  allianceB,
  attacker,
  defender,
  partner,
}) {
  const text = formatBetrayalChronicle({
    at: Date.now(),
    allianceA,
    allianceB,
    attacker,
    defender,
  });
  return createChronicleEntry({
    type: CHRONICLE_TYPES.BETRAYAL,
    text,
    payload: { allianceA, allianceB, attacker, defender, partner },
  });
}

export function createDefaultChronicleState(now = Date.now()) {
  const seasonId = getCurrentSeasonId(now);
  return {
    currentSeasonId: seasonId,
    entries: [],
    archives: {},
    lastCompiledAt: 0,
  };
}

/** Ay değişiminde mevcut kayıtları arşive taşı */
export function syncSeasonChronicles(state, now = Date.now()) {
  const next = {
    ...createDefaultChronicleState(now),
    ...state,
    entries: [...(state?.entries ?? [])],
    archives: { ...(state?.archives ?? {}) },
  };
  const seasonId = getCurrentSeasonId(now);
  if (next.currentSeasonId && next.currentSeasonId !== seasonId && next.entries.length > 0) {
    next.archives[next.currentSeasonId] = [...next.entries].sort((a, b) => a.at - b.at);
    next.entries = [];
  }
  next.currentSeasonId = seasonId;
  return next;
}

export function appendChronicle(state, entry) {
  const synced = syncSeasonChronicles(state ?? createDefaultChronicleState(entry?.at));
  const exists = synced.entries.some(
    (e) => e.type === entry.type && e.text === entry.text && Math.abs(e.at - entry.at) < 60000,
  );
  if (exists) return synced;
  return {
    ...synced,
    entries: [...synced.entries, entry].sort((a, b) => b.at - a.at).slice(0, 120),
    lastCompiledAt: Date.now(),
  };
}

export function listSeasonIdsForArchive(state) {
  const ids = new Set(Object.keys(state?.archives ?? {}));
  if (state?.currentSeasonId) ids.add(state.currentSeasonId);
  return [...ids].sort().reverse();
}

export function getChroniclesForSeason(state, seasonId) {
  if (!state) return [];
  if (seasonId === state.currentSeasonId) {
    return [...(state.entries ?? [])].sort((a, b) => a.at - b.at);
  }
  return [...(state.archives?.[seasonId] ?? [])].sort((a, b) => a.at - b.at);
}

export function isSeasonEnded(seasonId, now = Date.now()) {
  return seasonId !== getCurrentSeasonId(now);
}

export function findRecentTreatyBreak(breaks, partner, now = Date.now()) {
  return (breaks ?? []).find(
    (b) => b.partner === partner
      && b.brokenAt
      && now - b.brokenAt < BETRAYAL_WINDOW_MS,
  );
}

export function normalizeDiplomaticTreaties(treaties) {
  if (!Array.isArray(treaties)) return [];
  return treaties.map((t) => ({
    id: t.id ?? genId('tr'),
    partner: t.partner,
    partnerAlliance: t.partnerAlliance ?? t.alliance ?? '—',
    type: t.type ?? 'NAP',
    status: t.status ?? 'active',
    brokenAt: t.brokenAt ?? null,
  }));
}

/** Demo kronikler — çevrimdışı / boş arşiv */
export function createDemoChronicleArchive() {
  const now = Date.now();
  const seasonId = getCurrentSeasonId(now);
  const prev = getCurrentSeasonId(now - MS_MONTH);
  return {
    currentSeasonId: seasonId,
    entries: [
      createChronicleEntry({
        type: CHRONICLE_TYPES.WAR,
        at: now - 5 * MS_MONTH / 30,
        seasonId,
        text: formatWarChronicle({
          at: now - 5 * MS_MONTH / 30,
          attacker: 'Komutan_Alpha',
          defender: 'KaraKurt',
          targetCity: 'İstanbul',
          casualties: 142,
          decisive: true,
        }),
      }),
      createChronicleEntry({
        type: CHRONICLE_TYPES.BETRAYAL,
        at: now - 2 * MS_MONTH / 30,
        seasonId,
        text: formatBetrayalChronicle({
          at: now - 2 * MS_MONTH / 30,
          allianceA: 'Ege Komutanlığı',
          allianceB: 'Boğaz İmparatorluğu',
        }),
      }),
    ],
    archives: {
      [prev]: [
        createChronicleEntry({
          type: CHRONICLE_TYPES.REGIME,
          at: now - MS_MONTH,
          seasonId: prev,
          text: formatRegimeChronicle({
            at: now - MS_MONTH,
            player: 'SteelWolf',
            oldIdeology: 'socialist',
            newIdeology: 'nationalist',
          }),
        }),
        createChronicleEntry({
          type: CHRONICLE_TYPES.WAR,
          at: now - MS_MONTH - 86400000,
          seasonId: prev,
          text: formatWarChronicle({
            at: now - MS_MONTH - 86400000,
            attacker: 'Falcon99',
            defender: 'Boş garnizon',
            targetCity: 'Konya',
            casualties: 88,
            decisive: true,
          }),
        }),
      ],
    },
    lastCompiledAt: now,
  };
}

export const CHRONICLE_TYPE_LABELS = {
  [CHRONICLE_TYPES.WAR]: 'Savaş',
  [CHRONICLE_TYPES.REGIME]: 'Rejim',
  [CHRONICLE_TYPES.BETRAYAL]: 'İhanet',
};
