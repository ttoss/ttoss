/* eslint-disable @typescript-eslint/no-explicit-any */
(() => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!window?.structuredClone) {
    Object.defineProperty(window, 'structuredClone', {
      writable: true,
      value: (obj: any) => {
        return JSON.parse(JSON.stringify(obj));
      },
    });
  }

  if (!window?.matchMedia) {
    /**
     * https://stackoverflow.com/a/66055672/8786986
     */
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => {
        return {
          matches: true,
          media: query,
          onchange: null,
          addListener: jest.fn(), // Deprecated
          removeListener: jest.fn(), // Deprecated
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }),
    });
  }
})();
