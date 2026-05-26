import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './map-tactical.css';
import '../styles/map-layout-fix.css';
import CityDetailPanel from './CityDetailPanel';
import MapMiniMap from './MapMiniMap';
import { MAP_GEO } from './mapGeoConfig';
import { getProvinceStyle } from './mapUtils';
import TacticalSearchConsole from './TacticalSearchConsole';
import { countryNameMatchesQuery } from '../lib/countryDisplayNames';
import { resolveMapCityByName } from '../lib/mapCityResolve';
import MapTacticalCommandBar from './MapTacticalCommandBar';
import { resolveIdeologyToggleLabel } from './mapUiLabels';
import MapIntelSidebar from './MapIntelSidebar';
import MapStatusLegend from './MapStatusLegend';
import MapStatusBand from './MapStatusBand';
import TurkeyLeafletMap from './TurkeyLeafletMap';
import { normalizeMapCities } from './botCityUtils';
import { safeFilterMapCities, safeMapCities, safeRunMapOp } from '../lib/mapSafeUtils';
import { resolvePlayerCountryFocus } from '../lib/mapPlayerFocus';
import { useMountedRef } from '../hooks/useMountedRef';
import { enrichMapCityWithProvince } from './cityProvinceMatch';
import { resolveIntelTargetName } from '../lib/intelTargetResolve';
import {
  buildBotProvinceNameSet,
  buildOwnProvinceNameSet,
  buildProvinceStyleContext,
} from '../lib/botProvincePulse';
import { useMapFullscreen } from '../hooks/useMapFullscreen';
import { useProvinceMapHandlers } from './useProvinceMapHandlers';
import { useGameStore, useUnderAttack } from '../stores/gameStore';
import { useIsMobile } from '../hooks/useIsMobile';
import { releaseMapSessionLocks } from './mapRouteCleanup';
import { buildMapCitySearchList } from '../lib/mapCitySearchList';
import { fetchMapGeo } from './mapGeoLoader';
import {
  buildLastViewedFromCity,
  buildLastViewedFromProvince,
  buildLastViewedFromViewport,
  resolveMapCityFromLastViewed,
  resolveRestoreFlyTarget,
} from '../lib/mapLastViewedLocation';
import MapCoordTooltip from '../components/MapCoordTooltip';
import HudBackButton from '../components/HudBackButton';
import CustomDropdown from '../components/CustomDropdown';
import { useLanguage } from '../context/LanguageContext';
import { getMapCityDisplayName } from './mapCityDisplayName';

export default function TurkeyMap() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { theaterRef, isFullscreen, exitFullscreen, toggleFullscreen } = useMapFullscreen();

  const mapCitiesRaw = useGameStore((s) => s.mapCities);
  const mountedRef = useMountedRef();
  const mapCities = useMemo(
    () => safeMapCities(safeRunMapOp(() => normalizeMapCities(mapCitiesRaw), [])),
    [mapCitiesRaw],
  );
  const expeditions = useGameStore((s) => s.expeditions);
  const mapFocusRequest = useGameStore((s) => s.mapFocusRequest);
  const clearMapFocusRequest = useGameStore((s) => s.clearMapFocusRequest);
  const lastViewedLocation = useGameStore((s) => s.lastViewedLocation);
  const setLastViewedLocation = useGameStore((s) => s.setLastViewedLocation);
  const clearLastViewedLocation = useGameStore((s) => s.clearLastViewedLocation);
  const mapExpeditionLaunchRequest = useGameStore((s) => s.mapExpeditionLaunchRequest);
  const clearMapExpeditionLaunchRequest = useGameStore((s) => s.clearMapExpeditionLaunchRequest);
  const mapTargetPickRequest = useGameStore((s) => s.mapTargetPickRequest);
  const fulfillMapTargetPick = useGameStore((s) => s.fulfillMapTargetPick);
  const clearMapTargetPick = useGameStore((s) => s.clearMapTargetPick);
  const activeCityId = useGameStore((s) => s.activeCityId);
  const playerCities = useGameStore((s) => s.playerCities);
  const incomingAttacks = useGameStore((s) => s.incomingAttacks);
  const underAttack = useUnderAttack();
  const playerIdeology = useGameStore((s) => s.playerIdeology);
  const isMobile = useIsMobile();

  const [mapReady, setMapReady] = useState(false);
  const [mapHostSized, setMapHostSized] = useState(false);
  const mapHostRef = useRef(null);
  const [mapLocked, setMapLocked] = useState(true);
  const [provinces, setProvinces] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [search, setSearch] = useState('');
  const [searchCoord, setSearchCoord] = useState('');
  const [fitBounds, setFitBounds] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [cityPick, setCityPick] = useState('');
  const [viewport, setViewport] = useState(null);
  const [restoreViewport, setRestoreViewport] = useState(null);
  const fsViewportSnapshotRef = useRef(null);
  const [hoverCoord, setHoverCoord] = useState(null);
  const [hudCollapsed, setHudCollapsed] = useState(() => {
    try {
      return window.matchMedia('(max-width: 900px)').matches;
    } catch {
      return false;
    }
  });
  const [miniMapCollapsed, setMiniMapCollapsed] = useState(() => {
    try {
      return window.matchMedia('(max-width: 900px)').matches;
    } catch {
      return false;
    }
  });
  const [scanPulse, setScanPulse] = useState(false);
  const [ideologyView, setIdeologyView] = useState(false);
  const [activeHighlightCity, setActiveHighlightCity] = useState(null);
  const [hexPulses, setHexPulses] = useState([]);
  const [expeditionLaunchMode, setExpeditionLaunchMode] = useState(false);
  const [panelInitialActionMode, setPanelInitialActionMode] = useState(null);
  const [consoleForceExpanded, setConsoleForceExpanded] = useState(false);

  const [theaterPortalEl, setTheaterPortalEl] = useState(null);
  const [modalPortalEl, setModalPortalEl] = useState(null);
  const provinceLayerRef = useRef(null);
  const activeProvinceLayerRef = useRef(null);
  const botPulsePhaseRef = useRef(0);
  const hexPulseTimersRef = useRef([]);
  const mapViewRestoredRef = useRef(false);
  const pendingPanelCityRef = useRef(null);

  const handleMapClickPulse = useCallback((pulse) => {
    setHexPulses((prev) => [...prev, pulse].slice(-12));
    const timer = window.setTimeout(() => {
      setHexPulses((prev) => prev.filter((p) => p.id !== pulse.id));
    }, 520);
    hexPulseTimersRef.current.push(timer);
  }, []);

  useEffect(() => () => {
    hexPulseTimersRef.current.forEach((t) => window.clearTimeout(t));
    hexPulseTimersRef.current = [];
  }, []);
  const botProvinceNamesRef = useRef(new Set());
  const ownProvinceNamesRef = useRef(new Set());
  const provinceStyleContextRef = useRef(buildProvinceStyleContext([], []));

  /** Ana haritada sürükle-pan her zaman (mobilde sayfa kilidi yalnızca dış kaydırmayı etkiler) */
  const mapPanEnabled = true;

  const ensureMapBotProvinces = useGameStore((s) => s.ensureMapBotProvinces);

  useEffect(() => () => releaseMapSessionLocks(), []);

  const botProvinceNames = useMemo(
    () => buildBotProvinceNameSet(mapCities, playerCities, provinces),
    [mapCities, playerCities, provinces],
  );
  const ownProvinceNames = useMemo(
    () => buildOwnProvinceNameSet(mapCities, playerCities, provinces),
    [mapCities, playerCities, provinces],
  );
  botProvinceNamesRef.current = botProvinceNames;
  ownProvinceNamesRef.current = ownProvinceNames;
  provinceStyleContextRef.current = buildProvinceStyleContext(mapCities, playerCities);

  const activePlayerCity = useMemo(
    () => playerCities.find((c) => c.id === activeCityId) ?? playerCities[0],
    [playerCities, activeCityId],
  );

  const countryFocus = useMemo(
    () => resolvePlayerCountryFocus({
      activeCityId,
      playerCities,
      mapCities,
    }),
    [activeCityId, playerCities, mapCities],
  );
  const activeLat = countryFocus?.lat ?? activePlayerCity?.lat;
  const activeLng = countryFocus?.lng ?? activePlayerCity?.lng;

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

  const filteredCities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mapCities;
    return safeFilterMapCities(mapCities, (c) => countryNameMatchesQuery(c.name, q));
  }, [mapCities, search]);

  const hasMapFilter = useMemo(
    () => Boolean(
      search.trim()
      || searchCoord.trim()
      || cityPick
      || selectedCity
      || activeHighlightCity,
    ),
    [search, searchCoord, cityPick, selectedCity, activeHighlightCity],
  );

  const mapZoom = viewport?.zoom ?? 6;

  const searchCityList = useMemo(
    () => buildMapCitySearchList(mapCities, provinces, playerCities, lang),
    [mapCities, provinces, playerCities, lang],
  );

  const mapLiveStats = useMemo(() => safeRunMapOp(() => ({
    botCities: mapCities.filter((c) => c?.status === 'bot').length,
    playerCities: playerCities?.length ?? 0,
    activeExpeditions: (expeditions ?? []).filter((e) => e?.direction === 'outgoing').length,
  }), { botCities: 0, playerCities: 0, activeExpeditions: 0 }), [mapCities, playerCities, expeditions]);

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

  const persistMapView = useCallback((city, { panelOpen = true } = {}) => {
    const snapshot = buildLastViewedFromCity(city, viewport, { panelOpen });
    if (snapshot) setLastViewedLocation(snapshot);
  }, [viewport, setLastViewedLocation]);

  const persistViewportOnly = useCallback(() => {
    const snapshot = buildLastViewedFromViewport(viewport);
    if (snapshot) setLastViewedLocation(snapshot);
  }, [viewport, setLastViewedLocation]);

  const showCityDetailPanel = useCallback((cityOrHighlight, { initialActionMode = null } = {}) => {
    const enriched = enrichMapCityWithProvince(cityOrHighlight, playerCities);
    setActiveHighlightCity(enriched);
    setSelectedCity(enriched);
    setPanelInitialActionMode(initialActionMode);
    persistMapView(enriched);
    return enriched;
  }, [playerCities, persistMapView]);

  const openMapCityPanel = useCallback((cityOrHighlight, { initialActionMode = null, skipFly = false } = {}) => {
    const enriched = showCityDetailPanel(cityOrHighlight, { initialActionMode });
    if (!skipFly && enriched.lat != null && enriched.lng != null) {
      setFitBounds(null);
      setFlyTarget({
        lat: enriched.lat,
        lng: enriched.lng,
        zoom: MAP_GEO.countryFocusZoom,
        at: Date.now(),
      });
    }
    return enriched;
  }, [playerCities, showCityDetailPanel]);

  const resolveConsoleCity = useCallback((city) => {
    if (!city?.name) return city;
    return searchCityList.find((c) => c.name === city.name)
      ?? mapCities.find((c) => c.name === city.name)
      ?? city;
  }, [searchCityList, mapCities]);

  const focusCityOnMap = useCallback((city, { openPanel = false, initialActionMode = null } = {}) => {
    const enriched = enrichMapCityWithProvince(city, playerCities);
    if (openPanel) {
      pendingPanelCityRef.current = enriched;
      openMapCityPanel(enriched, { initialActionMode });
      return enriched;
    }
    setActiveHighlightCity(enriched);
    setSelectedCity(null);
    if (enriched.lat != null && enriched.lng != null) {
      setFitBounds(null);
      setFlyTarget({
        lat: enriched.lat,
        lng: enriched.lng,
        zoom: MAP_GEO.countryFocusZoom,
        at: Date.now(),
      });
    }
    persistMapView(enriched);
    return enriched;
  }, [playerCities, persistMapView, openMapCityPanel]);

  const flyToCityAndOpenPanel = useCallback((city, { initialActionMode = null } = {}) => {
    const resolved = resolveConsoleCity(city);
    setCityPick(resolved.name);
    const enriched = enrichMapCityWithProvince(resolved, playerCities);
    pendingPanelCityRef.current = enriched;

    if (expeditionLaunchMode) {
      const own = new Set(playerCities.map((c) => c.name));
      if (!own.has(enriched.name) && enriched.status !== 'empty') {
        setExpeditionLaunchMode(false);
        openMapCityPanel(enriched, { initialActionMode: initialActionMode ?? 'troops' });
        pendingPanelCityRef.current = null;
        return enriched;
      }
    }

    setActiveHighlightCity(enriched);
    setSelectedCity(enriched);
    setPanelInitialActionMode(initialActionMode);

    if (enriched.lat != null && enriched.lng != null) {
      setFitBounds(null);
      setFlyTarget({
        lat: enriched.lat,
        lng: enriched.lng,
        zoom: MAP_GEO.countryFocusZoom,
        at: Date.now(),
        openPanelAfter: true,
      });
    }
    persistMapView(enriched);
    return enriched;
  }, [
    playerCities,
    persistMapView,
    expeditionLaunchMode,
    openMapCityPanel,
    resolveConsoleCity,
  ]);

  const openCityDetail = useCallback(
    (city) => focusCityOnMap(city, { openPanel: true }),
    [focusCityOnMap],
  );

  const handleSelectCity = useCallback((city, { skipFly = false } = {}) => {
    const enriched = enrichMapCityWithProvince(city, playerCities);
    if (mapTargetPickRequest) {
      const own = new Set(playerCities.map((c) => c.name));
      if (enriched.status === 'own' || own.has(enriched.name)) {
        openMapCityPanel(enriched, { skipFly });
        return;
      }
      const pickTargets = mapCities.filter(
        (c) => !own.has(c.name) && (c.status === 'enemy' || c.status === 'bot' || c.owner),
      );
      fulfillMapTargetPick(resolveIntelTargetName(enriched.name, pickTargets));
      navigate(mapTargetPickRequest.returnPath ?? '/istihbarat');
      return;
    }
    if (expeditionLaunchMode) {
      const own = new Set(playerCities.map((c) => c.name));
      if (own.has(enriched.name) || enriched.status === 'empty') return;
      setExpeditionLaunchMode(false);
      openMapCityPanel(enriched, { initialActionMode: 'troops', skipFly });
      return;
    }
    openMapCityPanel(enriched, { skipFly });
  }, [
    mapTargetPickRequest,
    expeditionLaunchMode,
    playerCities,
    mapCities,
    fulfillMapTargetPick,
    navigate,
    openMapCityPanel,
  ]);

  const handleFlySettled = useCallback(() => {
    setFlyTarget(null);
    if (!viewport) return;
    setLastViewedLocation((prev) => {
      if (!prev) return buildLastViewedFromViewport(viewport);
      return {
        ...prev,
        zoom: viewport.zoom,
        centerLat: viewport.center.lat,
        centerLng: viewport.center.lng,
        viewedAt: Date.now(),
      };
    });
  }, [viewport, setLastViewedLocation]);

  const handleFlyCompleteOpenPanel = useCallback(() => {
    const city = pendingPanelCityRef.current;
    if (!city) return;
    pendingPanelCityRef.current = null;
    handleSelectCity(city, { skipFly: true });
  }, [handleSelectCity]);

  const handleMapFlyComplete = useCallback(() => {
    handleFlyCompleteOpenPanel();
  }, [handleFlyCompleteOpenPanel]);

  const handleProvinceView = useCallback((highlight) => {
    if (mapTargetPickRequest) return;
    const snapshot = buildLastViewedFromProvince({
      provinceName: highlight.provinceName ?? highlight.name,
      provinceCode: highlight.province,
      lat: highlight.lat,
      lng: highlight.lng,
      status: highlight.status ?? 'empty',
    });
    if (snapshot) setLastViewedLocation(snapshot);
    openMapCityPanel(highlight);
  }, [mapTargetPickRequest, openMapCityPanel, setLastViewedLocation]);

  const { onEachProvince } = useProvinceMapHandlers({
    mapCities,
    playerCities,
    mapTargetPickRequest,
    expeditionLaunchMode,
    fulfillMapTargetPick,
    navigate,
    handleSelectCity,
    openMapCityPanel,
    onProvinceView: handleProvinceView,
    setActiveHighlightCity,
    activeProvinceLayerRef,
    botProvinceNamesRef,
    ownProvinceNamesRef,
    provinceStyleContextRef,
  });

  const hoverRafRef = useRef(0);
  const pendingHoverRef = useRef(null);

  const handleCityHover = useCallback((payload) => {
    pendingHoverRef.current = payload;
    if (hoverRafRef.current) return;
    hoverRafRef.current = window.requestAnimationFrame(() => {
      hoverRafRef.current = 0;
      setHoverCoord(pendingHoverRef.current);
    });
  }, []);

  const handleCityHoverEnd = useCallback(() => {
    pendingHoverRef.current = null;
    if (hoverRafRef.current) {
      window.cancelAnimationFrame(hoverRafRef.current);
      hoverRafRef.current = 0;
    }
    setHoverCoord(null);
  }, []);

  useEffect(() => () => {
    if (hoverRafRef.current) window.cancelAnimationFrame(hoverRafRef.current);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setScanPulse(true);
    window.setTimeout(() => setScanPulse(false), 480);
    const q = search.trim().toLowerCase();
    const coord = searchCoord.trim();
    if (coord) {
      const [lat, lng] = coord.split(',').map((n) => parseFloat(n.trim()));
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const near = mapCities.find(
          (c) => Math.abs(c.lat - lat) < 1 && Math.abs(c.lng - lng) < 1,
        );
        if (near) {
          setCityPick(near.name);
          flyToCityAndOpenPanel(near);
        } else {
          setSelectedCity(null);
          setActiveHighlightCity({ name: 'Koordinat', status: 'empty', lat, lng });
          setFlyTarget({ lat, lng, at: Date.now() });
        }
        return;
      }
    }
    const pool = searchCityList.length ? searchCityList : mapCities;
    const city = resolveMapCityByName(pool, q)
      ?? pool.find((c) => countryNameMatchesQuery(c.name, q));
    if (city) {
      setCityPick(city.name);
      flyToCityAndOpenPanel(city);
    }
  }, [search, searchCoord, mapCities, searchCityList, flyToCityAndOpenPanel]);

  const handleWorldView = useCallback(() => {
    setSelectedCity(null);
    setActiveHighlightCity(null);
    setPanelInitialActionMode(null);
    pendingPanelCityRef.current = null;
    mapViewRestoredRef.current = true;
    setFitBounds(null);
    setFlyTarget(null);
    window.dispatchEvent(new Event('map-world-fit'));
    persistViewportOnly();
  }, [persistViewportOnly]);

  /** ÜSSE ODAKLAN — ana ülkeye (Main HQ), son görüntülenen bölgeye değil */
  const handleFocusBase = useCallback(() => {
    const target = resolvePlayerCountryFocus({ playerCities, mapCities, preferMainHq: true });
    if (!target) return;

    mapViewRestoredRef.current = true;
    setFitBounds(null);
    setFlyTarget({
      lat: target.lat,
      lng: target.lng,
      zoom: target.zoom ?? MAP_GEO.countryFocusZoom ?? 5,
      at: Date.now(),
    });

    const hqMapCity = resolveMapCityByName(mapCities, target.name);
    if (hqMapCity) {
      setLastViewedLocation(buildLastViewedFromCity(hqMapCity, viewport, { panelOpen: false }));
    }
  }, [playerCities, mapCities, viewport, setLastViewedLocation]);

  const clearMapFilters = useCallback(() => {
    setSearch('');
    setSearchCoord('');
    setCityPick('');
    setSelectedCity(null);
    setActiveHighlightCity(null);
    handleWorldView();
    clearLastViewedLocation();
    mapViewRestoredRef.current = true;
    pendingPanelCityRef.current = null;
    if (activeProvinceLayerRef.current) {
      activeProvinceLayerRef.current.setStyle(getProvinceStyle());
      activeProvinceLayerRef.current = null;
    }
  }, [clearLastViewedLocation, handleWorldView]);

  const handleCloseCityPanel = useCallback(() => {
    setSelectedCity(null);
    setActiveHighlightCity(null);
    setPanelInitialActionMode(null);
    pendingPanelCityRef.current = null;
    mapViewRestoredRef.current = true;
    persistViewportOnly();
    if (activeProvinceLayerRef.current) {
      activeProvinceLayerRef.current.setStyle(getProvinceStyle());
      activeProvinceLayerRef.current = null;
    }
  }, [persistViewportOnly]);

  const handleToggleIdeology = useCallback(() => {
    setIdeologyView((v) => {
      const next = !v;
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('map-layout-changed'));
      }, 0);
      return next;
    });
  }, []);

  const handleConsoleCitySelect = useCallback((city) => {
    flyToCityAndOpenPanel(city);
  }, [flyToCityAndOpenPanel]);

  useEffect(() => {
    setMapReady(true);
    return () => setMapReady(false);
  }, []);

  useEffect(() => {
    const el = mapHostRef.current;
    if (!el) return undefined;

    const check = () => {
      const ok = el.clientWidth >= 64 && el.clientHeight >= 64;
      setMapHostSized(ok);
      if (ok) window.dispatchEvent(new Event('map-layout-changed'));
    };

    check();
    const raf = requestAnimationFrame(check);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    ro?.observe(el);
    window.addEventListener('resize', check);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [mapReady]);

  useEffect(() => {
    if (!mapExpeditionLaunchRequest || !mapReady) return undefined;
    clearMapExpeditionLaunchRequest();
    setExpeditionLaunchMode(true);
    setConsoleForceExpanded(true);
    try {
      localStorage.setItem('tactical-console-expanded', '1');
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('map-layout-changed'));
    return undefined;
  }, [mapExpeditionLaunchRequest, mapReady, clearMapExpeditionLaunchRequest]);

  /** Mobil harita: kilidi açıkken sayfa kaymasını engelle */
  useEffect(() => {
    if (!isMobile) return undefined;
    if (mapLocked) {
      document.body.classList.add('map-scroll-locked');
    } else {
      document.body.classList.remove('map-scroll-locked');
    }
    return () => document.body.classList.remove('map-scroll-locked');
  }, [isMobile, mapLocked]);

  useEffect(() => {
    const ac = new AbortController();
    fetchMapGeo(ac.signal)
      .then((data) => {
        if (mountedRef.current) setProvinces(data);
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') console.error(err);
      });
    return () => ac.abort();
  }, [mountedRef]);

  useEffect(() => {
    if (!provinces) return;
    ensureMapBotProvinces(provinces);
  }, [provinces, ensureMapBotProvinces]);

  useEffect(() => {
    if (!mapFocusRequest) return undefined;
    mapViewRestoredRef.current = true;
    try {
      const originPc = playerCities.find((p) => p.id === mapFocusRequest.originCityId);
      const home = mapCities.find((c) => c.name === originPc?.name);
      const target = mapCities.find((c) => c.name === mapFocusRequest.targetName);
      if (home && target && mountedRef.current) {
        setFitBounds(L.latLngBounds([[home.lat, home.lng], [target.lat, target.lng]]));
        setFlyTarget(null);
        if (target) openCityDetail(target);
      }
    } catch (err) {
      console.warn('[MAP_FOCUS]', err);
    }
    clearMapFocusRequest();
    return undefined;
  }, [mapFocusRequest, playerCities, mapCities, clearMapFocusRequest, mountedRef, openCityDetail]);

  /** Sidebar’dan dönüşte son harita lokasyonu; panel yalnızca panelOpen ise açılır */
  useEffect(() => {
    if (mapViewRestoredRef.current) return undefined;
    if (mapTargetPickRequest || mapFocusRequest || mapExpeditionLaunchRequest) return undefined;
    if (!lastViewedLocation || !mapCities.length || !mapReady) return undefined;

    mapViewRestoredRef.current = true;

    if (lastViewedLocation.panelOpen !== false) {
      const restored = resolveMapCityFromLastViewed(lastViewedLocation, mapCities, playerCities);
      if (restored) {
        setSelectedCity(restored);
        setActiveHighlightCity(restored);
      }
    }

    const fly = resolveRestoreFlyTarget(lastViewedLocation);
    if (fly) {
      setFlyTarget({ ...fly, at: Date.now() });
    }

    return undefined;
  }, [
    lastViewedLocation,
    mapCities,
    playerCities,
    mapReady,
    mapTargetPickRequest,
    mapFocusRequest,
    mapExpeditionLaunchRequest,
  ]);

  useEffect(() => {
    if (!isFullscreen) return undefined;
    const run = () => window.dispatchEvent(new Event('map-layout-changed'));
    run();
    const timers = [60, 150, 320, 600, 1200].map((ms) => window.setTimeout(run, ms));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [isFullscreen]);

  useEffect(() => {
    if (isFullscreen) return undefined;

    const snap = fsViewportSnapshotRef.current;
    fsViewportSnapshotRef.current = null;

    const content = document.querySelector('.app-shell.route-map .content-area');
    if (content) content.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    if (!snap?.center) return undefined;

    const timer = window.setTimeout(() => {
      setRestoreViewport({
        center: snap.center,
        zoom: snap.zoom,
        at: Date.now(),
      });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [isFullscreen]);

  const handleToggleFullscreen = useCallback(() => {
    if (!isFullscreen && viewport?.center) {
      fsViewportSnapshotRef.current = {
        center: { lat: viewport.center.lat, lng: viewport.center.lng },
        zoom: viewport.zoom,
      };
    }
    toggleFullscreen();
  }, [isFullscreen, viewport, toggleFullscreen]);

  const pageClassName = useMemo(
    () => [
      'map-page',
      'map-page--cyber',
      'map-page--tactical',
      'map-page--command-theater',
      mapLocked && isMobile ? 'map-interaction-locked' : 'map-interaction-unlocked',
      mapTargetPickRequest && 'map-page--pick-target',
      expeditionLaunchMode && 'map-page--expedition-launch',
      isFullscreen && 'map-page--fullscreen',
    ].filter(Boolean).join(' '),
    [mapLocked, isMobile, mapTargetPickRequest, expeditionLaunchMode, isFullscreen],
  );

  const fsPortalRoot = isFullscreen ? theaterPortalEl : null;
  const cityPanelPortal = fsPortalRoot ?? modalPortalEl;

  return (
    <div ref={theaterRef} className={pageClassName}>
      <div
        ref={setTheaterPortalEl}
        className="map-theater-portal-anchor"
        aria-hidden={!isFullscreen}
      />

      {isFullscreen && (
        <div className="map-fs-chrome" data-map-no-pan>
          <HudBackButton
            fallback="/"
            label="Ana Merkez"
            className="btn btn-secondary btn-sm hud-back-btn map-fs-back-btn"
          />
          <button
            type="button"
            className={`btn btn-secondary btn-sm map-fs-ideology-btn map-ideology-toggle${ideologyView ? ' active' : ''}`}
            onClick={handleToggleIdeology}
            aria-pressed={ideologyView}
          >
            {resolveIdeologyToggleLabel(t)}
          </button>
          <button
            type="button"
            className="map-fs-exit-btn"
            onClick={exitFullscreen}
            aria-label={t('map.fullscreen.exitAria') || 'Tam ekrandan çık'}
          >
            {t('map.fullscreen.exit') || '[ TAM EKRANDAN ÇIK ]'}
          </button>
        </div>
      )}

      {isMobile && !isFullscreen && (
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
            <CustomDropdown
              className="map-city-select map-city-select--mobile"
              value={cityPick}
              onChange={(name) => {
                setCityPick(name);
                const city = mapCities.find((c) => c.name === name);
                if (city) handleConsoleCitySelect(city);
              }}
              placeholder="Şehir ara..."
              aria-label="Şehir ara"
              options={[
                { value: '', label: 'Şehir ara...', disabled: true },
                ...mapCities.map((c) => ({
                  value: c.name,
                  label: `${getMapCityDisplayName(c.name, lang)} — ${c.status === 'bot' ? 'BOT' : (c.owner || 'Boş')}`,
                })),
              ]}
            />
          )}
          <span className="map-lock-hint">
            {mapLocked
              ? 'İki parmakla yakınlaştırın · haritayı sürükleyin'
              : 'Kilidi açınca yalnızca harita alanı kayar · şehir seçmek için listeden seçin'}
          </span>
        </div>
      )}

      <MapCoordTooltip hover={hoverCoord} portalRoot={fsPortalRoot} />

      {mapTargetPickRequest && (
        <div className="map-pick-target-banner" role="status">
          <span>[ HEDEF SEÇ ] — Haritada bir düşman üssüne tıklayın</span>
          <HudBackButton
            className="btn btn-secondary btn-sm hud-back-btn map-pick-target-banner__back"
            onStepBack={() => {
              const returnPath = mapTargetPickRequest.returnPath ?? '/istihbarat';
              clearMapTargetPick();
              const idx = window.history.state?.idx;
              if (typeof idx === 'number' && idx > 0) navigate(-1);
              else navigate(returnPath);
            }}
            label="Geri"
          />
        </div>
      )}

      {expeditionLaunchMode && !mapTargetPickRequest && (
        <div className="map-pick-target-banner map-pick-target-banner--expedition" role="status">
          <span>[ SEFER BAŞLAT ] — Haritada veya listeden hedef şehir seçin</span>
          <HudBackButton
            className="btn btn-secondary btn-sm hud-back-btn map-pick-target-banner__back"
            onStepBack={() => {
              setExpeditionLaunchMode(false);
              navigate('/seferler');
            }}
            label="İptal"
          />
        </div>
      )}

      {!isFullscreen && (
        <div className="map-page-toolbar">
          <HudBackButton fallback="/" label="Ana Merkez" className="btn btn-secondary btn-sm hud-back-btn map-toolbar-back" />
          <MapTacticalCommandBar
            ideologyView={ideologyView}
            onToggleIdeology={handleToggleIdeology}
          />
          <button
            type="button"
            className="map-fs-hero-btn map-fs-hero-btn--compact"
          onClick={handleToggleFullscreen}
            aria-label="Taktik harekat odası tam ekran modunu aç"
          >
            [ TAM EKRAN ]
          </button>
        </div>
      )}

      <div className="map-theater-body">
      <div
        ref={setModalPortalEl}
        className="map-command-portal-host"
        aria-hidden={!selectedCity}
      />
      <div
        ref={mapHostRef}
        className="map-container map-container-wrap map-container-wrap--cyber map-container--tactical"
      >
        {(!mapReady || !mapHostSized) && (
          <div className="map-loading-placeholder" aria-live="polite">
            {t('map.loading')}
          </div>
        )}

        {mapReady && mapHostSized && (
          <TurkeyLeafletMap
            provinces={provinces}
            botProvinceNames={botProvinceNames}
            ownProvinceNames={ownProvinceNames}
            botPulsePhaseRef={botPulsePhaseRef}
            onEachProvince={onEachProvince}
            ideologyView={ideologyView}
            filteredCities={filteredCities}
            mapCities={mapCities}
            playerCities={playerCities}
            playerIdeology={playerIdeology}
            activeHighlightCity={activeHighlightCity}
            provinceLayerRef={provinceLayerRef}
            expeditions={expeditions}
            activeCityId={activeCityId}
            underAttack={underAttack}
            incomingAttacks={incomingAttacks}
            onSelectCity={handleSelectCity}
            onCityHover={handleCityHover}
            onCityHoverEnd={handleCityHoverEnd}
            mapZoom={mapZoom}
            activeLat={activeLat}
            activeLng={activeLng}
            fitBounds={fitBounds}
            flyTarget={flyTarget}
            restoreViewport={restoreViewport}
            onFlyComplete={handleMapFlyComplete}
            onFlySettled={handleFlySettled}
            onWorldView={handleWorldView}
            onFocusBase={handleFocusBase}
            loadingMessage={t('map.loading')}
            suppressActiveCityFocus={Boolean(lastViewedLocation || flyTarget || mapFocusRequest)}
            viewportBounds={viewport?.bounds ?? null}
            isMobile={isMobile}
            mapPanEnabled={mapPanEnabled}
            hudCollapsed={hudCollapsed}
            onViewportChange={setViewportStable}
            onMapClickPulse={handleMapClickPulse}
            isFullscreen={isFullscreen}
            showLocHud={!hoverCoord}
          />
        )}

        <div className="map-tactical-overlay" aria-hidden="true">
          <div className="map-tactical-grid" />
          <div className="map-tactical-scanlines" />
          <div className="map-tactical-radar-sweep" />
        </div>

        <div className="map-hex-pulse-layer" aria-hidden="true">
          {hexPulses.map((pulse) => (
            <div
              key={pulse.id}
              className="map-hex-pulse"
              style={{ left: pulse.x, top: pulse.y }}
            >
              <span className="map-hex-pulse__shape" />
            </div>
          ))}
        </div>

        <div className="map-radar-scan-layer" aria-hidden="true">
          <div className="map-radar-scan-layer__glow" />
          <div className="map-radar-scan-layer__beam" />
        </div>

        <div className="map-hud-layer" data-map-no-pan>
          <TacticalSearchConsole
            searchCities={searchCityList}
            mapCities={mapCities}
            cityPick={cityPick}
            setCityPick={setCityPick}
            onCitySelect={handleConsoleCitySelect}
            onFlyToCity={(city) => flyToCityAndOpenPanel(city)}
            search={search}
            setSearch={setSearch}
            searchCoord={searchCoord}
            setSearchCoord={setSearchCoord}
            handleSearch={handleSearch}
            scanPulse={scanPulse}
            onResetFilter={clearMapFilters}
            hasActiveFilter={hasMapFilter}
            liveStats={mapLiveStats}
            forceExpanded={consoleForceExpanded}
            ideologyView={ideologyView}
            onToggleIdeology={handleToggleIdeology}
          />

          <MapIntelSidebar />

          <MapStatusLegend className={isFullscreen ? 'map-status-legend--fs' : ''} />
        </div>

        {isMobile && !isFullscreen && (
          <>
            <button
              type="button"
              className="map-collapse-toggle map-collapse-toggle--hud"
              onClick={() => setHudCollapsed((v) => !v)}
              aria-expanded={!hudCollapsed}
            >
              {hudCollapsed ? 'HUD Aç' : 'HUD Kapat'}
            </button>
            <button
              type="button"
              className="map-collapse-toggle map-collapse-toggle--minimap"
              onClick={() => setMiniMapCollapsed((v) => !v)}
              aria-expanded={!miniMapCollapsed}
            >
              {miniMapCollapsed ? 'Mini Harita' : 'Mini Harita Kapat'}
            </button>
          </>
        )}

        <div className={`map-minimap-wrap${miniMapCollapsed && isMobile && !isFullscreen ? ' map-minimap-wrap--collapsed' : ''}`}>
          <MapMiniMap viewport={viewport} activeCity={activeMapCity} mapCities={mapCities} />
        </div>

        <MapStatusBand />
      </div>
      </div>

      {selectedCity && (
        <CityDetailPanel
          city={selectedCity}
          onClose={handleCloseCityPanel}
          initialActionMode={panelInitialActionMode}
          portalRoot={cityPanelPortal}
        />
      )}
    </div>
  );
}
