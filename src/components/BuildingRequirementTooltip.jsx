import { useId } from 'react';
import { useActiveCity } from '../stores/gameStore';
import {
  BUILDING_LABELS,
  formatPrerequisiteList,
  getBuildingPrerequisites,
  getUnmetPrerequisites,
} from '../lib/buildingUtils';

export default function BuildingRequirementTooltip({ building, children }) {
  const city = useActiveCity();
  const tooltipId = useId();
  const isUnbuilt = (building.level ?? 0) < 1;
  const prerequisites = getBuildingPrerequisites(building.id);
  const unmet = getUnmetPrerequisites(city, building.id);
  const showTooltip = isUnbuilt && prerequisites.length > 0;

  if (!showTooltip) return children;

  const requirementText = unmet.length
    ? formatPrerequisiteList(unmet)
    : 'Ön koşullar sağlandı — inşaata hazır';

  return (
    <div className="building-req-tooltip-wrap">
      {children}
      <div
        id={tooltipId}
        role="tooltip"
        className="building-req-tooltip"
      >
        <span className="building-req-tooltip-title">Gereksinimler</span>
        <ul className="building-req-tooltip-list">
          {prerequisites.map((req) => {
            const met = !unmet.some((u) => u.id === req.id);
            const label = BUILDING_LABELS[req.id] ?? req.id;
            return (
              <li key={req.id} className={met ? 'is-met' : 'is-unmet'}>
                <span className="building-req-icon" aria-hidden="true">
                  {met ? '✓' : '○'}
                </span>
                {label} Sv.{req.level}
              </li>
            );
          })}
        </ul>
        <p className="building-req-tooltip-summary">{requirementText}</p>
      </div>
    </div>
  );
}
