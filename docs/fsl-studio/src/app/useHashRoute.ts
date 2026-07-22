import * as React from 'react';

import { DEFAULT_ROUTE, isRouteId, type RouteId } from './routes';

const readRoute = (): RouteId => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return isRouteId(hash) ? hash : DEFAULT_ROUTE;
};

/**
 * Minimal hash router: the current section id lives in `location.hash`
 * (`#/blocks`), so sections deep-link, reload, and honor back/forward
 * without a routing dependency.
 */
export const useHashRoute = () => {
  const [route, setRoute] = React.useState<RouteId>(readRoute);

  React.useEffect(() => {
    const onHashChange = () => {
      setRoute(readRoute());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  const navigate = React.useCallback((next: RouteId) => {
    window.location.hash = `/${next}`;
    setRoute(next);
  }, []);

  return { route, navigate };
};
