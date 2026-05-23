import { useIncomingThreat } from '../hooks/useIncomingThreat';

export default function IncomingThreatFlash() {
  const active = useIncomingThreat();
  if (!active) return null;

  return (
    <div className="incoming-threat-flash" role="alert" aria-live="assertive">
      <span className="incoming-threat-flash__text font-hud-data">INCOMING THREAT</span>
    </div>
  );
}
