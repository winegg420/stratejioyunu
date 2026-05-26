import { chromium } from 'playwright';

const base = process.argv[2] || 'https://stratejioyunu.vercel.app';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`${base}/giris`, { waitUntil: 'networkidle', timeout: 90000 });
await page.getByRole('button', { name: /Hızlı Giriş/i }).click().catch(() => {});
await page.waitForTimeout(2000);
await page.goto(`${base}/harita`, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(10000);
const bundle = await page.evaluate(() => {
  const s = document.querySelector('script[src*="assets/index"]');
  return s?.src || null;
});
console.log('bundle:', bundle);
await page.locator('.map-command-modal__backdrop').click({ timeout: 2000 }).catch(() => {});
await page.locator('.map-fs-hero-btn').first().click();
await page.waitForTimeout(3000);
for (let i = 0; i < 12; i += 1) {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.map-hud-btn')].find((b) => b.textContent.trim() === '−');
    btn?.click();
  });
  await page.waitForTimeout(350);
}
const d = await page.evaluate(() => {
  const lc = document.querySelector('.leaflet-container');
  const paths = [...document.querySelectorAll('.leaflet-overlay-pane path')];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of paths) {
    const b = p.getBoundingClientRect();
    if (b.width < 2) continue;
    minX = Math.min(minX, b.left);
    maxX = Math.max(maxX, b.right);
    minY = Math.min(minY, b.top);
    maxY = Math.max(maxY, b.bottom);
  }
  const z = document.querySelector('.leaflet-tile-pane img')?.src?.match(/\/(\d+)\//)?.[1];
  return {
    tileZoom: z,
    fillW: lc && paths.length ? Math.round(((maxX - minX) / lc.offsetWidth) * 100) : null,
    fillH: lc && paths.length ? Math.round(((maxY - minY) / lc.offsetHeight) * 100) : null,
  };
});
console.log(JSON.stringify(d, null, 2));
await browser.close();
