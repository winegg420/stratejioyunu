import { useCallback, useEffect, useMemo, useState } from 'react';
import { CITY_STATUS_COLORS } from './mapUtils';
import { getCityOwnerLabel } from './mapOwnership';
import { BOT_MANAGEMENT_LABEL, OWNER_UNCLAIMED_LABEL } from './mapDisplayLabels';
import { getMapCityDisplayName } from './mapCityDisplayName';
import { countryNameMatchesQuery } from '../lib/countryDisplayNames';
import { resolveIdeologyToggleLabel } from './mapUiLabels';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { useLanguage } from '../context/LanguageContext';
import { STORE_EMPTY_ARRAY, useGameStore } from '../stores/gameStore';

const EXPANDED_KEY = 'tactical-console-expanded';

function readExpanded() {
  try {
    const stored = localStorage.getItem(EXPANDED_KEY);
    if (stored === '1') return true;
    if (stored === '0') return false;
    return true;
  } catch {
    return true;
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
  ideologyView = false,
  onToggleIdeology,
}) {
  const { t } = useLanguage();
  const ideologyToggleLabel = resolveIdeologyToggleLabel(t);
  const [expanded, setExpanded] = useState(readExpanded);
  const [cityListFilter, setCityListFilter] = useState('');
  const playerName = getCurrentPlayerName();
  const playerCities = useGameStore((s) => s.playerCities ?? STORE_EMPTY_ARRAY);
  const cityOptions = searchCities.length > 0 ? searchCities : mapCities;

  const empireCountryNames = useMemo(() => {
    const names = new Set();
    for (const pc of playerCities) {
      if (pc?.name) names.add(pc.name);
      if (pc?.provinceName) names.add(pc.provinceName);
    }
    return names;
  }, [playerCities]);

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, expanded ? '1' : '0');
  }, [expanded]);

  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  const open = useCallback((e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
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
    return cityOptions.filter((c) => countryNameMatchesQuery(c.name, q));
  }, [cityOptions, cityListFilter]);

  const handlePickCity = useCallback((city) => {
    setCityPick(city.name);
    onCitySelect(city);
  }, [setCityPick, onCitySelect]);

  const flyToCityFromSearch = useCallback(() => {
    const q = cityListFilter.trim().toLowerCase();
    if (!q) return;
    const exact = cityOptions.find((c) => {
      const raw = String(c.name).toLowerCase();
      const display = getMapCityDisplayName(c.name).toLowerCase();
      return raw === q || display === q;
    });
    const partial = filteredCityList[0]
      ?? cityOptions.find((c) => countryNameMatchesQuery(c.name, q));
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
        <div className="tactical-console__tab-stack">
          <button
            type="button"
            className="tactical-console__tab"
            onClick={open}
            onMouseDown={(e) => e.stopPropagation()}
            aria-expanded={false}
            title={t('map.search.openPanel')}
          >
            <span className="tactical-console__tab-icon" aria-hidden="true">
              ⌕
            </span>
            <span className="tactical-console__tab-label">{t('map.search.tab')}</span>
            <span className="tactical-console__tab-hint" aria-hidden="true">
              ›
            </span>
          </button>
          {onToggleIdeology && (
            <button
              type="button"
              className={`tactical-console__tab tactical-console__tab--ideology${ideologyView ? ' active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleIdeology();
              }}
              aria-pressed={ideologyView}
              title={t('map.ideology.toggleHint')}
            >
              <span className="tactical-console__tab-icon" aria-hidden="true">◈</span>
              <span className="tactical-console__tab-label">{ideologyToggleLabel}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="tactical-console__mobile-scrim"
        onClick={close}
        aria-label="Arama panelini kapat"
      />
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
                const isEmpire = c.status === 'own'
                  || empireCountryNames.has(c.name)
                  || empireCountryNames.has(c.provinceName);
                return (
                  <li key={c.name} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={[
                        'map-city-list__item',
                        isActive && 'map-city-list__item--active',
                        isEmpire && 'map-city-list__item--empire',
                      ].filter(Boolean).join(' ')}
                      onClick={() => handlePickCity(c)}
                    >
                      {isEmpire && (
                        <span className="map-city-list__empire-badge" aria-hidden="true">★</span>
                      )}
                      <span className="map-city-list__item-label">{formatCityOption(c)}</span>
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
    </>
  );
}
