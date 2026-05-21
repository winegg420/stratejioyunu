import { useCallback, useEffect, useRef, useState } from 'react';
import { CITY_STATUS_COLORS } from './mapUtils';
import { getCityOwnerLabel } from './mapOwnership';
import { getCurrentPlayerName } from '../lib/playerIdentity';

const POS_KEY = 'tactical-console-pos';
const MIN_KEY = 'tactical-console-min';

function readStoredPos() {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return { x: 12, y: 12 };
    const p = JSON.parse(raw);
    if (Number.isFinite(p.x) && Number.isFinite(p.y)) return p;
  } catch {
    /* ignore */
  }
  return { x: 12, y: 12 };
}

export default function TacticalSearchConsole({
  mapCities,
  cityPick,
  setCityPick,
  onCitySelect,
  search,
  setSearch,
  searchCoord,
  setSearchCoord,
  handleSearch,
  scanPulse,
  onResetFilter,
  hasActiveFilter = false,
}) {
  const [pos, setPos] = useState(readStoredPos);
  const [minimized, setMinimized] = useState(() => localStorage.getItem(MIN_KEY) === '1');
  const dragRef = useRef(null);
  const playerName = getCurrentPlayerName();

  useEffect(() => {
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  }, [pos]);

  useEffect(() => {
    localStorage.setItem(MIN_KEY, minimized ? '1' : '0');
  }, [minimized]);

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    const target = e.currentTarget;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    };
    target.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [pos.x, pos.y]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: Math.max(4, dragRef.current.originX + dx),
      y: Math.max(4, dragRef.current.originY + dy),
    });
  }, []);

  const onPointerUp = useCallback((e) => {
    if (dragRef.current) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  }, []);

  const formatCityOption = (c) => {
    const owner = getCityOwnerLabel(c, playerName);
    const suffix = c.status === 'bot' ? 'BOT' : (owner && owner !== 'Boş' ? owner : 'Boş');
    return `${c.name} — ${suffix}`;
  };

  return (
    <div
      className={[
        'map-toolbar',
        'map-toolbar--cyber',
        'map-toolbar--console',
        'tactical-console',
        minimized && 'tactical-console--minimized',
        dragRef.current && 'tactical-console--dragging',
      ].filter(Boolean).join(' ')}
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        className="tactical-console__header map-console-header"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="toolbar"
        aria-label="Taktik arama konsolu — sürüklemek için başlığı tutun"
      >
        <span className="map-console-header__bolt" aria-hidden="true">
          ◆ ◆
        </span>
        <span className="map-console-header__title">[ TACTICAL SEARCH CONSOLE ]</span>
        <span className="tactical-console__drag-hint" aria-hidden="true">
          ⠿
        </span>
        <div className="tactical-console__actions">
          <button
            type="button"
            className="tactical-console__btn"
            onClick={() => setMinimized((v) => !v)}
            aria-expanded={!minimized}
            title={minimized ? 'Genişlet' : 'Küçült'}
          >
            {minimized ? '[ + ]' : '[ − ]'}
          </button>
        </div>
        <span className="map-console-header__bolt" aria-hidden="true">
          ◆ ◆
        </span>
      </div>

      {!minimized && (
        <>
          <div className="map-city-search">
            <label className="map-city-search-label" htmlFor="map-city-select">
              Şehir Ara
            </label>
            <select
              id="map-city-select"
              className="map-city-select"
              value={cityPick}
              title={cityPick || 'Şehir seçin'}
              onChange={(e) => {
                const name = e.target.value;
                setCityPick(name);
                const city = mapCities.find((c) => c.name === name);
                if (city) onCitySelect(city);
              }}
            >
              <option value="">Şehir seçin...</option>
              {mapCities.map((c) => {
                const label = formatCityOption(c);
                return (
                  <option key={c.name} value={c.name} title={label}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
          {onResetFilter && (
            <button
              type="button"
              className="tactical-console__reset-btn"
              onClick={onResetFilter}
              disabled={!hasActiveFilter}
              title="Şehir filtresini temizle ve Türkiye genel görünümüne dön"
            >
              [ RESET / FİLTREYİ TEMİZLE ]
            </button>
          )}
          <form className="map-search map-search--console" onSubmit={handleSearch}>
            <input
              type="text"
              className="map-search-input"
              placeholder="Şehir veya oyuncu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="text"
              className="map-search-coord"
              placeholder="Koordinat: 38.42, 27.14"
              value={searchCoord}
              onChange={(e) => setSearchCoord(e.target.value)}
            />
            <button
              type="submit"
              className={`btn map-search-btn map-search-btn--scan${scanPulse ? ' is-scanning' : ''}`}
            >
              [ TARAMA BAŞLAT ]
            </button>
          </form>
          <div className="map-legend map-legend--cyber">
            <span><i className="legend-dot legend-dot--attack" /> Saldırı rotası</span>
            <span><i className="legend-dot legend-dot--spy" /> Casus rotası</span>
            <span><i className="legend-dot legend-dot--return" /> Geri dönüş</span>
            <span><i style={{ background: CITY_STATUS_COLORS.own }} /> Kendi</span>
            <span><i style={{ background: CITY_STATUS_COLORS.bot }} /> Bot üssü</span>
            <span><i style={{ background: CITY_STATUS_COLORS.enemy }} /> Düşman / Boş</span>
          </div>
        </>
      )}
    </div>
  );
}
