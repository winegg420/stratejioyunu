import { getDevTestModeBannerText } from '../lib/devTestMode';
import { useGameStore } from '../stores/gameStore';

export default function DevTestModeBanner() {
  const devTestModeActive = useGameStore((s) => s.devTestModeActive);
  if (!devTestModeActive) return null;

  return (
    <div className="dev-test-mode-banner" role="status" aria-live="polite">
      {getDevTestModeBannerText()}
    </div>
  );
}
