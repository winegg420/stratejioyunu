import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`PAGE: ${e.message}\n${e.stack || ''}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`);
});

await page.goto('https://stratejioyunu.vercel.app/giris', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);

const btn = page.locator('button').filter({ hasText: /Hızlı|hızlı|Quick/i }).first();
if (await btn.count()) await btn.click();
await page.waitForTimeout(8000);

const detail = await page.locator('.app-error-detail, pre').first().textContent().catch(() => '');
const h1 = await page.locator('h1').first().textContent().catch(() => '');
console.log('URL:', page.url());
console.log('H1:', h1);
console.log('DETAIL:', detail?.slice(0, 2000));
console.log('ERRORS:', errors.slice(0, 5).join('\n---\n'));

await browser.close();
