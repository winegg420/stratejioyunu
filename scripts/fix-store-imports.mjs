import { readFileSync, writeFileSync } from 'node:fs';

const files = [
  'src/components/AiRadarPanel.jsx',
  'src/components/CityInflightSupply.jsx',
  'src/components/OperationsMetropolisAlert.jsx',
  'src/pages/AdminLog.jsx',
  'src/pages/Airbase.jsx',
  'src/pages/Barracks.jsx',
  'src/pages/BlackMarket.jsx',
  'src/pages/Diplomacy.jsx',
  'src/pages/Expeditions.jsx',
  'src/pages/Home.jsx',
  'src/pages/Profile.jsx',
  'src/pages/Reports.jsx',
  'src/pages/SeasonQuests.jsx',
];

for (const file of files) {
  let src = readFileSync(file, 'utf8');
  src = src.replace(
    /import \{ useGameStore \} from '\.\.\/stores\/gameStore';/,
    "import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';",
  );
  src = src.replace(
    /import \{([^}]*useGameStore[^}]*)\} from '\.\.\/stores\/gameStore';/,
    (m, inner) => {
      if (inner.includes('STORE_EMPTY_ARRAY')) return m;
      return `import { STORE_EMPTY_ARRAY, ${inner.trim()} } from '../stores/gameStore';`;
    },
  );
  writeFileSync(file, src);
  console.log('import fixed:', file);
}
