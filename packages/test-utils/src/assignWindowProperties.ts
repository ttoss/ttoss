/**
 * Properties assigned:
 *
 * - `matchMedia`
 */
(() => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!window?.matchMedia) {
    /**
     * https://stackoverflow.com/a/66055672/8786986
     */
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  }
})();
