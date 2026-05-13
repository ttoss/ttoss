/**
 * DOM cleanup helper for jsdom-based tests.
 *
 * Resets all theme-related DOM state between tests.
 */

import { DATA_MODE_ATTR, DATA_THEME_ATTR } from '../../../src/runtime';

export const clearDom = (): void => {
  document.documentElement.removeAttribute(DATA_THEME_ATTR);
  document.documentElement.removeAttribute(DATA_MODE_ATTR);
  document.documentElement.style.colorScheme = '';
  localStorage.clear();
};

// ---------------------------------------------------------------------------
// matchMedia mock factory
// ---------------------------------------------------------------------------

/**
 * Returns a `window.matchMedia` implementation factory for jsdom.
 *
 * @param opts.dark - Simulate `prefers-color-scheme: dark`. Default `false`.
 * @param opts.coarsePointer - Simulate `any-pointer: coarse` (touch device). Default `false`.
 * @param opts.addEventListener - Custom `addEventListener` mock (e.g. to capture the handler).
 * @param opts.removeEventListener - Custom `removeEventListener` mock.
 *
 * @example
 * // Default light mock (initial setup)
 * Object.defineProperty(window, 'matchMedia', {
 *   writable: true,
 *   value: jest.fn().mockImplementation(matchMediaMockImpl()),
 * });
 *
 * // Restore to default
 * (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl());
 *
 * // Simulate dark preference
 * (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl({ dark: true }));
 *
 * // Simulate coarse pointer (touch device)
 * (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl({ coarsePointer: true }));
 *
 * // Capture the change handler
 * let handler: (() => void) | undefined;
 * const captureListener = jest.fn((_event: string, h: () => void) => { handler = h; });
 * (window.matchMedia as jest.Mock).mockImplementation(
 *   matchMediaMockImpl({ addEventListener: captureListener })
 * );
 */
export const matchMediaMockImpl = (
  opts: {
    dark?: boolean;
    coarsePointer?: boolean;
    addEventListener?: jest.Mock;
    removeEventListener?: jest.Mock;
  } = {}
) => {
  return (query: string) => {
    let matches = false;
    if (opts.dark && query === '(prefers-color-scheme: dark)') {
      matches = true;
    }
    if (opts.coarsePointer && query === '(any-pointer: coarse)') {
      matches = true;
    }
    return {
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: opts.addEventListener ?? jest.fn(),
      removeEventListener: opts.removeEventListener ?? jest.fn(),
      dispatchEvent: jest.fn(),
    };
  };
};
