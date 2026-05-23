import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import './styles/global-hud-polish.css';
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
import './styles/progression.css';
import './styles/season-quests.css';
import './styles/cyber-command-ui.css';
import './styles/dashboard-command.css';
import './styles/diplomacy-command.css';
import './styles/expeditions-command.css';
import './styles/production-input.css';
import './styles/market-command.css';
import './styles/cyber-terminal.css';
import './styles/c4isr-ui.css';
import './styles/military-terminal-ui.css';
import './styles/hud-modal-close.css';
import './styles/sidebar-active.css';
import './styles/operational-flow.css';
import './styles/ui-ux-revisions.css';
import './styles/city-management-ui.css';
import './styles/logistics-trade-ui.css';
import './styles/map-war-ui.css';
import './styles/layout-scroll-fix.css';
import './styles/resource-bar-fix.css';
import App from './App.jsx';
import { disableDevTestModeLocal } from './lib/devTestMode';

disableDevTestModeLocal();

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

const rootEl = document.getElementById('root');

function showBootError(message) {
  if (!rootEl) return;
  rootEl.innerHTML = `
    <div class="app-error-fallback" role="alert">
      <h1>Oyun yüklenemedi</h1>
      <p>${message}</p>
      <button type="button" class="btn btn-primary" onclick="location.reload()">Sayfayı Yenile</button>
      <p class="hint"><a href="/giris">Giriş sayfasına git</a></p>
    </div>
  `;
}

window.addEventListener('error', (ev) => {
  console.error(ev.error ?? ev.message);
  showBootError(ev.error?.message ?? ev.message ?? 'Bilinmeyen hata');
});

window.addEventListener('unhandledrejection', (ev) => {
  console.error(ev.reason);
  const msg = ev.reason?.message ?? String(ev.reason ?? 'Promise hatası');
  showBootError(msg);
});

if (!rootEl) {
  throw new Error('#root bulunamadı');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
