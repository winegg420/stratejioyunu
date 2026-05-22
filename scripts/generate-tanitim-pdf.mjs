/**
 * Tanıtım PDF — HTML'den Playwright ile (okunaklı layout).
 * Önce: npm run html:tanitim
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'docs', 'Oyun-Tanitim.html');
const pdfPath = path.join(root, 'docs', 'Stratejioyunu-Tanitim.pdf');

if (!fs.existsSync(htmlPath)) {
  console.error('Önce HTML üretin: npm run html:tanitim');
  process.exit(1);
}

const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: 'load' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' },
});
await browser.close();

console.log(`PDF oluşturuldu: ${pdfPath}`);
