import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const inputArg = process.argv.find((a) => a.startsWith('--input='));
const mdRel = inputArg ? inputArg.slice('--input='.length) : 'docs/Stratejioyunu-Kapsamli-Tanitim.md';
const mdPath = path.isAbsolute(mdRel) ? mdRel : path.join(root, mdRel);
const md = fs.readFileSync(mdPath, 'utf8');

function linkify(text) {
  return text.replace(
    /(https?:\/\/[^\s<,)]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  );
}

function mdToHtml(src) {
  const lines = src.split('\n');
  const out = [];
  let listType = null;

  const closeList = () => {
    if (listType === 'ol') out.push('</ol>');
    else if (listType === 'ul') out.push('</ul>');
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
    } else if (t.startsWith('### ')) {
      closeList();
      out.push(`<h3>${linkify(t.slice(4))}</h3>`);
    } else if (t.startsWith('#### ')) {
      closeList();
      out.push(`<h4>${linkify(t.slice(5))}</h4>`);
    } else if (t === '---') {
      closeList();
      out.push('<hr />');
    } else if (t.startsWith('> ')) {
      closeList();
      out.push(`<blockquote>${linkify(t.slice(2).replace(/\*\*/g, ''))}</blockquote>`);
    } else if (t.startsWith('|') && !t.includes('---')) {
      closeList();
      const cells = t.split('|').map((c) => c.trim()).filter(Boolean);
      out.push(`<p class="table-row">${linkify(cells.map((c) => c.replace(/\*\*/g, '')).join(' · '))}</p>`);
    } else if (t.match(/^\d+\.\s/)) {
      if (!listType) { out.push('<ol>'); listType = 'ol'; }
      out.push(`<li>${linkify(t.replace(/^\d+\.\s/, '').replace(/\*\*/g, ''))}</li>`);
    } else if (t.startsWith('- ')) {
      if (!listType) { out.push('<ul>'); listType = 'ul'; }
      out.push(`<li>${linkify(t.slice(2).replace(/\*\*/g, ''))}</li>`);
    } else if (!t) {
      closeList();
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
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Stratejioyunu — Tanıtım</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 820px; margin: 0 auto; padding: 2rem 1.5rem; line-height: 1.6; color: #1a1a2e; background: #f8fafc; }
    h1 { color: #0a3d5c; border-bottom: 3px solid #00a8cc; padding-bottom: 0.5rem; }
    h2 { color: #0d4a6e; margin-top: 2rem; }
    h3 { color: #1565a8; }
    h4 { color: #1e6fa8; font-size: 1.05rem; margin-top: 1.25rem; }
    a { color: #0d6efd; font-weight: 600; }
    a:hover { text-decoration: underline; }
    blockquote { border-left: 4px solid #00a8cc; background: #e8f4fc; padding: 0.75rem 1rem; margin: 1rem 0; }
    .quick-links { background: #0a1628; color: #e8f4ff; padding: 1rem 1.25rem; border-radius: 8px; margin-bottom: 2rem; }
    .quick-links a { color: #6ee7ff; }
    .table-row { font-size: 0.95rem; }
    hr { border: none; border-top: 1px solid #cbd5e1; margin: 2rem 0; }
    ul, ol { margin: 0.5rem 0 1rem 1.25rem; }
    li { margin: 0.35rem 0; }
    p { margin: 0.6rem 0; }
    @media print {
      body { background: #fff; max-width: 100%; }
      h2, h3 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="quick-links">
    <strong>Hızlı bağlantılar</strong><br />
    <a href="https://stratejioyunu.vercel.app" target="_blank" rel="noopener">Canlı oyun — stratejioyunu.vercel.app</a><br />
    <a href="https://github.com/winegg420/stratejioyunu" target="_blank" rel="noopener">GitHub kaynak kodu</a>
  </div>
  ${mdToHtml(md)}
</body>
</html>`;

const outArg = process.argv.find((a) => a.startsWith('--html='));
const outPath = outArg
  ? (path.isAbsolute(outArg.slice(7)) ? outArg.slice(7) : path.join(root, outArg.slice(7)))
  : path.join(root, 'docs', 'Stratejioyunu-Kapsamli-Tanitim.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`HTML oluşturuldu: ${outPath}`);
