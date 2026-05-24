import { chromium } from 'playwright';

const routes = [
  '/',
  '/kisla',
  '/hava',
  '/harita',
  '/seferler',
  '/istihbarat',
  '/pazar',
  '/arastirma',
  '/binalar',
  '/raporlar',
  '/profil',
  '/diplomasi',
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto('http://127.0.0.1:5173/giris', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1200);
await page.locator('button').filter({ hasText: /Hızlı|hızlı/i }).first().click();
await page.waitForTimeout(6000);

for (const route of routes) {
  await page.goto(`http://127.0.0.1:5173${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1800);
  const errTitle = await page.locator('h1').first().textContent().catch(() => '');
  const detail = await page.locator('.app-error-detail').textContent().catch(() => '');
  const ok = !/Bir şeyler ters gitti/i.test(errTitle ?? '');
  console.log(ok ? 'OK' : 'FAIL', route, ok ? '' : detail?.slice(0, 120));
  if (!ok) errors.push(`${route}: ${detail?.slice(0, 200)}`);
}

console.log('185 errors:', errors.filter((e) => e.includes('185') || e.includes('185')).length);
await browser.close();
process.exit(errors.length ? 1 : 0);
