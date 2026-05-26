import { chromium } from 'playwright';

const base = process.argv[2] || 'https://stratejioyunu.vercel.app';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

await page.goto(`${base}/giris`, { waitUntil: 'networkidle', timeout: 90000 });
await page.getByRole('button', { name: /Hızlı Giriş/i }).click().catch(() => {});
await page.waitForTimeout(2500);

await page.evaluate(() => {
  sessionStorage.setItem('strateji_admin_panel_unlock', '1');
  localStorage.setItem('strateji_dev_admin', '1');
  localStorage.setItem('strateji_dev_test', '1');
});

for (const path of ['/admin-log', '/kurucu-kriz', '/profil']) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => {
    const url = location.pathname;
    const panels = document.querySelectorAll('.panel, .admin-crisis-panel, .admin-bank-panel');
    const visiblePanels = [...panels].filter((p) => {
      const r = p.getBoundingClientRect();
      const st = getComputedStyle(p);
      return r.width > 40 && r.height > 20 && st.display !== 'none' && st.visibility !== 'hidden';
    });
    return {
      url,
      title: document.title,
      h1: document.querySelector('h1, .page-title')?.textContent?.trim()?.slice(0, 80),
      panelCount: panels.length,
      visiblePanelCount: visiblePanels.length,
      crisisBtns: document.querySelectorAll('.admin-crisis-btn').length,
      bankPanel: Boolean(document.querySelector('.admin-bank-panel')),
      unlockForm: Boolean(document.querySelector('.admin-log-unlock')),
      founderBtn: Boolean(document.querySelector('.profile-founder-panel')),
      redirectHome: url === '/' || url === '',
      bodyH: document.body.scrollHeight,
      contentH: document.querySelector('.content-area')?.scrollHeight,
    };
  });
  console.log(JSON.stringify({ path, ...info }, null, 2));
}

console.log('errors:', errors.slice(0, 8));
await page.screenshot({ path: 'scripts/out-admin-kurucu.png', fullPage: true });
await browser.close();
