import { useId } from 'react';
import {
  KBRN_RESEARCH_CENTER_UNLOCK,
  getResearchCenterLevel,
} from '../lib/kbrnResearch';
import { ADVANCED_RESEARCH_CATEGORY } from '../data/researchCatalog';
import { RESEARCH_PREREQUISITES } from '../data/contentEncyclopedia';
import { BUILDING_LABELS } from '../lib/buildingUtils';

function buildRequirementLines(item, city, kbrnBranchLocked) {
  const lines = [];
  if (item.category === ADVANCED_RESEARCH_CATEGORY && kbrnBranchLocked) {
    const rcLevel = getResearchCenterLevel(city);
    const reqs = RESEARCH_PREREQUISITES[item.id] ?? [
      { label: 'Ar-Ge Merkezi', level: KBRN_RESEARCH_CENTER_UNLOCK },
    ];
    reqs.forEach((r) => {
      lines.push({
        met: rcLevel >= r.level,
        text: `${r.label ?? BUILDING_LABELS.research} Sv.${r.level}+ (mevcut Sv.${rcLevel})`,
      });
    });
  }
  return lines;
}

export default function ResearchRequirementTooltip({ item, city, kbrnBranchLocked, children }) {
  const tooltipId = useId();
  const lines = buildRequirementLines(item, city, kbrnBranchLocked);
  const show = lines.length > 0;

  if (!show) return children;

  const allMet = lines.every((l) => l.met);

  return (
    <div className="research-req-tooltip-wrap">
      {children}
      <div
        id={tooltipId}
        role="tooltip"
        className="research-req-tooltip"
      >
        <span className="research-req-tooltip__title">[ GEREKSİNİMLER ]</span>
        <ul className="research-req-tooltip__list">
          {lines.map((line, i) => (
            <li key={i} className={line.met ? 'is-met' : 'is-unmet'}>
              <span className="research-req-tooltip__icon" aria-hidden="true">
                {line.met ? '✓' : '○'}
              </span>
              {line.text}
            </li>
          ))}
        </ul>
        <p className="research-req-tooltip__summary">
          {allMet ? 'Koşullar sağlandı — araştırma açık' : 'Ön koşullar tamamlanmalı'}
        </p>
      </div>
    </div>
  );
}
