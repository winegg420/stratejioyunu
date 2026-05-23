import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:\n', e.message, '\n', e.stack));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE:', m.text());
});

await page.goto('http://localhost:5173/giris', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(1500);
await page.locator('button').filter({ hasText: /Hızlı|hızlı/i }).first().click();
await page.waitForTimeout(8000);
console.log('URL:', page.url());
console.log('H1:', await page.locator('h1').first().textContent().catch(() => ''));
await browser.close();
