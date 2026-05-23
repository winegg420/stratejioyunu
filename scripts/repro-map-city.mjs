import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.goto('http://localhost:5173/giris', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1200);
await page.locator('button').filter({ hasText: /Hızlı|hızlı/i }).first().click();
await page.waitForTimeout(5000);

await page.goto('http://localhost:5173/harita', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(4000);

const mapError = await page.locator('.map-error-boundary__title').count();
console.log('map error overlay:', mapError > 0);

const select = page.locator('#map-city-select, .map-city-select').first();
if (await select.count()) {
  const options = await select.locator('option').all();
  if (options.length > 1) {
    const val = await options[1].getAttribute('value');
    if (val) await select.selectOption(val);
    await page.waitForTimeout(2500);
  }
}

const leafletPath = page.locator('.leaflet-interactive').first();
if (await leafletPath.count()) {
  await leafletPath.click({ force: true, position: { x: 20, y: 20 } });
  await page.waitForTimeout(2500);
}

const panel = await page.locator('.map-command-modal, .map-command-panel, [class*="map-command"]').count();
const mapErrorAfter = await page.locator('.map-error-boundary__title').count();
console.log('city panel visible:', panel > 0);
console.log('map error after click:', mapErrorAfter > 0);
console.log('page errors:', errors.filter((e) => !e.includes('favicon')).slice(0, 5));

await browser.close();
process.exit(mapErrorAfter > 0 || errors.some((e) => e.includes('185')) ? 1 : 0);
