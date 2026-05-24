import IntelListRow from '../components/IntelListRow';
import { useEndsAtCountdown } from '../hooks/useEndsAtCountdown';

export default function MapIntelFeedItem({ item }) {
  const { label, isComplete } = useEndsAtCountdown(item.endsAt);
  const detail = item.endsAt != null
    ? (isComplete ? item.etaDoneLabel : item.etaLabel?.replace('{{time}}', label) ?? label)
    : null;

  return (
    <IntelListRow seedKey={item.id} className="map-intel-feed__item">
      <span className={['map-intel-feed__tag', item.tagClass].filter(Boolean).join(' ')}>
        {item.tag}
      </span>
      <span className="map-intel-feed__text">
        {item.text}
        {detail ? (
          <em className="map-intel-feed__eta"> · {detail}</em>
        ) : null}
      </span>
    </IntelListRow>
  );
}
