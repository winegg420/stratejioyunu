import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'https://stratejioyunu.vercel.app';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

await page.goto(`${BASE}/giris`, { waitUntil: 'networkidle', timeout: 60000 });
await page.getByRole('button', { name: /Hızlı Giriş/i }).click().catch(() => {});
await page.waitForTimeout(3000);

await page.goto(`${BASE}/harita`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(5000);

const dims = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      sel,
      w: Math.round(r.width),
      h: Math.round(r.height),
      top: Math.round(r.top),
      left: Math.round(r.left),
      position: cs.position,
      display: cs.display,
      flex: cs.flex,
      inlineW: el.style.width || null,
      inlineH: el.style.height || null,
    };
  };
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    theater: pick('.map-page--command-theater'),
    host: pick('.map-container--tactical'),
    leaflet: pick('.leaflet-container.turkey-map'),
    mapPane: pick('.leaflet-map-pane'),
    wrapper: pick('.map-page-wrapper--tactical'),
    content: pick('.content-area'),
  };
});

console.log(JSON.stringify(dims, null, 2));

await page.locator('.map-fs-hero-btn, .map-fs-hero-btn--compact').first().click({ timeout: 5000 }).catch(() => {});
await page.waitForTimeout(2000);

const fsDims = await page.evaluate(() => {
  const pick = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { sel, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left) };
  };
  return {
    fsActive: document.documentElement.classList.contains('map-fs-active'),
    fullscreenEl: document.fullscreenElement?.className || null,
    theater: pick('.map-page--command-theater'),
    host: pick('.map-container--tactical'),
    leaflet: pick('.leaflet-container.turkey-map'),
  };
});

console.log('--- FULLSCREEN ---');
console.log(JSON.stringify(fsDims, null, 2));

await browser.close();
