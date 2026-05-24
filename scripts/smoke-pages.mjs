import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:5174';
const ROUTES = [
  '/giris',
  '/',
  '/binalar',
  '/kisla',
  '/harita',
  '/seferler',
  '/ticaret',
  '/istihbarat',
  '/raporlar',
  '/arastirma',
  '/hava',
  '/tersane',
  '/diplomasi',
  '/mesajlar',
  '/profil',
  '/admin-log',
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];

  page.on('pageerror', (err) => errors.push({ type: 'pageerror', message: err.message }));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ type: 'console', message: msg.text() });
  });

  await page.goto(`${BASE}/giris`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.getByRole('button', { name: /Hızlı Giriş/i }).click();
  await page.waitForURL('**/', { timeout: 15000 });

  for (const route of ROUTES.filter((r) => r !== '/giris')) {
    const url = `${BASE}${route}`;
    const routeErrors = [];
    const onErr = (err) => routeErrors.push(err.message);
    page.on('pageerror', onErr);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(800);
      const body = await page.locator('body').innerText();
      const hasErrorFallback = body.includes('Bir şeyler ters gitti');
      const errorDetail = hasErrorFallback
        ? await page.locator('.app-error-detail').textContent().catch(() => '')
        : '';
      const hasRoot = await page.locator('#root').count();
      console.log(
        route,
        hasErrorFallback ? 'FAIL(ErrorBoundary)' : hasRoot ? 'OK' : 'FAIL(empty)',
        hasErrorFallback ? errorDetail?.slice(0, 200) : body.slice(0, 60).replace(/\s+/g, ' '),
      );
      if (hasErrorFallback) routeErrors.push(errorDetail || 'ErrorBoundary visible');
    } catch (e) {
      console.log(route, 'FAIL', e.message);
      routeErrors.push(e.message);
    }
    page.off('pageerror', onErr);
    if (routeErrors.length) errors.push({ route, routeErrors });
  }

  await browser.close();
  if (errors.length) {
    console.error('\n=== ERRORS ===');
    console.error(JSON.stringify(errors, null, 2));
    process.exit(1);
  }
  console.log('\nAll routes OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
