import { getDevTestModeBannerText, isDevTestMode } from '../lib/devTestMode';

export default function DevTestModeBanner() {
  if (!isDevTestMode()) return null;

  return (
    <div className="dev-test-mode-banner" role="status" aria-live="polite">
      {getDevTestModeBannerText()}
    </div>
  );
}
