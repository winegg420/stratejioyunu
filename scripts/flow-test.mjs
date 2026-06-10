// Kullanıcı akışları testi: giriş -> ana sayfa -> harita -> ülke seçme -> diğer sayfalar
// Kullanım: node scripts/flow-test.mjs <baseUrl> [mobile]
import { chromium, devices } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4173';
const mobile = process.argv[3] === 'mobile';

const browser = await chromium.launch();
const context = await browser.newContext(mobile ? { ...devices['iPhone 13'] } : { viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const issues = [];
const label = mobile ? 'MOBILE' : 'DESKTOP';

page.on('pageerror', (err) => issues.push(`[pageerror] ${page.url()} :: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') issues.push(`[console.error] ${page.url()} :: ${msg.text().slice(0, 300)}`);
});
page.on('response', (res) => {
  if (res.status() >= 400 && !res.url().includes('supabase')) {
    issues.push(`[http ${res.status()}] ${res.url()}`);
  }
});

const log = (m) => console.log(`[${label}] ${m}`);

// 1) GİRİŞ AKIŞI
log('1. Giris sayfasi aciliyor...');
await page.goto(`${base}/giris`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
const quickBtn = page.getByRole('button', { name: /Hızlı Giriş/i });
if (await quickBtn.count() === 0) {
  issues.push('[flow] Hızlı Giriş (Demo) butonu bulunamadı');
} else {
  await quickBtn.first().click();
  await page.waitForTimeout(4000);
  log(`   Giris sonrasi URL: ${page.url()}`);
  if (page.url().includes('/giris')) issues.push('[flow] Hızlı Giriş sonrası /giris sayfasında kalındı (yönlendirme yok)');
}

// Ana sayfa kontrolu
const homeText = await page.evaluate(() => document.body.innerText.slice(0, 200));
log(`   Ana sayfa metni: ${homeText.replace(/\n/g, ' | ').slice(0, 120)}`);

// 2) HARİTA AKIŞI
log('2. Harita sayfasi aciliyor...');
await page.goto(`${base}/harita`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(8000);
const mapState = await page.evaluate(() => {
  const leaflet = document.querySelector('.leaflet-container');
  const panes = document.querySelectorAll('.leaflet-interactive');
  const tiles = document.querySelectorAll('.leaflet-tile-loaded');
  return {
    leafletVisible: !!leaflet && leaflet.offsetWidth > 0 && leaflet.offsetHeight > 0,
    leafletSize: leaflet ? `${leaflet.offsetWidth}x${leaflet.offsetHeight}` : 'yok',
    interactiveCount: panes.length,
    tileCount: tiles.length,
    bodySample: document.body.innerText.slice(0, 150),
  };
});
log(`   Harita durumu: ${JSON.stringify(mapState)}`);
if (!mapState.leafletVisible) issues.push(`[flow] Harita konteyneri görünmüyor (boyut: ${mapState.leafletSize})`);
if (mapState.interactiveCount === 0) issues.push('[flow] Haritada tıklanabilir ülke/şehir katmanı yok');
await page.screenshot({ path: `scripts/_flow-${label}-harita.png` });

// 3) ÜLKE SEÇME — haritanin ortasina yakin bir interactive path'e tikla
log('3. Ulke secme deneniyor...');
const clicked = await page.evaluate(() => {
  const paths = [...document.querySelectorAll('path.leaflet-interactive')];
  if (!paths.length) return { ok: false, reason: 'path yok' };
  // Ekranda görünür ilk büyük path'i seç
  const target = paths.find((p) => {
    const r = p.getBoundingClientRect();
    return r.width > 30 && r.height > 30 && r.top > 60 && r.left >= 0;
  }) ?? paths[0];
  const r = target.getBoundingClientRect();
  return { ok: true, x: r.x + r.width / 2, y: r.y + r.height / 2, total: paths.length };
});
if (!clicked.ok) {
  issues.push(`[flow] Ülke seçilemedi: ${clicked.reason}`);
} else {
  await page.mouse.click(clicked.x, clicked.y);
  await page.waitForTimeout(3000);
  const afterClick = await page.evaluate(() => ({
    panelText: document.body.innerText.slice(0, 400),
    hasPanel: !!document.querySelector('[class*="panel"], [class*="detail"], [class*="city"]'),
  }));
  log(`   Tiklama sonrasi panel var mi: ${afterClick.hasPanel}`);
  await page.screenshot({ path: `scripts/_flow-${label}-ulke-secim.png` });
}

// 4) DİĞER SAYFALAR
const routes = ['/binalar', '/arastirma', '/kisla', '/hava', '/savunma', '/tersane', '/seferler', '/istihbarat', '/pazar', '/ticaret', '/diplomasi', '/raporlar', '/siralama', '/sezon-gorevler', '/kurucu-kriz', '/profil', '/mesajlar', '/kara-borsa', '/admin-log'];
log('4. Diger sayfalar geziliyor...');
for (const r of routes) {
  const before = issues.length;
  await page.goto(`${base}${r}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const info = await page.evaluate(() => {
    const root = document.getElementById('root');
    const errEl = document.querySelector('.app-error-fallback, [class*="error-boundary"], [class*="page-safe-error"]');
    return {
      empty: !root || root.innerText.trim().length < 10,
      errorShown: errEl ? errEl.innerText.slice(0, 150) : null,
    };
  });
  if (info.empty) issues.push(`[flow] ${r} sayfası boş render edildi`);
  if (info.errorShown) issues.push(`[flow] ${r} hata ekranı gösteriyor: ${info.errorShown}`);
  const newErr = issues.length - before;
  log(`   ${r} -> ${newErr === 0 ? 'OK' : newErr + ' sorun'}`);
}

console.log(`\n===== ${label} SONUC: ${issues.length} sorun =====`);
const seen = new Set();
for (const i of issues) {
  const key = i.replace(/https?:\/\/[^ ]+/g, '').slice(0, 120);
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(i);
}
await browser.close();
