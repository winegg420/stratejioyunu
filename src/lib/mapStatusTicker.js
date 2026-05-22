/**
 * Harita alt bilgi bandı + global ticker — oyun durumuna göre dinamik mesajlar.
 */
export function buildOperationalTickerMessages({
  expeditions = [],
  reports = [],
  newsLog = [],
  cities = {},
  activeCityId,
  playerCities = [],
  activeCrisis,
  globalOutbreak,
  incomingAttacks = [],
}) {
  const messages = [];
  const activeCity = playerCities.find((c) => c.id === activeCityId);
  const cityName = activeCity?.name ?? 'Üs';
  const outgoing = (expeditions ?? []).filter((e) => e.direction === 'outgoing');

  if (activeCrisis?.active) {
    messages.push({
      id: 'crisis',
      label: activeCrisis.admin ? 'ACİL DURUM' : 'AFET',
      text: `${activeCrisis.type ?? 'Kriz'}${activeCrisis.regionName ? ` — ${activeCrisis.regionName}` : ''}`,
    });
  }

  if (globalOutbreak?.active) {
    messages.push({
      id: 'cbrn',
      label: 'KBRN',
      text: `Karantina aktif: ${globalOutbreak.regionName ?? 'bölge'}`,
    });
  }

  if ((incomingAttacks ?? []).length > 0) {
    const atk = incomingAttacks[0];
    messages.push({
      id: 'incoming-atk',
      label: 'SALDIRI',
      text: `${atk?.originCityName ?? 'Düşman'} → ${atk?.targetCityName ?? cityName} — gelen saldırı`,
    });
  }

  for (const exp of outgoing.slice(-3)) {
    const type = (exp.type ?? 'Sefer').toLowerCase();
    const label = /saldır|attack/.test(type)
      ? 'SEFER ALARMI'
      : /keşif|scout/.test(type)
        ? 'KEŞİF'
        : 'SEFER';
    messages.push({
      id: `exp-out-${exp.id}`,
      label,
      text: `${exp.originCityName ?? cityName}'den ${exp.target ?? 'hedef'}'e ordu hareketi tespit edildi`,
    });
  }

  const returning = (expeditions ?? []).filter((e) => e.direction === 'returning');
  if (returning.length > 0) {
    const r = returning[returning.length - 1];
    messages.push({
      id: `exp-ret-${r.id}`,
      label: 'DÖNÜŞ',
      text: `${r.target ?? 'Cephe'}'den ${r.originCityName ?? cityName}'e konvoy yolda`,
    });
  }

  let buildTotal = 0;
  let prodTotal = 0;
  for (const city of Object.values(cities ?? {})) {
    buildTotal += city?.constructionQueue?.length ?? 0;
    prodTotal += city?.productionQueue?.length ?? 0;
  }
  if (buildTotal > 0) {
    messages.push({
      id: 'build-q',
      label: 'İNŞAAT',
      text: `${buildTotal} aktif inşaat / yükseltme kuyruğunda`,
    });
  }
  if (prodTotal > 0) {
    messages.push({
      id: 'prod-q',
      label: 'ÜRETİM',
      text: `${prodTotal} birlik üretim emri işleniyor`,
    });
  }

  const unread = (reports ?? []).filter((r) => r.isNew).length;
  if (unread > 0) {
    messages.push({
      id: 'reports',
      label: 'RAPOR',
      text: `${unread} okunmamış istihbarat raporu bekliyor`,
    });
  }

  for (const entry of (newsLog ?? []).slice(0, 4)) {
    const text = entry.text ?? entry.title;
    if (!text) continue;
    messages.push({
      id: entry.id ?? `news-${messages.length}`,
      label: 'HABER',
      text: String(text),
    });
  }

  if (messages.length === 0) {
    messages.push({
      id: 'stable',
      label: 'SİSTEM STABIL',
      text: 'Tüm üsler normal operasyon modunda',
    });
  } else if (outgoing.length === 0 && !incomingAttacks?.length) {
    messages.push({
      id: 'stable-quiet',
      label: 'SİSTEM STABIL',
      text: `${cityName} üssü — cephe hattı sakin, rutin devriye`,
    });
  }

  return messages.slice(0, 14);
}
