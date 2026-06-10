// Mobil emülasyonla siteyi açıp boot durumunu ve konsol hatalarını raporlar.
// Kullanım: node scripts/mobile-diagnose.mjs <url>
import { chromium, devices } from 'playwright';

const url = process.argv[2] ?? 'https://stratejioyunu.vercel.app';
const profiles = [
  { name: 'iPhone-13', device: devices['iPhone 13'] },
  { name: 'Pixel-7', device: devices['Pixel 7'] },
];

for (const { name, device } of profiles) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ ...device });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push(`[console.${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  page.on('requestfailed', (req) => {
    failedRequests.push(`[requestfailed] ${req.url()} :: ${req.failure()?.errorText}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) failedRequests.push(`[http ${res.status()}] ${res.url()}`);
  });

  console.log(`\n===== ${name} -> ${url} =====`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(9000);
    const state = await page.evaluate(() => {
      const root = document.getElementById('root');
      const fallback = document.getElementById('app-boot-fallback');
      return {
        url: location.href,
        title: document.title,
        rootChildCount: root ? root.children.length : -1,
        rootTextSample: root ? root.innerText.slice(0, 300) : '(root yok)',
        bootFallbackVisible: !!fallback,
        bodyHeight: document.body.scrollHeight,
      };
    });
    console.log(JSON.stringify(state, null, 2));
    await page.screenshot({ path: `scripts/_shot-${name}.png`, fullPage: false });
    console.log(`screenshot: scripts/_shot-${name}.png`);
  } catch (err) {
    console.log(`GOTO FAILED: ${err.message}`);
  }
  console.log('--- console/page errors ---');
  errors.slice(0, 40).forEach((e) => console.log(e));
  console.log('--- failed requests ---');
  failedRequests.slice(0, 40).forEach((e) => console.log(e));
  await browser.close();
}
