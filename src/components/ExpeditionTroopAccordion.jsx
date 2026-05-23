import { useMemo, useState } from 'react';
import { airUnits, landUnits, seaUnits } from '../data/placeholder';

const LAND_IDS = new Set(landUnits.map((u) => u.id));
const AIR_IDS = new Set(airUnits.map((u) => u.id));
const SEA_IDS = new Set(seaUnits.map((u) => u.id));

const GROUP_META = [
  { key: 'land', label: 'Kara Kuvvetleri', match: (id) => LAND_IDS.has(id) },
  { key: 'air', label: 'Hava Kuvvetleri', match: (id) => AIR_IDS.has(id) },
  { key: 'sea', label: 'Deniz Kuvvetleri', match: (id) => SEA_IDS.has(id) },
];

function groupTroops(troops) {
  const buckets = { land: [], air: [], sea: [], other: [] };
  for (const troop of troops) {
    if (LAND_IDS.has(troop.id)) buckets.land.push(troop);
    else if (AIR_IDS.has(troop.id)) buckets.air.push(troop);
    else if (SEA_IDS.has(troop.id)) buckets.sea.push(troop);
    else buckets.other.push(troop);
  }
  if (buckets.other.length) buckets.land.push(...buckets.other);

  return GROUP_META
    .map(({ key, label }) => ({ key, label, troops: buckets[key] }))
    .filter((g) => g.troops.length > 0);
}

export default function ExpeditionTroopAccordion({ troops, renderTroopRow }) {
  const groups = useMemo(() => groupTroops(troops), [troops]);
  const [openKeys, setOpenKeys] = useState(() => new Set(['land']));

  const toggle = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!groups.length) {
    return <p className="map-command-modal__hint">Gönderilecek boşta birlik yok.</p>;
  }

  return (
    <div className="expedition-troop-accordion">
      {groups.map((group) => {
        const open = openKeys.has(group.key);
        return (
          <section key={group.key} className={`expedition-troop-accordion__group${open ? ' is-open' : ''}`}>
            <button
              type="button"
              className="expedition-troop-accordion__head"
              aria-expanded={open}
              onClick={() => toggle(group.key)}
            >
              <span className="expedition-troop-accordion__label">{group.label}</span>
              <span className="expedition-troop-accordion__count">{group.troops.length} birim</span>
              <span className="expedition-troop-accordion__chevron" aria-hidden="true">
                {open ? '▾' : '▸'}
              </span>
            </button>
            {open && (
              <div className="expedition-troop-accordion__body">
                {group.troops.map((t) => renderTroopRow(t))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
