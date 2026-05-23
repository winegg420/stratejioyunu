import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE:', m.text());
});

await page.goto('http://127.0.0.1:5173/giris', { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1500);

const quick = page.getByRole('button', { name: /hızlı|quick/i }).first();
if (await quick.count()) {
  await quick.click();
} else {
  const any = page.locator('button').filter({ hasText: /giriş|login|hızlı/i }).first();
  await any.click();
}

await page.waitForTimeout(6000);
console.log('URL:', page.url());
const detail = await page.locator('.app-error-detail').textContent().catch(() => '');
const title = await page.locator('h1').first().textContent().catch(() => '');
console.log('H1:', title);
console.log('DETAIL:', detail?.slice(0, 500));

await browser.close();
