// Bulut kayıt (Supabase sync) teşhisi: şifreli giriş -> saldırı -> kayıt düştü mü? + reload sonrası sefer kayboluyor mu?
// Kullanım: node scripts/sync-diagnose.mjs <baseUrl>
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const base = process.argv[2] ?? 'https://stratejioyunu.vercel.app';
const vars = Object.fromEntries(readFileSync('.env.supabase', 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const sb = createClient(vars.VITE_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => { try { localStorage.setItem('strateji_dev_admin', '1'); } catch { /* */ } });
const page = await context.newPage();
const log = (m) => console.log(`[SYNC] ${m}`);
const syncLogs = [];
page.on('console', (msg) => {
  const t = msg.text();
  if (/supabaseSync|gameStore|save|sync/i.test(t)) syncLogs.push(`${msg.type()}: ${t.slice(0, 250)}`);
});

// 1) Şifreli gerçek giriş
log('1. Sifreli giris...');
await page.goto(`${base}/giris`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.fill('form input:not([type="password"])', 'komutan');
await page.fill('input[type="password"]', 'Strateji2026!');
await page.getByRole('button', { name: /^Giriş Yap/i }).first().click();
await page.waitForTimeout(8000);
log(`   URL: ${page.url()}`);

// Supabase session var mı?
const session = await page.evaluate(() => {
  const keys = Object.keys(localStorage).filter((k) => k.includes('auth-token') || k.startsWith('sb-'));
  return keys.length ? keys : null;
});
log(`   Tarayıcıda Supabase auth anahtarı: ${session ? session.join(', ') : 'YOK'}`);

// 2) Haritadan bir saldırı başlat
log('2. Saldiri baslatiliyor...');
await page.goto(`${base}/harita`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(9000);
// otomatik modal varsa kapat
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

let attacked = false;
for (let i = 0; i < 25 && !attacked; i++) {
  const pt = await page.evaluate((idx) => {
    const paths = [...document.querySelectorAll('path.leaflet-interactive')].filter((p) => {
      const r = p.getBoundingClientRect();
      return r.width > 18 && r.height > 18 && r.top > 80 && r.left > 0 && r.bottom < window.innerHeight;
    });
    if (!paths.length) return null;
    const t = paths[(idx * 5 + 2) % paths.length];
    const r = t.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, i);
  if (!pt) break;
  await page.mouse.click(pt.x, pt.y);
  await page.waitForTimeout(1500);
  const can = await page.evaluate(() => {
    const modal = document.querySelector('[class*="map-command-modal"]')?.closest('.map-command-portal-host') ?? document;
    const btns = [...modal.querySelectorAll('button')];
    const atk = btns.find((b) => /OPERASYON BAŞLAT|FETİH SEFERİ/.test(b.innerText) && !b.disabled);
    return Boolean(atk);
  });
  if (!can) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); continue; }
  await page.locator('button', { hasText: /OPERASYON BAŞLAT|FETİH SEFERİ/ }).first().click();
  await page.waitForTimeout(900);
  const raid = page.locator('[role="radio"]', { hasText: /YAĞMA/ });
  if (await raid.count()) { await raid.first().click(); await page.waitForTimeout(300); }
  const qty = page.locator('input[type="number"]');
  if (await qty.count()) { await qty.first().fill('3'); await page.waitForTimeout(300); }
  const start = page.locator('button', { hasText: /SEFERİ BAŞLAT/ }).first();
  if (await start.count() && !(await start.isDisabled())) {
    await start.click();
    await page.waitForTimeout(1500);
    attacked = true;
    log('   Saldırı başlatıldı.');
  } else {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }
}
if (!attacked) log('   UYARI: saldırı başlatılamadı');

// 3) SPA navigasyonu ile seferler (reload YOK)
log('3. SPA nav ile /seferler...');
await page.evaluate(() => { window.history.pushState({}, '', '/seferler'); window.dispatchEvent(new PopStateEvent('popstate')); });
await page.waitForTimeout(2500);
let spa = await page.evaluate(() => /YAĞMA|RAID|yolda|dönüş|İşgal/i.test(document.body.innerText));
if (!spa) {
  // popstate yetmediyse nav linkine tıkla
  const link = page.locator('a[href="/seferler"]').first();
  if (await link.count()) { await link.click(); await page.waitForTimeout(2500); }
  spa = await page.evaluate(() => /YAĞMA|RAID|yolda|dönüş|İşgal/i.test(document.body.innerText));
}
log(`   SPA-nav sonrası aktif sefer görünüyor mu: ${spa}`);

// 4) Bulut kaydının düşmesini bekle ve DB'yi kontrol et
log('4. 20 sn bekleyip Supabase tablolarini kontrol...');
await page.waitForTimeout(20000);
for (const t of ['cities', 'expeditions', 'city_units', 'profiles']) {
  const { count } = await sb.from(t).select('*', { count: 'exact', head: true });
  log(`   ${t}: ${count} satır`);
}

// 5) Tam reload sonrası sefer duruyor mu?
log('5. Sayfa tam yenileniyor (reload)...');
await page.goto(`${base}/seferler`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(6000);
const afterReload = await page.evaluate(() => /YAĞMA|RAID|yolda|dönüş|İşgal/i.test(document.body.innerText));
log(`   Reload sonrası aktif sefer görünüyor mu: ${afterReload}`);

console.log('\n--- sync ile ilgili konsol logları ---');
syncLogs.slice(0, 25).forEach((l) => console.log(l));
await browser.close();
