// Canlı sitede Supabase şifreli giriş testi (test kullanıcısı ile)
import { chromium, devices } from 'playwright';

const base = process.argv[2] ?? 'https://stratejioyunu.vercel.app';
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['iPhone 13'] });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`));

await page.goto(`${base}/giris`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.fill('input[type="text"], input[name*="player"], input[id*="player"], form input:not([type="password"])', 'komutan');
await page.fill('input[type="password"]', 'Strateji2026!');
await page.getByRole('button', { name: /^Giriş Yap/i }).first().click();
await page.waitForTimeout(8000);
console.log('Giris sonrasi URL:', page.url());
const body = await page.evaluate(() => document.body.innerText.slice(0, 200).replace(/\n/g, ' | '));
console.log('Sayfa:', body);
console.log('Sonuc:', page.url().includes('/giris') ? 'BASARISIZ - giris sayfasinda kaldi' : 'BASARILI - oyuna girildi');
errors.forEach((e) => console.log(e));
await browser.close();
