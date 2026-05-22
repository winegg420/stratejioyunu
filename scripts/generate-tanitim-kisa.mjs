import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mdPath = path.join(root, 'docs', 'Oyun-Tanitim-Kisa.md');
const htmlPath = path.join(root, 'docs', 'Oyun-Tanitim-Kisa.html');
const pdfPath = path.join(root, 'docs', 'Stratejioyunu-Tanitim-Kisa.pdf');

const md = fs.readFileSync(mdPath, 'utf8');

function linkify(text) {
  return text.replace(
    /(https?:\/\/[^\s<,)]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>',
  );
}

function mdToHtml(src) {
  const lines = src.split('\n');
  const out = [];
  let listType = null;
  const closeList = () => {
    if (listType === 'ul') out.push('</ul>');
    listType = null;
  };

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('# ')) {
      closeList();
      out.push(`<h1>${linkify(t.slice(2))}</h1>`);
    } else if (t.startsWith('## ')) {
      closeList();
      out.push(`<h2>${linkify(t.slice(3))}</h2>`);
    } else if (t.startsWith('- ')) {
      if (!listType) { out.push('<ul>'); listType = 'ul'; }
      out.push(`<li>${linkify(t.slice(2).replace(/\*\*/g, ''))}</li>`);
    } else if (t === '---') {
      closeList();
      out.push('<hr />');
    } else if (!t) {
      closeList();
    } else if (t.startsWith('|') && !t.includes('---')) {
      closeList();
      const cells = t.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        out.push(`<p><strong>${cells[0]}</strong> ${linkify(cells.slice(1).join(' '))}</p>`);
      }
    } else {
      closeList();
      out.push(`<p>${linkify(t.replace(/\*\*/g, ''))}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <title>Stratejioyunu — Kısa Tanıtım</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 640px; margin: 0 auto; padding: 2rem 1.25rem; line-height: 1.55; color: #1e293b; }
    h1 { color: #0f4c75; font-size: 1.75rem; margin-bottom: 0.25rem; }
    h2 { color: #1565a8; font-size: 1.15rem; margin-top: 1.5rem; }
    a { color: #2563eb; font-weight: 600; }
    ul { margin: 0.5rem 0 1rem 1.1rem; }
    li { margin: 0.3rem 0; }
    p { margin: 0.5rem 0; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.25rem 0; }
    .tag { display: inline-block; background: #0f172a; color: #7dd3fc; padding: 0.5rem 0.85rem; border-radius: 6px; margin: 1rem 0; font-size: 0.95rem; }
  </style>
</head>
<body>
  ${mdToHtml(md)}
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`HTML: ${htmlPath}`);

const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: 'load' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
});
await browser.close();
console.log(`PDF: ${pdfPath}`);
