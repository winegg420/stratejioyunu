import { chromium, devices } from 'playwright';

const BASE = process.env.BASE_URL || 'https://stratejioyunu.vercel.app';
const iPhone = devices['iPhone 13'];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();
  const errors = [];

  page.on('pageerror', (err) => errors.push({ type: 'pageerror', message: err.message, stack: err.stack?.slice(0, 400) }));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ type: 'console', message: msg.text() });
  });

  await page.goto(`${BASE}/giris`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1500);

  const bootErr = await page.locator('.app-error-fallback').count();
  if (bootErr) {
    const txt = await page.locator('.app-error-fallback').innerText();
    console.log('BOOT FAIL on /giris:', txt.slice(0, 300));
    errors.push({ route: '/giris', boot: txt });
  }

  await page.getByRole('button', { name: /Hızlı Giriş/i }).click();
  await page.waitForURL('**/', { timeout: 20000 });
  await page.waitForTimeout(3000);

  const homeBoot = await page.locator('.app-error-fallback').count();
  const gate = await page.locator('.auth-loading-screen').count();
  const loader = await page.locator('.page-route-loader').count();
  const homeText = await page.locator('body').innerText();
  const hasHome = homeText.includes('Ana Merkez') || homeText.includes('COMMAND') || homeText.includes('Komuta');

  console.log('HOME', {
    boot: homeBoot > 0,
    authGate: gate > 0,
    routeLoader: loader > 0,
    hasHome,
    preview: homeText.slice(0, 120).replace(/\s+/g, ' '),
  });

  if (homeBoot) errors.push({ route: '/', boot: await page.locator('.app-error-fallback p').nth(1).innerText().catch(() => '') });
  if (gate && !hasHome) errors.push({ route: '/', stuck: 'auth-loading-screen' });

  await page.goto(`${BASE}/savunma`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(4000);
  const defText = await page.locator('body').innerText();
  console.log('SAVUNMA', {
    boot: (await page.locator('.app-error-fallback').count()) > 0,
    gate: (await page.locator('.auth-loading-screen').count()) > 0,
    hasDefense: defText.includes('Savunma') || defText.includes('Defense'),
    preview: defText.slice(0, 120).replace(/\s+/g, ' '),
  });

  await browser.close();

  const fatal = errors.filter((e) => e.type === 'pageerror' || e.boot || e.stuck);
  if (fatal.length) {
    console.error('\n=== MOBILE FATAL ===');
    console.error(JSON.stringify(fatal, null, 2));
    process.exit(1);
  }
  console.log('\nMobile smoke OK (non-fatal console:', errors.length, ')');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
