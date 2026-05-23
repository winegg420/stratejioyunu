const PATH_DEFAULT = 'M10 0 H110 L120 10 V34 L110 44 H10 L0 34 V10 Z';
const PATH_COMPACT = 'M8 0 H72 L80 8 V28 L72 36 H8 L0 28 V8 Z';

export function getHudButtonStrokeConfig(btn) {
  if (btn.disabled && btn.classList.contains('profile-vip-btn')) {
    return { stroke: 'rgba(120, 132, 148, 0.75)', width: 1.2, compact: false };
  }
  if (btn.classList.contains('btn-max') || btn.classList.contains('btn-sm')) {
    return { stroke: 'rgba(74, 124, 89, 0.7)', width: 1.1, compact: true };
  }
  if (btn.classList.contains('btn-danger')) {
    return { stroke: 'rgba(255, 130, 110, 0.9)', width: 1.25, compact: false };
  }
  if (btn.classList.contains('btn-secondary')) {
    return { stroke: 'rgba(100, 140, 200, 0.75)', width: 1.2, compact: false };
  }
  return { stroke: 'rgba(120, 200, 255, 0.95)', width: 1.35, compact: false };
}

export default function HudButtonChrome({ compact = false, stroke, strokeWidth = 1.25 }) {
  const viewBox = compact ? '0 0 80 36' : '0 0 120 44';
  const d = compact ? PATH_COMPACT : PATH_DEFAULT;

  return (
    <svg
      className="btn-stroke-layer"
      viewBox={viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="btn-stroke-path"
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function mountHudButtonChrome(btn) {
  if (!btn?.classList?.contains('btn')) return;
  if (btn.classList.contains('btn-hud-loading')) {
    btn.querySelector(':scope > svg.btn-stroke-layer')?.remove();
    delete btn.dataset.hudStroke;
    return;
  }

  const cfg = getHudButtonStrokeConfig(btn);
  const compact = cfg.compact;
  const viewBox = compact ? '0 0 80 36' : '0 0 120 44';
  const d = compact ? PATH_COMPACT : PATH_DEFAULT;

  let svg = btn.querySelector(':scope > svg.btn-stroke-layer');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'btn-stroke-layer');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'btn-stroke-path');
    path.setAttribute('fill', 'none');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(path);
    btn.insertBefore(svg, btn.firstChild);
  }

  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('preserveAspectRatio', 'none');

  const path = svg.querySelector('.btn-stroke-path');
  path.setAttribute('d', d);
  path.setAttribute('stroke', cfg.stroke);
  path.setAttribute('stroke-width', String(cfg.width));

  btn.dataset.hudStroke = '1';
}
