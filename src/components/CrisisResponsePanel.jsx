import {
  CRISIS_LOYALTY_RESPONSE,
  formatCrisisLabel,
  getExpectedCrisisResponse,
} from '../lib/crisisEngine';
import { formatIdeologyLabel } from '../lib/ideologySystem';
import { useGameStore } from '../stores/gameStore';
import TerminalLogPanel from './TerminalLogPanel';

const RESPONSE_LABELS = {
  [CRISIS_LOYALTY_RESPONSE.socialist_aid]: 'Halka kaynak dağıt (800 nüfus · 500 hammadde)',
  [CRISIS_LOYALTY_RESPONSE.capitalist_fund]: 'Acil bütçe fonu (18.000 Bütçe)',
  [CRISIS_LOYALTY_RESPONSE.technocrat_shield]: 'Siber şebeke kalkanı (Siber Merkez Sv.1+ · 3000 enerji)',
  [CRISIS_LOYALTY_RESPONSE.nationalist_mobilize]: 'Genel seferberlik (120+ birlik hazır)',
};

export default function CrisisResponsePanel() {
  const activeCrisis = useGameStore((s) => s.activeCrisis);
  const playerIdeology = useGameStore((s) => s.playerIdeology);
  const respondToCrisis = useGameStore((s) => s.respondToCrisis);

  if (!activeCrisis?.active) return null;

  const expected = getExpectedCrisisResponse(playerIdeology);
  const label = RESPONSE_LABELS[expected];

  return (
    <TerminalLogPanel title="Küresel acil durum" tag="ACİL" className="terminal-log-panel--crisis">
    <section className="panel crisis-response-panel">
      <h3 className="panel-title crisis-response-panel__title">
        [ KÜRESEL ACİL DURUM ]
      </h3>
      <p className="crisis-response-panel__type">
        Aktif kriz: <strong>{formatCrisisLabel(activeCrisis.type)}</strong>
        {activeCrisis.regionName && (
          <>
            {' '}
            · <span>{activeCrisis.regionName}</span>
          </>
        )}
      </p>
      {playerIdeology && expected && label && (
        <>
          <p className="hint">
            Doktrin protokolü ({formatIdeologyLabel(playerIdeology)}): {label}
          </p>
          <button
            type="button"
            className="btn btn-danger crisis-response-panel__btn"
            disabled={activeCrisis.responded}
            onClick={() => respondToCrisis(expected)}
          >
            {activeCrisis.responded ? 'Müdahale kaydedildi' : 'Kriz müdahalesini uygula'}
          </button>
        </>
      )}
      {!playerIdeology && (
        <p className="hint">İdeoloji seçilmeden kriz müdahale protokolü uygulanamaz.</p>
      )}
    </section>
    </TerminalLogPanel>
  );
}
