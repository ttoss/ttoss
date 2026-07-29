import * as React from 'react';

/**
 * Hash router — the recorded v2 pattern (BLUEPRINT S2): hash routing is
 * sufficient for a statically-hosted app, needs no server rewrites, and
 * keeps the four product routes bookmarkable.
 */

export type Route = 'dashboard' | 'team' | 'billing' | 'settings';

export const ROUTES: Record<Route, { hash: string; label: string }> = {
  dashboard: { hash: '#/', label: 'Overview' },
  team: { hash: '#/team', label: 'Team' },
  billing: { hash: '#/billing', label: 'Billing' },
  settings: { hash: '#/settings', label: 'Settings' },
};

export const parseHash = (hash: string): Route => {
  switch (hash) {
    case '#/team':
      return 'team';
    case '#/billing':
      return 'billing';
    case '#/settings':
      return 'settings';
    default:
      return 'dashboard';
  }
};

export const navigate = (route: Route) => {
  window.location.hash = ROUTES[route].hash;
};

const subscribe = (listener: () => void) => {
  window.addEventListener('hashchange', listener);
  return () => {
    window.removeEventListener('hashchange', listener);
  };
};

const getRoute = () => {
  return parseHash(window.location.hash);
};

/** Reactive current route — re-renders on hash changes. */
export const useRoute = (): Route => {
  return React.useSyncExternalStore(subscribe, getRoute);
};
