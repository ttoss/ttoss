/**
 * Jest setup for @docs/fsl-studio unit tests.
 *
 * @ttoss/test-utils/react registers @testing-library/jest-dom matchers and a
 * ResizeObserver polyfill. jsdom does not implement `window.matchMedia`,
 * which the fsl-theme runtime uses for system color-mode detection — stub it.
 */
import '@ttoss/test-utils/react';

import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// The shell projects the current section onto the URL hash and the theme
// runtime persists the mode in localStorage; both survive across tests in a
// file, so reset.
beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => {
    return {
      matches: false,
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
