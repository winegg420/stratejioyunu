import { useState } from 'react';

export default function IntelAccordion({
  title,
  icon = '◈',
  defaultOpen = false,
  alwaysOpen = false,
  badge,
  children,
}) {
  const [open, setOpen] = useState(alwaysOpen || defaultOpen);

  if (alwaysOpen) {
    return (
      <section className="intel-accordion intel-accordion--always-open">
        <div className="intel-accordion__head intel-accordion__head--static" aria-hidden="false">
          <span className="intel-accordion__icon" aria-hidden="true">
            {icon}
          </span>
          <span className="intel-accordion__title">{title}</span>
          {badge != null && badge !== '' && (
            <span className="intel-accordion__badge">{badge}</span>
          )}
        </div>
        <div className="intel-accordion__body">{children}</div>
      </section>
    );
  }

  return (
    <section className={`intel-accordion${open ? ' intel-accordion--open' : ''}`}>
      <button
        type="button"
        className="intel-accordion__head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="intel-accordion__icon" aria-hidden="true">
          {icon}
        </span>
        <span className="intel-accordion__title">{title}</span>
        {badge != null && badge !== '' && (
          <span className="intel-accordion__badge">{badge}</span>
        )}
        <span className="intel-accordion__chevron" aria-hidden="true">
          {open ? '▼' : '▶'}
        </span>
      </button>
      {open && <div className="intel-accordion__body">{children}</div>}
    </section>
  );
}
