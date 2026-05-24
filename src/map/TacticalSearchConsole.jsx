import { useCallback, useEffect, useMemo, useState } from 'react';
import { CITY_STATUS_COLORS } from './mapUtils';
import { getCityOwnerLabel } from './mapOwnership';
import { BOT_MANAGEMENT_LABEL, OWNER_UNCLAIMED_LABEL } from './mapDisplayLabels';
import { getMapCityDisplayName } from './mapCityDisplayName';
import { getCurrentPlayerName } from '../lib/playerIdentity';

const EXPANDED_KEY = 'tactical-console-expanded';

function readExpanded() {
  try {
    return localStorage.getItem(EXPANDED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function TacticalSearchConsole({
  searchCities = [],
  mapCities,
  cityPick,
  setCityPick,
  onCitySelect,
  onFlyToCity,
  search,
  setSearch,
  searchCoord,
  setSearchCoord,
  handleSearch,
  scanPulse,
  onResetFilter,
  hasActiveFilter = false,
  liveStats = null,
  forceExpanded = false,
}) {
  const [expanded, setExpanded] = useState(readExpanded);
  const [cityListFilter, setCityListFilter] = useState('');
  const playerName = getCurrentPlayerName();
  const cityOptions = searchCities.length > 0 ? searchCities : mapCities;

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, expanded ? '1' : '0');
  }, [expanded]);

  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  const open = useCallback(() => {
    setExpanded(true);
    window.dispatchEvent(new CustomEvent('map-layout-changed'));
  }, []);

  const close = useCallback((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setExpanded(false);
    window.dispatchEvent(new CustomEvent('map-layout-changed'));
  }, []);

  const formatCityOption = (c) => {
    const owner = getCityOwnerLabel(c, playerName);
    const suffix = c.status === 'bot'
      ? BOT_MANAGEMENT_LABEL
      : (owner || OWNER_UNCLAIMED_LABEL);
    return `${getMapCityDisplayName(c.name)} — ${suffix}`;
  };

  const filteredCityList = useMemo(() => {
    const q = cityListFilter.trim().toLowerCase();
    if (!q) return cityOptions;
    return cityOptions.filter((c) => {
      const name = getMapCityDisplayName(c.name).toLowerCase();
      return name.includes(q);
    });
  }, [cityOptions, cityListFilter, playerName]);

  const handlePickCity = useCallback((city) => {
    setCityPick(city.name);
    onCitySelect(city);
  }, [setCityPick, onCitySelect]);

  const flyToCityFromSearch = useCallback(() => {
    const q = cityListFilter.trim().toLowerCase();
    if (!q) return;
    const exact = cityOptions.find(
      (c) => getMapCityDisplayName(c.name).toLowerCase() === q,
    );
    const partial = filteredCityList[0]
      ?? cityOptions.find((c) => getMapCityDisplayName(c.name).toLowerCase().includes(q));
    const target = exact ?? partial;
    if (!target) return;
    setCityPick(target.name);
    if (onFlyToCity) {
      onFlyToCity(target);
    } else {
      onCitySelect(target);
    }
  }, [cityListFilter, cityOptions, filteredCityList, onFlyToCity, onCitySelect, setCityPick]);

  const handleCitySearchKeyDown = useCallback((e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    flyToCityFromSearch();
  }, [flyToCityFromSearch]);

  const handleShowAllCities = useCallback(() => {
    setCityPick('');
    setCityListFilter('');
  }, [setCityPick]);

  if (!expanded) {
    return (
      <div
        className="tactical-console tactical-console--slideout tactical-console--collapsed"
        role="search"
        aria-label="Oyuncu ve şehir arama paneli"
      >
        <button
          type="button"
          className="tactical-console__tab"
          onClick={open}
          aria-expanded={false}
          title="Arama panelini aç"
        >
          <span className="tactical-console__tab-icon" aria-hidden="true">
            ⌕
          </span>
          <span className="tactical-console__tab-label">SEARCH</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="tactical-console tactical-console--slideout tactical-console--expanded map-toolbar map-toolbar--cyber map-toolbar--console"
      role="search"
      aria-label="Oyuncu ve şehir arama paneli"
    >
      <div className="tactical-console__header map-console-header">
        <span className="map-console-header__bolt" aria-hidden="true">
          ◆
        </span>
        <span className="map-console-header__title">ARAMA</span>
        <button
          type="button"
          className="tactical-console__close"
          onClick={close}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Arama panelini kapat"
          title="Kapat"
        >
          ×
        </button>
      </div>

      <div className="tactical-console__body">
        <div className="map-city-search">
          <label className="map-city-search-label tactical-terminal-label" htmlFor="map-city-list-filter">
            Şehirler
          </label>
          <div className="tactical-terminal-field map-city-search__filter-wrap">
            <input
              id="map-city-list-filter"
              type="search"
              className="map-city-list__filter tactical-terminal-input"
              placeholder="Şehir adı ara… (Enter)"
              value={cityListFilter}
              onChange={(e) => setCityListFilter(e.target.value)}
              onKeyDown={handleCitySearchKeyDown}
              aria-label="Şehir adına göre filtrele"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            id="map-city-list-all"
            className={`map-city-list__all-btn${!cityPick ? ' map-city-list__all-btn--active' : ''}`}
            onClick={handleShowAllCities}
            aria-pressed={!cityPick}
          >
            Tüm şehirler ({cityOptions.length})
          </button>
          <ul className="map-city-list" role="listbox" aria-labelledby="map-city-list-all">
            {filteredCityList.length === 0 ? (
              <li className="map-city-list__empty" role="presentation">
                Şehir bulunamadı
              </li>
            ) : (
              filteredCityList.map((c) => {
                const isActive = cityPick === c.name;
                return (
                  <li key={c.name} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={[
                        'map-city-list__item',
                        isActive && 'map-city-list__item--active',
                      ].filter(Boolean).join(' ')}
                      onClick={() => handlePickCity(c)}
                    >
                      {formatCityOption(c)}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {onResetFilter && (
          <button
            type="button"
            className="tactical-console__reset-btn"
            onClick={onResetFilter}
            disabled={!hasActiveFilter}
            title="Filtreyi temizle"
          >
            Sıfırla
          </button>
        )}

        <form className="map-search map-search--console" onSubmit={handleSearch}>
          <div className="tactical-terminal-field">
            <input
              type="text"
              className="map-search-input tactical-terminal-input"
              placeholder="Şehir veya oyuncu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tactical-terminal-field">
            <input
              type="text"
              className="map-search-coord tactical-terminal-input"
              placeholder="Koordinat"
              value={searchCoord}
              onChange={(e) => setSearchCoord(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className={`btn map-search-btn map-search-btn--scan${scanPulse ? ' is-scanning' : ''}`}
          >
            Tara
          </button>
        </form>

        <div className="map-legend map-legend--cyber map-legend--compact">
          <span><i className="legend-dot legend-dot--attack" /> Saldırı</span>
          <span><i className="legend-dot legend-dot--spy" /> Casus</span>
          <span><i style={{ background: CITY_STATUS_COLORS.own }} /> Kendi</span>
          <span><i style={{ background: CITY_STATUS_COLORS.enemy }} /> Düşman</span>
        </div>

        {liveStats && (
          <p className="tactical-console__live-stats" role="status">
            Bot: <strong>{liveStats.botCities}</strong>
            {' · '}
            Oyuncu: <strong>{liveStats.playerCities}</strong>
            {' · '}
            Sefer: <strong>{liveStats.activeExpeditions}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
