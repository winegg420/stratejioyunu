import { createRoot } from 'react-dom/client';
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
import './styles/military-production-ui.css';
import './styles/unit-military-icons.css';
import './styles/budget-spend-float.css';
import './styles/custom-dropdown.css';
import './styles/access-denied-overlay.css';
import './styles/hud-modal-close.css';
import './styles/sidebar-active.css';
import './styles/operational-flow.css';
import './styles/ui-ux-revisions.css';
import './styles/city-management-ui.css';
import './styles/logistics-trade-ui.css';
import './styles/map-war-ui.css';
import './styles/map-error-boundary.css';
import './styles/c4isr-global-standard.css';
import './styles/layout-system.css';
import './styles/visual-comfort.css';
import './styles/theme-global.css';
import './styles/theme-overrides-final.css';
import './styles/theme-surfaces-unified.css';
import './styles/theme-pages-complete.css';
import './styles/layout-bar-terminal-fix.css';
import './styles/premium-diamonds.css';
import './styles/resource-bar-grid-final.css';
import './styles/resource-bar-five-grid.css';
import './styles/global-ui-ux-revision.css';
import App from './App.jsx';
import { purgeStaleDevTestFlags } from './lib/devTestMode';
purgeStaleDevTestFlags();

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

createRoot(rootEl).render(<App />);
