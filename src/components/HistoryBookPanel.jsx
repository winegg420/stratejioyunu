import { useEffect, useMemo, useState } from 'react';
import CustomDropdown from './CustomDropdown';
import MilitaryEmptyState from './MilitaryEmptyState';
import { useGameStore } from '../stores/gameStore';
import {
  CHRONICLE_TYPE_LABELS,
  formatChronicleDate,
  formatSeasonLabel,
  getChroniclesForSeason,
  getCurrentSeasonId,
  isSeasonEnded,
  listSeasonIdsForArchive,
} from '../lib/historyBook';
import { fetchAvailableSeasonIds, fetchSeasonChroniclesFromServer } from '../lib/historyBookApi';
import '../styles/history-book.css';

export default function HistoryBookPanel() {
  const seasonChronicles = useGameStore((s) => s.seasonChronicles);
  const loadHistoryBookArchive = useGameStore((s) => s.loadHistoryBookArchive);

  const [theme, setTheme] = useState('scroll');
  const [selectedSeason, setSelectedSeason] = useState(
    seasonChronicles?.currentSeasonId ?? getCurrentSeasonId(),
  );
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('local');

  const seasonIds = useMemo(
    () => listSeasonIdsForArchive(seasonChronicles),
    [seasonChronicles],
  );

  useEffect(() => {
    if (!selectedSeason && seasonChronicles?.currentSeasonId) {
      setSelectedSeason(seasonChronicles.currentSeasonId);
    }
  }, [seasonChronicles?.currentSeasonId, selectedSeason]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = await fetchAvailableSeasonIds(seasonChronicles);
      if (cancelled) return;
      if (ids.length && !selectedSeason) setSelectedSeason(ids[0]);
    })();
    return () => { cancelled = true; };
  }, [seasonChronicles, selectedSeason]);

  useEffect(() => {
    if (!selectedSeason) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const local = useGameStore.getState().seasonChronicles;
      const result = await fetchSeasonChroniclesFromServer(selectedSeason, local);
      if (cancelled) return;
      if (result.state) {
        const prevKey = JSON.stringify(local?.archives?.[selectedSeason] ?? local?.entries ?? []);
        const nextKey = JSON.stringify(
          result.state.archives?.[selectedSeason] ?? result.state.entries ?? [],
        );
        if (prevKey !== nextKey) {
          loadHistoryBookArchive(result.state);
        }
      }
      setSource(result.source ?? 'local');
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [selectedSeason, loadHistoryBookArchive]);

  const entries = useMemo(
    () => getChroniclesForSeason(seasonChronicles, selectedSeason),
    [seasonChronicles, selectedSeason],
  );

  const ended = selectedSeason ? isSeasonEnded(selectedSeason) : false;
  const showEmpty = !loading && entries.length === 0;

  return (
    <section
      className={`panel history-book-panel${theme === 'terminal' ? ' history-book-panel--terminal' : ''}`}
    >
      <h3 className="panel-title">📜 Devlet Tarih Kitabı</h3>
      <p className="hint">
        Sezon boyunca otomatik derlenen savaş, rejim ve ihanet kronikleri — kronolojik arşiv.
      </p>

      <div className="history-book-toolbar">
        <CustomDropdown
          className="history-book-season-select"
          value={selectedSeason ?? ''}
          onChange={setSelectedSeason}
          aria-label="Sezon seç"
          options={seasonIds.length > 0
            ? seasonIds.map((id) => ({
              value: id,
              label: `${formatSeasonLabel(id)}${id === seasonChronicles?.currentSeasonId ? ' (aktif)' : ''}`,
            }))
            : [{ value: getCurrentSeasonId(), label: `${formatSeasonLabel(getCurrentSeasonId())} (aktif)` }]}
        />
        <span className="history-book-status">
          {loading ? 'Arşiv yükleniyor…' : (
            <>
              {ended ? 'Sezon kapandı · arşiv' : 'Canlı derleme'}
              {' · '}
              {source === 'live' ? 'sunucu' : source === 'demo' ? 'örnek' : 'yerel'}
            </>
          )}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm history-book-theme-toggle"
          onClick={() => setTheme((t) => (t === 'scroll' ? 'terminal' : 'scroll'))}
        >
          {theme === 'scroll' ? 'Siber terminal' : 'Parşömen'}
        </button>
      </div>

      <div className="history-book-scroll">
        {loading && entries.length === 0 ? (
          <MilitaryEmptyState
            variant="inline"
            tag="[ ARŞİV ]"
            icon="📜"
            title="Tarih kitabı yükleniyor…"
            hint="Sezon kayıtları sunucudan okunuyor."
          />
        ) : showEmpty ? (
          <div className="history-book-empty" role="status">
            <MilitaryEmptyState
              variant="inline"
              tag="[ ARŞİV BOŞ ]"
              icon="📜"
              title="Bu sezonda henüz kronik yok"
              hint="Büyük savaşlar, rejim değişimleri ve pakt ihanetleri tamamlandıkça otomatik olarak buraya yazılır."
            />
            <p className="history-book-empty__lead">
              Tarih kitabı boş. Sezon tamamlandığında olaylar burada kayıt altına alınır.
            </p>
            <p className="history-book-empty__hint">
              Saldırı seferi, rejim ilanı veya anlaşma ihlali gerçekleştirdiğinizde kayıtlar görünür.
            </p>
          </div>
        ) : (
          entries.map((entry) => (
            <article key={entry.id} className="history-book-entry">
              <div className="history-book-entry__meta">
                <span className={`history-book-entry__type history-book-entry__type--${entry.type}`}>
                  {CHRONICLE_TYPE_LABELS[entry.type] ?? entry.type}
                </span>
                <time dateTime={new Date(entry.at).toISOString()}>
                  {formatChronicleDate(entry.at)}
                </time>
              </div>
              <p className="history-book-entry__text">{entry.text}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
