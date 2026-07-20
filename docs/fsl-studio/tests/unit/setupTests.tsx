/**
 * Jest setup for @docs/fsl-studio unit tests.
 *
 * @ttoss/test-utils/react registers @testing-library/jest-dom matchers and a
 * ResizeObserver polyfill. jsdom does not implement `window.matchMedia`,
 * which the fsl-theme runtime uses for system color-mode detection — stub it.
 */
import '@ttoss/test-utils/react';

// The session layer projects state onto the URL hash and localStorage
// drafts (PRD F1.2/F1.3); both persist across tests in a file, so reset.
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
