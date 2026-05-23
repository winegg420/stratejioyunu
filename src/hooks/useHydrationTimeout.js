import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useGameDataReady } from './useGameDataReady';
import { useTerminalLogStore } from '../stores/terminalLogStore';

const HYDRATION_TIMEOUT_MS = 3000;

function isStillWaitingForGame(state) {
  if (state.gameHydrating) return true;
  if (!state.activeCityId || !state.playerCities?.length) return true;
  const resources = state.cities[state.activeCityId]?.resources;
  return !Array.isArray(resources) || resources.length === 0;
}

/**
 * Veri 3 sn içinde hazır olmazsa Ana Merkez'e yönlendir.
 */
export function useHydrationTimeout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const ready = useGameDataReady();

  useEffect(() => {
    if (pathname === '/giris' || pathname === '/') return undefined;
    if (ready) return undefined;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const state = useGameStore.getState();
      if (!isStillWaitingForGame(state)) return;
      useTerminalLogStore.getState().append('NETWORK TIMEOUT: REDIRECTED TO PREVIOUS VIEW', 'ACİL');
      const idx = window.history.state?.idx;
      if (typeof idx === 'number' && idx > 0) {
        navigate(-1);
      } else {
        navigate('/', { replace: true });
      }
    }, HYDRATION_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pathname, ready, navigate]);
}
