/**
 * Jest setup for @docs/fsl-studio unit tests.
 *
 * @ttoss/test-utils/react registers @testing-library/jest-dom matchers and a
 * ResizeObserver polyfill. jsdom does not implement `window.matchMedia`, which
 * the fsl-theme runtime uses for system colour-mode detection and the shell's
 * `useNavCollapse` uses for its viewport threshold — stub it.
 */
import '@ttoss/test-utils/react';

import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// The session layer persists onto sessionStorage and the router onto the URL
// hash; both leak across tests in a file, so reset.
beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

/**
 * Answer `min-width` queries against jsdom's actual viewport instead of
 * returning `false` to everything.
 *
 * The blanket `false` was harmless while the only caller asked about
 * `prefers-color-scheme` (where `false` is the light default we want). It stops
 * being harmless the moment a caller asks about width: jsdom reports 1024px, so
 * a `min-width: 48rem` query is *true*, and answering `false` put the shell in
 * its collapsed shape and hid the navigation from every test that looked for it.
 */
const matchesQuery = (query: string): boolean => {
  const minWidth = /min-width:\s*([\d.]+)(rem|px)/.exec(query);
  if (minWidth === null) return false;
  const value = Number(minWidth[1]);
  const pixels = minWidth[2] === 'rem' ? value * 16 : value;
  return window.innerWidth >= pixels;
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => {
    return {
      matches: matchesQuery(query),
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  },
});
