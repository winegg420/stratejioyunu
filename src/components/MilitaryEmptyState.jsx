import { Link } from 'react-router-dom';

/**
 * Askeri temalı boş durum — panel, kuyruk, satır içi ve radar varyantları.
 */
export default function MilitaryEmptyState({
  variant = 'panel',
  tag,
  icon = '◈',
  title,
  hint,
  description,
  actionLabel,
  actionTo,
  onAction,
  as = 'div',
  className = '',
  role = 'status',
}) {
  const desc = hint ?? description;
  const Tag = as;
  const legacy =
    variant === 'queue'
      ? 'queue-empty-state'
      : variant === 'panel'
        ? 'empty-state'
        : variant === 'radar'
          ? 'expeditions-radar-empty'
          : '';

  const classes = [
    'military-empty',
    `military-empty--${variant}`,
    legacy,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const TitleTag = variant === 'panel' ? 'h3' : 'p';

  return (
    <Tag className={classes} role={role}>
      <div className="military-empty__scan" aria-hidden="true" />
      {(variant === 'panel' || variant === 'radar') && (
        <div className="military-empty__grid" aria-hidden="true" />
      )}
      {icon && (
        <span className="military-empty__icon empty-state-icon queue-empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {tag && <span className="military-empty__tag queue-empty-state__tag">{tag}</span>}
      {title && (
        <TitleTag className="military-empty__title empty-state-title queue-empty-state__title expeditions-radar-empty__title">
          {title}
        </TitleTag>
      )}
      {desc && (
        <p className="military-empty__hint empty-state-desc queue-empty-state__hint expeditions-radar-empty__hint">
          {desc}
        </p>
      )}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary btn-sm military-empty__action">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionTo && (
        <button type="button" className="btn btn-primary btn-sm military-empty__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </Tag>
  );
}
