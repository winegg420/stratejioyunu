import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import './styles/hud-shell.css';
import './styles/hud-revisions.css';
import './styles/hud-radical.css';
import './styles/hud-mobile-fix.css';
import './styles/building-visuals.css';
import './styles/hud-military-cards.css';
import './styles/hud-final.css';
import './styles/hud-package-ab.css';
import './styles/content-info-modal.css';
import './styles/intel-page.css';
import './styles/military-empty-states.css';
import './styles/global-briefing.css';
import './styles/state-mail.css';
import './styles/crisis.css';
import App from './App.jsx';

if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      registration?.update();
      window.setInterval(() => registration?.update(), 60 * 60 * 1000);
    },
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent('pwa-need-refresh'));
    },
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
