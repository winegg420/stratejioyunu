import MilitaryEmptyState from './MilitaryEmptyState';

/**
 * Askeri temalı boş kuyruk / sefer durumu.
 */
export default function QueueEmptyState({
  tag = '[ KUYRUK BOŞ ]',
  title,
  hint,
  icon = '◈',
  as = 'li',
  actionLabel,
  actionTo,
}) {
  return (
    <MilitaryEmptyState
      variant="queue"
      as={as}
      tag={tag}
      title={title}
      hint={hint}
      icon={icon}
      actionLabel={actionLabel}
      actionTo={actionTo}
    />
  );
}
