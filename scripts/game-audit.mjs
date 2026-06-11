// Oyun fonksiyon denetimi: admin test modu + harita zoom stresi + çoklu ülke saldırı/casusluk + sayfa aksiyonları
// Kullanım: node scripts/game-audit.mjs <baseUrl>
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4173';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

// Admin/dev test modu: sayfa scriptlerinden önce localStorage'a yaz
await context.addInitScript(() => {
  try { localStorage.setItem('strateji_dev_admin', '1'); } catch { /* yok */ }
});

const page = await context.newPage();
const issues = [];
const log = (m) => console.log(`[AUDIT] ${m}`);

page.on('pageerror', (err) => issues.push(`[pageerror] ${page.url()} :: ${err.message.slice(0, 300)}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') issues.push(`[console.error] ${page.url()} :: ${msg.text().slice(0, 300)}`);
});
page.on('response', (res) => {
  if (res.status() >= 400 && !res.url().includes('supabase')) {
    issues.push(`[http ${res.status()}] ${res.url()}`);
  }
});

const wait = (ms) => page.waitForTimeout(ms);

// ---------- 1) GİRİŞ ----------
log('1. Giris (admin test modu acik)...');
await page.goto(`${base}/giris`, { waitUntil: 'domcontentloaded' });
await wait(2500);
const quickBtn = page.getByRole('button', { name: /Hızlı Giriş/i });
if (await quickBtn.count() === 0) {
  issues.push('[flow] Hızlı Giriş butonu yok');
} else {
  await quickBtn.first().click();
  await wait(4000);
}
log(`   URL: ${page.url()}`);

// ---------- 2) HARİTA ZOOM/PAN STRESİ ----------
log('2. Harita zoom/pan stres testi...');
await page.goto(`${base}/harita`, { waitUntil: 'domcontentloaded' });
await wait(8000);

// Harita açılışında kendiliğinden (gecikmeli) açılan modal var mı? (zoom butonlarını bloklar)
const MODAL_SEL = '.map-command-portal-host [class*="map-command-modal"], .map-command-modal__backdrop';
async function modalOpen() {
  return (await page.locator(MODAL_SEL).count()) > 0;
}
async function dismissModal(tag) {
  if (!(await modalOpen())) return false;
  const content = await page.evaluate(() => {
    const host = document.querySelector('.map-command-portal-host');
    return host ? host.innerText.slice(0, 200).replace(/\n/g, ' | ') : '(içerik okunamadı)';
  });
  log(`   NOT[${tag}]: modal açık :: ${content}`);
  await page.keyboard.press('Escape');
  await wait(600);
  if (await modalOpen()) {
    const x = page.locator('button[aria-label="Kapat"], button[aria-label="Komuta modalını kapat"]');
    if (await x.count()) await x.first().click({ force: true }).catch(() => {});
    await wait(600);
  }
  if (await modalOpen()) {
    issues.push(`[map] Modal (${tag}) Escape + Kapat ile kapanmadı`);
    return false;
  }
  return true;
}
// Modal gecikmeli açılabiliyor — 12 sn boyunca gözle
let sawAutoModal = false;
for (let i = 0; i < 12; i++) {
  if (await modalOpen()) { sawAutoModal = true; break; }
  await wait(1000);
}
if (sawAutoModal) {
  issues.push('[map] Harita açılışında kullanıcı tıklaması olmadan komuta modalı kendiliğinden açılıyor');
  await dismissModal('açılış');
}

const zoomReport = [];
async function readZoom() {
  return page.evaluate(() => {
    const el = document.querySelector('.leaflet-container');
    if (!el) return null;
    // Leaflet zoom seviyesini DOM'dan çıkar — tile container class'ı yoksa proxy transform kullan
    const proxy = document.querySelector('.leaflet-proxy');
    return proxy ? proxy.style.transform : 'proxy-yok';
  });
}

const zoomInBtn = page.getByRole('button', { name: 'Yakınlaştır' });
const zoomOutBtn = page.getByRole('button', { name: 'Uzaklaştır' });
if (await zoomInBtn.count() === 0) {
  issues.push('[zoom] Yakınlaştır butonu bulunamadı');
} else {
  // 12x içeri, 12x dışarı, tekrar — clamp ve hata gözlemi (modal yeniden açılırsa kapat)
  for (let round = 0; round < 2; round++) {
    for (let i = 0; i < 12; i++) {
      if (await modalOpen()) await dismissModal(`zoom-r${round}-i${i}`);
      await zoomInBtn.first().click({ timeout: 5000 }).catch(() => {});
      await wait(180);
    }
    zoomReport.push(`round${round} max-in: ${await readZoom()}`);
    for (let i = 0; i < 12; i++) {
      if (await modalOpen()) await dismissModal(`zoom-r${round}-o${i}`);
      await zoomOutBtn.first().click({ timeout: 5000 }).catch(() => {});
      await wait(180);
    }
    zoomReport.push(`round${round} max-out: ${await readZoom()}`);
  }
}

// Tekerlek zoom + sürükleme
const mapBox = await page.locator('.leaflet-container').boundingBox();
if (mapBox) {
  const cx = mapBox.x + mapBox.width / 2;
  const cy = mapBox.y + mapBox.height / 2;
  for (let i = 0; i < 8; i++) { await page.mouse.move(cx + i * 10, cy); await page.mouse.wheel(0, -400); await wait(150); }
  for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 400); await wait(150); }
  // pan sürüklemeleri
  for (const [dx, dy] of [[300, 0], [-600, 0], [300, 200], [0, -400]]) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 12 });
    await page.mouse.up();
    await wait(300);
  }
}
await wait(1500);
const tilesAfter = await page.evaluate(() => ({
  tiles: document.querySelectorAll('.leaflet-tile-loaded').length,
  broken: [...document.querySelectorAll('img.leaflet-tile')].filter((t) => !t.complete || t.naturalWidth === 0).length,
  visible: (() => { const e = document.querySelector('.leaflet-container'); return !!e && e.offsetWidth > 0; })(),
}));
log(`   Zoom stres sonrası: ${JSON.stringify(tilesAfter)} | ${zoomReport.join(' | ')}`);
if (!tilesAfter.visible) issues.push('[zoom] Stres sonrası harita konteyneri kayboldu');
if (tilesAfter.broken > 0) issues.push(`[zoom] ${tilesAfter.broken} kırık karo (yüklenmemiş img)`);
await page.screenshot({ path: 'scripts/_audit-zoom.png' });

// ---------- 3) ÇOKLU ÜLKE SALDIRI + CASUSLUK ----------
log('3. Ulke saldiri/casusluk akislari...');

async function closeModal() {
  await page.keyboard.press('Escape').catch(() => {});
  await wait(400);
  const closeBtn = page.locator('.map-command-modal .hud-modal-close, .map-command-modal__close');
  if (await closeBtn.count()) await closeBtn.first().click().catch(() => {});
  await wait(400);
}

async function openCountryPanel(index) {
  // Görünür interactive path'lerden index'incisini tıkla
  const pt = await page.evaluate((idx) => {
    const paths = [...document.querySelectorAll('path.leaflet-interactive')].filter((p) => {
      const r = p.getBoundingClientRect();
      return r.width > 18 && r.height > 18 && r.top > 80 && r.left > 0 && r.bottom < window.innerHeight;
    });
    if (!paths.length) return null;
    const t = paths[idx % paths.length];
    const r = t.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, count: paths.length };
  }, index);
  if (!pt) return null;
  await page.mouse.click(pt.x, pt.y);
  await wait(1600);
  const info = await page.evaluate(() => {
    const modal = document.querySelector('.map-command-modal');
    if (!modal) return { open: false };
    const title = modal.querySelector('h2, h1, [class*="title"]')?.innerText ?? '';
    const text = modal.innerText;
    return {
      open: true,
      title: title.slice(0, 60),
      own: text.includes('ÜSSÜ YÖNET') || text.includes('Üssü yönet'),
      canAttack: [...modal.querySelectorAll('button')].some((b) => /OPERASYON BAŞLAT|FETİH SEFERİ/.test(b.innerText) && !b.disabled),
      canIntel: [...modal.querySelectorAll('button')].some((b) => /İSTİHBARAT GÖNDER/.test(b.innerText) && !b.disabled),
    };
  });
  return info;
}

async function attackFromOpenPanel(name) {
  // Operasyon panelini aç
  const opBtn = page.locator('.map-command-modal button', { hasText: /OPERASYON BAŞLAT|FETİH SEFERİ/ }).first();
  await opBtn.click();
  await wait(900);
  // Yağma intenti seç (varsa)
  const raid = page.locator('.map-command-modal [role="radio"]', { hasText: /YAĞMA/ });
  if (await raid.count()) { await raid.first().click(); await wait(400); }
  // Akordeon başlıklarını aç ve ilk birlik inputuna miktar yaz
  await page.evaluate(() => {
    document.querySelectorAll('.map-command-modal [class*="accordion"] button, .map-command-modal summary').forEach((b) => b.click());
  });
  await wait(500);
  const qtyInputs = page.locator('.map-command-modal input[type="number"]');
  const n = await qtyInputs.count();
  if (n === 0) { issues.push(`[attack:${name}] birlik miktar inputu yok`); return false; }
  await qtyInputs.first().fill('5');
  await wait(400);
  const startBtn = page.locator('.map-command-modal button', { hasText: /SEFERİ BAŞLAT|FETHİ BAŞLAT/ }).first();
  if (await startBtn.count() === 0) { issues.push(`[attack:${name}] SEFERİ BAŞLAT butonu yok`); return false; }
  const disabled = await startBtn.isDisabled();
  if (disabled) {
    const hint = await page.locator('.map-command-modal__hint--attack').innerText().catch(() => '?');
    issues.push(`[attack:${name}] başlat butonu disabled: ${hint.slice(0, 100)}`);
    return false;
  }
  await startBtn.click();
  await wait(1500);
  const stillOpen = await page.locator('.map-command-modal').count();
  if (stillOpen) {
    // modal kapanmadıysa hata olabilir — panel metnini al
    const txt = await page.locator('.map-command-modal').innerText().catch(() => '');
    issues.push(`[attack:${name}] sefer başlatıldı ama modal kapanmadı :: ${txt.slice(0, 120).replace(/\n/g, ' ')}`);
    await closeModal();
    return false;
  }
  return true;
}

const attacked = [];
const spied = [];
let probe = 0;
const MAX_PROBE = 40;
while (attacked.length < 4 && probe < MAX_PROBE) {
  const info = await openCountryPanel(probe * 3 + 1);
  probe++;
  if (!info) { issues.push('[attack] tıklanabilir ülke kalmadı'); break; }
  if (!info.open) continue;
  if (info.own || attacked.includes(info.title) || spied.includes(info.title)) { await closeModal(); continue; }
  if (!info.canAttack) { await closeModal(); continue; }

  // İlk 1 hedefe önce casusluk yönlendirmesini dene (harita -> istihbarat)
  if (spied.length < 1 && info.canIntel && attacked.length >= 1) {
    const intelBtn = page.locator('.map-command-modal button', { hasText: /İSTİHBARAT GÖNDER/ }).first();
    await intelBtn.click();
    await wait(2500);
    const url = page.url();
    if (!url.includes('/istihbarat')) {
      issues.push(`[spy:${info.title}] İSTİHBARAT GÖNDER /istihbarat'a yönlendirmedi (url: ${url})`);
    } else {
      // İstihbarat sayfasında ilk aktif Gönder butonuna bas
      await wait(1500);
      const send = page.locator('button', { hasText: /^Gönder$/ }).first();
      if (await send.count() && !(await send.isDisabled().catch(() => true))) {
        await send.click();
        await wait(1500);
        spied.push(info.title);
        log(`   CASUSLUK -> ${info.title} :: gönderildi`);
      } else {
        const bodyHint = await page.evaluate(() => document.body.innerText.slice(0, 0) || '');
        spied.push(info.title);
        issues.push(`[spy:${info.title}] istihbarat sayfasında aktif Gönder butonu yok${bodyHint}`);
      }
    }
    await page.goto(`${base}/harita`, { waitUntil: 'domcontentloaded' });
    await wait(6000);
    continue;
  }

  const ok = await attackFromOpenPanel(info.title);
  if (ok) {
    attacked.push(info.title);
    log(`   SALDIRI -> ${info.title} :: sefer başlatıldı`);
  }
  await wait(800);
}
if (attacked.length < 3) issues.push(`[attack] yalnız ${attacked.length} ülkeye saldırı başlatılabildi (hedef 3-4)`);
log(`   Saldırılan: ${attacked.join(', ') || 'YOK'} | Casusluk: ${spied.join(', ') || 'YOK'}`);
await page.screenshot({ path: 'scripts/_audit-saldiri.png' });

// ---------- 4) SEFERLER + RAPORLAR DOĞRULAMA ----------
log('4. Seferler/raporlar dogrulaniyor...');
await page.goto(`${base}/seferler`, { waitUntil: 'domcontentloaded' });
await wait(2500);
const sefer = await page.evaluate(() => {
  const txt = document.body.innerText;
  return { hasActive: /YAĞMA|RAID|Saldırı|İşgal|dönüş|yolda/i.test(txt), sample: txt.slice(0, 250).replace(/\n/g, ' | ') };
});
log(`   Seferler sayfası: aktif sefer izi=${sefer.hasActive}`);
if (attacked.length > 0 && !sefer.hasActive) issues.push(`[seferler] ${attacked.length} saldırı başlatıldı ama /seferler sayfasında aktif sefer görünmüyor :: ${sefer.sample}`);
await page.screenshot({ path: 'scripts/_audit-seferler.png' });

// ---------- 5) DİĞER FONKSİYONLAR — sayfa başına bir aksiyon ----------
log('5. Sayfa aksiyonlari deneniyor...');
const actionPlan = [
  { route: '/binalar', btn: /Yükselt|İnşa|Geliştir/i, name: 'bina yükselt' },
  { route: '/arastirma', btn: /Araştır|Başlat/i, name: 'araştırma başlat' },
  { route: '/kisla', btn: /Eğit|Üret/i, name: 'kışla üretim' },
  { route: '/hava', btn: /Üret|Eğit/i, name: 'hava üretim' },
  { route: '/tersane', btn: /Üret|İnşa/i, name: 'tersane üretim' },
  { route: '/savunma', btn: /Kur|Yükselt|Üret/i, name: 'savunma kur' },
  { route: '/pazar', btn: /Satın Al|Al$|Sat$/i, name: 'pazar işlem' },
  { route: '/kara-borsa', btn: /Satın Al|Al$/i, name: 'kara borsa işlem' },
];
for (const act of actionPlan) {
  const before = issues.length;
  await page.goto(`${base}${act.route}`, { waitUntil: 'domcontentloaded' });
  await wait(2200);
  const btn = page.locator('button:visible', { hasText: act.btn }).first();
  if (await btn.count() === 0) {
    log(`   ${act.route} -> uygun buton yok (atlandı)`);
    continue;
  }
  const dis = await btn.isDisabled().catch(() => true);
  if (dis) { log(`   ${act.route} -> buton disabled (kaynak/koşul), atlandı`); continue; }
  await btn.click().catch((e) => issues.push(`[action:${act.name}] tıklama hatası: ${e.message.slice(0, 80)}`));
  await wait(1800);
  const newErr = issues.length - before;
  log(`   ${act.route} (${act.name}) -> ${newErr === 0 ? 'OK' : newErr + ' sorun'}`);
}

// ---------- SONUÇ ----------
console.log(`\n===== AUDIT SONUC: ${issues.length} sorun =====`);
const seen = new Set();
for (const i of issues) {
  const key = i.replace(/https?:\/\/[^ ]+/g, '').slice(0, 140);
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(i);
}
await browser.close();
