import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const provinces = JSON.parse(readFileSync(join(root, 'public/geo/provinces.json'), 'utf8'));
const outDir = join(root, 'public/geo/districts');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const districtNames = {
  Adana: ['Seyhan', 'Yüreğir', 'Çukurova', 'Sarıçam', 'Ceyhan', 'Kozan', 'İmamoğlu', 'Karaisalı', 'Pozantı', 'Feke'],
  İstanbul: ['Kadıköy', 'Beşiktaş', 'Üsküdar', 'Fatih', 'Bakırköy', 'Şişli', 'Maltepe', 'Pendik', 'Kartal', 'Beyoğlu'],
  Ankara: ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Etimesgut', 'Sincan', 'Altındağ', 'Pursaklar', 'Gölbaşı', 'Polatlı'],
  İzmir: ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Çiğli', 'Bayraklı', 'Gaziemir', 'Menemen', 'Torbalı', 'Aliağa'],
};

function bbox(coords) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (c) => {
    if (typeof c[0] === 'number') {
      minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]);
      minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]);
    } else c.forEach(walk);
  };
  walk(coords);
  return [minX, minY, maxX, maxY];
}

function gridCells([minX, minY, maxX, maxY], count) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const dx = (maxX - minX) / cols;
  const dy = (maxY - minY) / rows;
  const cells = [];
  let i = 0;
  for (let r = 0; r < rows && i < count; r++) {
    for (let c = 0; c < cols && i < count; c++, i++) {
      const x1 = minX + c * dx;
      const y1 = minY + r * dy;
      const x2 = x1 + dx;
      const y2 = y1 + dy;
      cells.push([
        [x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1],
      ]);
    }
  }
  return cells;
}

for (const feature of provinces.features) {
  const name = feature.properties.shapeName;
  const iso = feature.properties.shapeISO;
  const names = districtNames[name] || Array.from({ length: 8 }, (_, i) => `${name} İlçe ${i + 1}`);
  const box = bbox(feature.geometry.coordinates);
  const cells = gridCells(box, names.length);
  const collection = {
    type: 'FeatureCollection',
    features: names.map((districtName, i) => ({
      type: 'Feature',
      properties: { name: districtName, province: name, provinceISO: iso },
      geometry: { type: 'Polygon', coordinates: [cells[i]] },
    })),
  };
  writeFileSync(join(outDir, `${iso}.json`), JSON.stringify(collection));
}

console.log(`Generated ${provinces.features.length} district files in public/geo/districts/`);
