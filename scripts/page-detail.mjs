// Belirli sayfalardaki tüm konsol/ağ hatalarını URL'leriyle listeler
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4173';
const routes = (process.argv[3] ?? '/siralama,/sezon-gorevler,/kurucu-kriz,/admin-log,/binalar').split(',');

const browser = await chromium.launch();
const page = await browser.newPage();

// once giris
await page.goto(`${base}/giris`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const quickBtn = page.getByRole('button', { name: /Hızlı Giriş/i });
if (await quickBtn.count()) { await quickBtn.first().click(); await page.waitForTimeout(3000); }

for (const r of routes) {
  const errs = [];
  const onConsole = (msg) => { if (msg.type() === 'error') errs.push(`console: ${msg.text().slice(0, 500)}`); };
  const onPageError = (e) => errs.push(`pageerror: ${e.message.slice(0, 500)}\n${(e.stack ?? '').slice(0, 500)}`);
  const onReqFail = (req) => errs.push(`reqfail: ${req.url()} :: ${req.failure()?.errorText}`);
  const onResp = (res) => { if (res.status() >= 400) errs.push(`http ${res.status()}: ${res.url()}`); };
  page.on('console', onConsole); page.on('pageerror', onPageError);
  page.on('requestfailed', onReqFail); page.on('response', onResp);
  await page.goto(`${base}${r}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3500);
  page.off('console', onConsole); page.off('pageerror', onPageError);
  page.off('requestfailed', onReqFail); page.off('response', onResp);
  console.log(`\n===== ${r} (${errs.length} hata) =====`);
  errs.forEach((e) => console.log(' -', e));
}
await browser.close();
