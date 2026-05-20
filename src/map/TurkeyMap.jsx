import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CityDetailPanel from './CityDetailPanel';
import CityMarkers from './CityMarkers';
import MapAnimatedLayers from './MapAnimatedLayers';
import FogOfWarLayer from './FogOfWarLayer';
import MapHudControls from './MapHudControls';
import MapFocusCrosshair from './MapFocusCrosshair';
import ActiveCityMapFocus from './ActiveCityMapFocus';
import ActiveCityRangeLayer from './ActiveCityRangeLayer';
import MapBoundsReporter from './MapBoundsReporter';
import MapMaxBounds from './MapMaxBounds';
import MapMiniMap from './MapMiniMap';
import { TURKEY_MAX_BOUNDS } from './turkeyBounds';
import { CARTO_ATTRIBUTION, CARTO_DARK_MATTER_URL } from './cyberMapConfig';
import {
  CITY_STATUS_COLORS,
  getProvinceStyle,
  getHoverStyle,
} from './mapUtils';
import CityTerritoryLayer from './CityTerritoryLayer';
import { getCurrentPlayerName } from '../lib/playerIdentity';
import { useGameStore, useUnderAttack } from '../stores/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';

const TURKEY_CENTER = [39.0, 35.0];
const TURKEY_ZOOM = 6;

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [map, bounds]);
  return null;
}

function FlyToCity({ lat, lng, zoom = 9 }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], zoom, { animate: true, duration: 1.5, easeLinearity: 0.25 });
    }
  }, [map, lat, lng, zoom]);
  return null;
}

function MapInteractionController({ interactionLocked }) {
  const map = useMap();

  useEffect(() => {
    if (interactionLocked) {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.disable();
    } else {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    }
  }, [map, interactionLocked]);

  return null;
}

function HudBridge() {
  return <MapHudControls />;
}

export default function TurkeyMap() {
  const [mapReady, setMapReady] = useState(false);
  const mapCities = useGameStore((s) => s.mapCities);
  const expeditions = useGameStore((s) => s.expeditions);
  const mapFocusRequest = useGameStore((s) => s.mapFocusRequest);
  const clearMapFocusRequest = useGameStore((s) => s.clearMapFocusRequest);
  const reports = useGameStore((s) => s.reports);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const incomingAttacks = useGameStore((s) => s.incomingAttacks);
  const underAttack = useUnderAttack();
  const isMobile = useIsMobile();
  const [mapLocked, setMapLocked] = useState(true);
  const [provinces, setProvinces] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [search, setSearch] = useState('');
  const [searchCoord, setSearchCoord] = useState('');
  const provinceLayerRef = useRef(null);
  const [fitBounds, setFitBounds] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [cityPick, setCityPick] = useState('');
  const [viewport, setViewport] = useState(null);
  const setViewportStable = useCallback((next) => {
    setViewport((prev) => {
      if (!prev || !next) return next;
      const pb = prev.bounds;
      const nb = next.bounds;
      const pc = prev.center;
      const nc = next.center;
      if (
        prev.zoom === next.zoom
        && pc.lat === nc.lat
        && pc.lng === nc.lng
        && pb.getNorth() === nb.getNorth()
        && pb.getSouth() === nb.getSouth()
        && pb.getEast() === nb.getEast()
        && pb.getWest() === nb.getWest()
      ) {
        return prev;
      }
      return next;
    });
  }, []);
  const [hudCollapsed, setHudCollapsed] = useState(false);
  const [miniMapCollapsed, setMiniMapCollapsed] = useState(false);

  const interactionLocked = isMobile ? mapLocked : true;

  const activePlayerCity = useMemo(
    () => playerCities.find((c) => c.id === activeCityId) ?? playerCities[0],
    [playerCities, activeCityId],
  );

  const activeLat = activePlayerCity?.lat;
  const activeLng = activePlayerCity?.lng;

  const activeMapCity = useMemo(() => {
    if (!activePlayerCity) return null;
    return (
      mapCities.find((c) => c.name === activePlayerCity.name)
      ?? {
        name: activePlayerCity.name,
        lat: activePlayerCity.lat,
        lng: activePlayerCity.lng,
        status: 'own',
      }
    );
  }, [activePlayerCity, mapCities]);

  const playerName = getCurrentPlayerName();

  useEffect(() => {
    setMapReady(true);
    return () => setMapReady(false);
  }, []);

  useEffect(() => {
    if (!mapFocusRequest) return;
    const originPc = playerCities.find((p) => p.id === mapFocusRequest.originCityId);
    const home = mapCities.find((c) => c.name === originPc?.name);
    const target = mapCities.find((c) => c.name === mapFocusRequest.targetName);
    if (home && target) {
      const bounds = L.latLngBounds(
        [home.lat, home.lng],
        [target.lat, target.lng],
      );
      setFitBounds(bounds);
      setFlyTarget(null);
    }
    clearMapFocusRequest();
  }, [mapFocusRequest, playerCities, mapCities, clearMapFocusRequest]);

  useEffect(() => {
    fetch('/geo/provinces.json')
      .then((r) => r.json())
      .then(setProvinces)
      .catch(console.error);
  }, []);

  const onProvinceClick = useCallback((feature, layer) => {
    const name = feature.properties.shapeName;
    layer.on('click', () => {
      setSelectedProvince({ name });
      setFitBounds(layer.getBounds());
    });
  }, []);

  const provinceStyle = useCallback(() => getProvinceStyle(), []);

  const onEachProvince = useCallback(
    (feature, layer) => {
      const name = feature.properties.shapeName;
      layer.bindTooltip(name, { sticky: true, className: 'map-tooltip map-tooltip--cyber' });
      onProvinceClick(feature, layer);
      layer.on('mouseover', () => layer.setStyle(getHoverStyle(getProvinceStyle())));
      layer.on('mouseout', () => layer.setStyle(getProvinceStyle()));
    },
    [onProvinceClick],
  );

  const clearProvinceFocus = () => {
    setSelectedProvince(null);
    setFitBounds(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    const coord = searchCoord.trim();
    if (coord) {
      const [lat, lng] = coord.split(',').map((n) => parseFloat(n.trim()));
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setFitBounds(L.latLngBounds([[lat, lng]]));
        const near = mapCities.find(
          (c) => Math.abs(c.lat - lat) < 1 && Math.abs(c.lng - lng) < 1,
        );
        setSelectedCity(near || { name: 'Koordinat', status: 'empty', lat, lng });
        return;
      }
    }
    const city = mapCities.find((c) => c.name.toLowerCase().includes(q));
    if (city) {
      setSelectedCity(city);
      setFitBounds(L.latLngBounds([[city.lat, city.lng]]));
    }
  };

  const filteredCities = search
    ? mapCities.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : mapCities;

  return (
    <div className={`map-page map-page--cyber ${mapLocked && isMobile ? 'map-interaction-locked' : 'map-interaction-unlocked'}`}>
      {isMobile && (
        <div className="map-mobile-controls map-mobile-controls--cyber">
          <button
            type="button"
            className={`btn map-lock-btn ${mapLocked ? 'active' : ''}`}
            onClick={() => setMapLocked((v) => !v)}
            aria-pressed={mapLocked}
          >
            {mapLocked ? '🔒 Harita Kilidi (Açık)' : '🔓 Sayfa Kaydırma'}
          </button>
          {!mapLocked && (
            <select
              className="map-city-select map-city-select--mobile"
              value={cityPick}
              onChange={(e) => {
                const name = e.target.value;
                setCityPick(name);
                const city = mapCities.find((c) => c.name === name);
                if (city) {
                  setFlyTarget({ lat: city.lat, lng: city.lng });
                  setSelectedCity(city);
                  setFitBounds(L.latLngBounds([[city.lat, city.lng]]));
                }
              }}
            >
              <option value="">Şehir ara...</option>
              {mapCities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} — {c.owner || (c.status === 'bot' ? 'Bot' : 'Boş')}
                </option>
              ))}
            </select>
          )}
          <span className="map-lock-hint">
            {mapLocked
              ? 'İki parmakla yakınlaştırın · haritayı sürükleyin'
              : 'Şehir seçin veya aşağı kaydırın'}
          </span>
        </div>
      )}

      <MapToolbar
        mapCities={mapCities}
        cityPick={cityPick}
        setCityPick={setCityPick}
        onCitySelect={(city) => {
          setCityPick(city.name);
          setFlyTarget({ lat: city.lat, lng: city.lng });
          setSelectedCity(city);
          setFitBounds(L.latLngBounds([[city.lat, city.lng]]));
        }}
        search={search}
        setSearch={setSearch}
        searchCoord={searchCoord}
        setSearchCoord={setSearchCoord}
        handleSearch={handleSearch}
        selectedProvince={selectedProvince}
        clearProvinceFocus={clearProvinceFocus}
        isMobile={isMobile}
        mapLocked={mapLocked}
      />

      <div className="map-container map-container-wrap map-container-wrap--cyber">
        {!mapReady && (
          <div className="map-loading-placeholder" aria-live="polite">
            Harita yükleniyor…
          </div>
        )}
        {mapReady && (
        <MapContainer
          key="turkey-main-map"
          center={TURKEY_CENTER}
          zoom={TURKEY_ZOOM}
          minZoom={5}
          maxBounds={TURKEY_MAX_BOUNDS}
          maxBoundsViscosity={1.0}
          className="turkey-map turkey-map--cyber"
          scrollWheelZoom={!isMobile}
          touchZoom
          dragging
          doubleClickZoom
          zoomControl={false}
        >
          <MapMaxBounds />
          {isMobile && <MapInteractionController interactionLocked={interactionLocked} />}
          <TileLayer attribution={CARTO_ATTRIBUTION} url={CARTO_DARK_MATTER_URL} />
          {provinces && (
            <GeoJSON
              key="provinces"
              ref={provinceLayerRef}
              data={provinces}
              style={provinceStyle}
              smoothFactor={1.5}
              onEachFeature={onEachProvince}
            />
          )}
          <CityTerritoryLayer
            mapCities={filteredCities}
            playerCities={playerCities}
            playerName={playerName}
          />
          <MapBoundsReporter onViewportChange={setViewportStable} />
          <FogOfWarLayer
            playerCities={playerCities}
            mapCities={mapCities}
            expeditions={expeditions}
            reports={reports}
          />
          <ActiveCityRangeLayer lat={activeLat} lng={activeLng} />
          <MapAnimatedLayers
            expeditions={expeditions}
            mapCities={mapCities}
            playerCities={playerCities}
          />
          <CityMarkers
            mapCities={filteredCities}
            playerCities={playerCities}
            activeCityId={activeCityId}
            underAttack={underAttack}
            incomingAttacks={incomingAttacks}
            onSelectCity={setSelectedCity}
          />
          <ActiveCityMapFocus lat={activeLat} lng={activeLng} activeCityId={activeCityId} />
          {fitBounds && <FitBounds bounds={fitBounds} />}
          {flyTarget && (
            <FlyToCity lat={flyTarget.lat} lng={flyTarget.lng} zoom={9} />
          )}
          {(!isMobile || !hudCollapsed) && <HudBridge />}
          <MapFocusCrosshair lat={activeLat} lng={activeLng} />
        </MapContainer>
        )}
        {isMobile && (
          <button
            type="button"
            className="map-collapse-toggle map-collapse-toggle--hud"
            onClick={() => setHudCollapsed((v) => !v)}
            aria-expanded={!hudCollapsed}
          >
            {hudCollapsed ? 'HUD Aç' : 'HUD Kapat'}
          </button>
        )}
        {isMobile && (
          <button
            type="button"
            className="map-collapse-toggle map-collapse-toggle--minimap"
            onClick={() => setMiniMapCollapsed((v) => !v)}
            aria-expanded={!miniMapCollapsed}
          >
            {miniMapCollapsed ? 'Mini Harita' : 'Mini Harita Kapat'}
          </button>
        )}
        <div className={`map-minimap-wrap${miniMapCollapsed && isMobile ? ' map-minimap-wrap--collapsed' : ''}`}>
          <MapMiniMap viewport={viewport} activeCity={activeMapCity} mapCities={mapCities} />
        </div>
        <CityDetailPanel city={selectedCity} onClose={() => setSelectedCity(null)} />
      </div>
    </div>
  );
}

function MapToolbar({
  mapCities,
  cityPick,
  setCityPick,
  onCitySelect,
  search,
  setSearch,
  searchCoord,
  setSearchCoord,
  handleSearch,
  selectedProvince,
  clearProvinceFocus,
  isMobile,
  mapLocked,
}) {
  if (isMobile && mapLocked) return null;

  return (
    <div className="map-toolbar map-toolbar--cyber">
      <div className="map-city-search">
        <label className="map-city-search-label" htmlFor="map-city-select">
          Şehir Ara
        </label>
        <select
          id="map-city-select"
          className="map-city-select"
          value={cityPick}
          onChange={(e) => {
            const name = e.target.value;
            setCityPick(name);
            const city = mapCities.find((c) => c.name === name);
            if (city) onCitySelect(city);
          }}
        >
          <option value="">Şehir seçin...</option>
          {mapCities.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} — {c.owner || (c.status === 'bot' ? 'Bot' : 'Boş')}
            </option>
          ))}
        </select>
      </div>
      <form className="map-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Şehir veya oyuncu ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Koordinat: 38.42, 27.14"
          value={searchCoord}
          onChange={(e) => setSearchCoord(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Ara
        </button>
      </form>
      <div className="map-legend map-legend--cyber">
        <span><i className="legend-dot legend-dot--attack" /> Saldırı rotası</span>
        <span><i className="legend-dot legend-dot--spy" /> Casus rotası</span>
        <span><i className="legend-dot legend-dot--return" /> Geri dönüş</span>
        <span><i style={{ background: CITY_STATUS_COLORS.own }} /> Kendi</span>
        <span><i style={{ background: CITY_STATUS_COLORS.enemy }} /> Düşman</span>
      </div>
      {selectedProvince && (
        <div className="map-province-bar">
          <span>{selectedProvince.name} — il sınırı</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={clearProvinceFocus}>
            Türkiye görünümü
          </button>
        </div>
      )}
    </div>
  );
}
