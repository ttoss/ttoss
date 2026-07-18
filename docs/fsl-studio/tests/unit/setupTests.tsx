/**
 * Jest setup for @docs/fsl-studio unit tests.
 *
 * @ttoss/test-utils/react registers @testing-library/jest-dom matchers and a
 * ResizeObserver polyfill. jsdom does not implement `window.matchMedia`,
 * which the fsl-theme runtime uses for system color-mode detection — stub it.
 */
import '@ttoss/test-utils/react';

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
