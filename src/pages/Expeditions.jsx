import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import EmptyState from '../components/EmptyState';
import MilitaryEmptyState from '../components/MilitaryEmptyState';
import { formatSeconds, remainingFromEndsAt } from '../lib/gameUtils';
import MeydanBattlePanel from '../components/MeydanBattlePanel';
import OperationsMetropolisAlert from '../components/OperationsMetropolisAlert';
import CustomDropdown from '../components/CustomDropdown';
import { flushGameSave } from '../lib/gameActionSync';
import { STORE_EMPTY_ARRAY, useGameStore, getExpeditionOriginLabel, useActiveExpeditions } from '../stores/gameStore';
import { useNotificationStore } from '../stores/notificationStore';
import { ALLIANCE_OP_STATUS } from '../lib/allianceOperation';
import { diplomacy } from '../data/placeholder';
import { useLanguage } from '../context/LanguageContext';

export default function Expeditions() {
  const { t } = useLanguage();
  const [opTarget, setOpTarget] = useState('');
  const [syncDelayMinutes, setSyncDelayMinutes] = useState(0);
  const now = useGameStore((s) => s.now);
  const activeExpeditions = useActiveExpeditions();
  const mapCities = useGameStore((s) => s.mapCities);
  const playerCities = useGameStore((s) => s.playerCities);
  const pastExpeditions = useGameStore((s) => s.pastExpeditions);
  const gameHydrating = useGameStore((s) => s.gameHydrating);
  const refreshPastExpeditionsFromServer = useGameStore((s) => s.refreshPastExpeditionsFromServer);
  const allianceOperations = useGameStore((s) => s.allianceOperations ?? STORE_EMPTY_ARRAY);
  const recallExpedition = useGameStore((s) => s.recallExpedition);
  const createAllianceOperation = useGameStore((s) => s.createAllianceOperation);
  const approveAllianceOperation = useGameStore((s) => s.approveAllianceOperation);
  const requestMapTradeFocus = useGameStore((s) => s.requestMapTradeFocus);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const addToast = useNotificationStore((s) => s.addToast);
  const navigate = useNavigate();

  useEffect(() => {
    if (gameHydrating) return undefined;
    refreshPastExpeditionsFromServer().catch(() => {});
    return undefined;
  }, [gameHydrating, refreshPastExpeditionsFromServer]);

  const opTargets = useMemo(
    () => mapCities.filter((c) => c.status !== 'own' && c.status !== 'empty').map((c) => c.name),
    [mapCities],
  );
  const planningOps = allianceOperations.filter((o) => o.status === ALLIANCE_OP_STATUS.PLANNING);

  const focusTradeOnMap = (expeditionId) => {
    requestMapTradeFocus(expeditionId);
    navigate('/harita');
  };

  const openMapExpeditionLaunch = () => {
    navigate('/harita?mode=expedition');
  };

  const handlePlanAllianceOperation = async () => {
    if (!opTarget) {
      addToast('Önce hedef şehir seçin', 'warn');
      return;
    }
    const ok = createAllianceOperation({ targetName: opTarget });
    if (!ok) {
      addToast('Operasyon planlanamadı — hedef geçersiz', 'warn');
      return;
    }
    await flushGameSave({ cityId: activeCityId, savePlayerMeta: true });
  };

  const hasActive = activeExpeditions.length > 0;
  const hasPast = pastExpeditions.length > 0;

  return (
    <div className="page page--console expeditions-page">
      <LocalizedPageHeader
        className="expeditions-page-header"
        pageKey="expeditions"
        hideStatus
        action={(
          <>
            <button
              type="button"
              className="btn btn-hud-primary"
              onClick={openMapExpeditionLaunch}
            >
              {t('pages.expeditions.newExpedition')}
            </button>
            <Link to="/harita" className="btn btn-hud-secondary">
              {t('common.openMap')}
            </Link>
          </>
        )}
      />

      <OperationsMetropolisAlert />

      <section className="panel">
        <h3 className="panel-title">Aktif Operasyonlar</h3>
        {hasActive ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Çıkış</th>
                <th>Hedef</th>
                <th>Tür</th>
                <th>Birim</th>
                <th>Kalan</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {activeExpeditions.map((e) => {
                const origin = getExpeditionOriginLabel(e, playerCities);
                const isReturn = e.direction === 'returning' || e.recalled;
                return (
                <tr
                  key={e.id}
                  className={[
                    isReturn ? 'expedition-row-return' : '',
                    e.mode === 'trade' ? 'expedition-row-trade' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={e.mode === 'trade' ? () => focusTradeOnMap(e.id) : undefined}
                  role={e.mode === 'trade' ? 'button' : undefined}
                  tabIndex={e.mode === 'trade' ? 0 : undefined}
                  onKeyDown={
                    e.mode === 'trade'
                      ? (ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            focusTradeOnMap(e.id);
                          }
                        }
                      : undefined
                  }
                >
                  <td>{origin}</td>
                  <td>
                    {isReturn ? (
                      <span>
                        <strong className="expedition-return-tag">[GERİ DÖNÜŞ]</strong> {origin}
                      </span>
                    ) : (
                      <>
                        {e.target}
                        {e.mode === 'trade' && (
                          <span className="expedition-map-hint"> · haritada göster</span>
                        )}
                      </>
                    )}
                  </td>
                  <td>
                    {isReturn ? 'Geri Dönüş' : e.type}
                    {e.cargoHammadde > 0 && (
                      <span className="expedition-cargo-tag">
                        {' '}
                        · Kargo {e.cargoHammadde.toLocaleString('tr-TR')}
                      </span>
                    )}
                  </td>
                  <td>{e.troops}</td>
                  <td className="timer">{formatSeconds(remainingFromEndsAt(e.endsAt, now))}</td>
                  <td>
                    {e.direction === 'outgoing' ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          recallExpedition(e.id);
                        }}
                      >
                        Geri Çağır
                      </button>
                    ) : (
                      <span className="muted">Dönüş yolunda</span>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        ) : (
          <MilitaryEmptyState
            variant="radar"
            tag="[ RADAR AKTİF ]"
            icon="📡"
            title="Hareket halinde filo bulunamadı"
            hint="Haritadan hedef seçerek sefer başlatabilirsiniz."
            actionLabel="Haritayı Aç"
            actionTo="/harita"
          />
        )}
      </section>

      <MeydanBattlePanel />

      <section className="panel alliance-ops-panel">
        <h3 className="panel-title">{t('pages.expeditions.allianceTitle')}</h3>
        <p className="hint">
          {t('pages.expeditions.allianceDesc', { name: diplomacy.alliance.name })}
        </p>
        <label className="alliance-ops-field">
          <span>{t('pages.expeditions.table.target')}</span>
          <CustomDropdown
            className="expedition-launch-select"
            value={opTarget}
            onChange={setOpTarget}
            aria-label={t('pages.expeditions.allianceTargetAria')}
            options={[
              { value: '', label: t('common.select'), disabled: true },
              ...opTargets.map((name) => ({ value: name, label: name })),
            ]}
          />
        </label>
        <button
          type="button"
          className="btn btn-hud-primary alliance-ops-start-btn"
          disabled={!opTarget}
          onClick={handlePlanAllianceOperation}
        >
          {t('pages.expeditions.allianceOp')}
        </button>
        <div className="alliance-ops-timing">
          <label>
            <span>Geciktirme / Zaman Ayarı (dk)</span>
            <input
              type="number"
              className="input-qty"
              min={0}
              max={180}
              value={syncDelayMinutes}
              onChange={(e) => setSyncDelayMinutes(Math.max(0, Math.min(180, Number(e.target.value) || 0)))}
            />
          </label>
          <p className="hint">
            Tüm müttefik ordularının varışını senkronize etmek için ek gecikme eklenir.
          </p>
        </div>
        {planningOps.length > 0 ? (
          <ul className="alliance-ops-list">
            {planningOps.map((op) => (
              <li key={op.id} className="alliance-ops-card">
                <strong>{op.targetName}</strong>
                <span className="font-hud-data">
                  Lider: {op.leader} · Katılımcı: {(op.participants ?? []).filter((p) => p.approved).length}
                </span>
                {op.launchAt && (
                  <span className="timer">
                    Koordinasyon: {formatSeconds(remainingFromEndsAt(op.launchAt, now))}
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-hud-primary btn-sm"
                  onClick={() => approveAllianceOperation(op.id, {
                    troopQty: { infantry: 25 },
                    syncDelayMinutes,
                  })}
                >
                  [ ONAYLA · KATIL ]
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Planlanmış operasyon yok.</p>
        )}
      </section>

      <section className="panel">
        <h3 className="panel-title">Geçmiş Operasyonlar</h3>
        {hasPast ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Hedef</th>
                <th>Sonuç</th>
                <th>Ganimet</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {pastExpeditions.map((e) => (
                <tr key={e.id}>
                  <td>{e.target}</td>
                  <td>
                    <span className={e.result === 'Zafer' ? 'text-win' : 'text-loss'}>
                      {e.result}
                    </span>
                  </td>
                  <td>{e.loot}</td>
                  <td>{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            tag="[ ARŞİV BOŞ ]"
            icon="📜"
            title="Geçmiş operasyon kaydı yok"
            actionLabel="Haritaya Git"
            actionTo="/harita"
            description="Tamamlanan operasyonlar burada listelenir."
          />
        )}
      </section>
    </div>
  );
}
