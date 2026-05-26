import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = process.env.BASE_URL || 'https://stratejioyunu.vercel.app';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await page.goto(`${BASE}/giris`, { waitUntil: 'networkidle', timeout: 60000 });
await page.getByRole('button', { name: /Hızlı Giriş/i }).click().catch(() => {});
await page.waitForTimeout(2500);
await page.goto(`${BASE}/harita`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(6000);

const info = await page.evaluate(() => {
  const lc = document.querySelector('.leaflet-container');
  const tilePane = document.querySelector('.leaflet-tile-pane');
  const overlay = document.querySelector('.leaflet-overlay-pane');
  const path = document.querySelector('.leaflet-overlay-pane path');
  const r = (el) => (el ? el.getBoundingClientRect() : null);
  const map = lc?._leaflet_map || lc?.__leaflet_map;
  return {
    cssHref: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href),
    jsHref: [...document.querySelectorAll('script[src]')].map((s) => s.src).filter((u) => u.includes('assets/')),
    container: r(lc),
    tilePane: r(tilePane),
    overlay: r(overlay),
    path: r(path),
    mapSize: map?.getSize?.() || null,
    mapCenter: map?.getCenter?.() || null,
    mapZoom: map?.getZoom?.() || null,
    paneTransform: tilePane?.style?.transform || null,
    containerInline: lc ? { w: lc.style.width, h: lc.style.height } : null,
  };
});

console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: 'scripts/out-map-normal.png', fullPage: false });

await page.locator('.map-fs-hero-btn, .map-fs-hero-btn--compact').first().click({ timeout: 5000 });
await page.waitForTimeout(2500);

const fsInfo = await page.evaluate(() => {
  const lc = document.querySelector('.leaflet-container');
  const tilePane = document.querySelector('.leaflet-tile-pane');
  const map = lc?._leaflet_map;
  return {
    container: lc?.getBoundingClientRect(),
    tilePane: tilePane?.getBoundingClientRect(),
    mapSize: map?.getSize?.() || null,
    containerInline: lc ? { w: lc.style.width, h: lc.style.height } : null,
    paneTransform: tilePane?.style?.transform || null,
  };
});
console.log('--- FS ---');
console.log(JSON.stringify(fsInfo, null, 2));
await page.screenshot({ path: 'scripts/out-map-fs.png', fullPage: false });

await browser.close();
