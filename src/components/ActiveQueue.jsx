import { useCountdownProgress } from '../hooks/useCountdownProgress';

function QueueRow({ label, detail, remaining, queued }) {
  const { display, progress, active } = useCountdownProgress(queued ? '—' : remaining);

  return (
    <li className={`active-queue-row${queued ? ' is-queued' : ''}`}>
      <div className="active-queue-row-main">
        <span className="active-queue-label">{label}</span>
        {detail && <span className="active-queue-detail">{detail}</span>}
      </div>
      <span className="active-queue-timer">{queued ? 'Sırada' : display}</span>
      {!queued && active && (
        <div className="active-queue-progress" aria-hidden="true">
          <div className="active-queue-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </li>
  );
}

export default function ActiveQueue({ title, items, emptyText }) {
  if (!items?.length) {
    return (
      <section className="active-queue-panel active-queue-panel--empty">
        <h3 className="active-queue-title">{title}</h3>
        <p className="active-queue-empty">{emptyText}</p>
      </section>
    );
  }

  return (
    <section className="active-queue-panel">
      <h3 className="active-queue-title">{title}</h3>
      <ul className="active-queue-list">
        {items.map((item) => (
          <QueueRow
            key={`${item.label}-${item.detail}`}
            label={item.label}
            detail={item.detail}
            remaining={item.remaining}
            queued={item.queued}
          />
        ))}
      </ul>
    </section>
  );
}
