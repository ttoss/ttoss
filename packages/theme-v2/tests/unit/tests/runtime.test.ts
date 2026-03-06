/**
 * @jest-environment jsdom
 */

import {
  createThemeRuntime,
  DATA_MODE_ATTR,
  DATA_THEME_ATTR,
  DEFAULT_STORAGE_KEY,
  type ThemeRuntime,
  type ThemeState,
} from '../../../src/runtime';

// ---------------------------------------------------------------------------// jsdom does not implement matchMedia — provide a mock.
// ---------------------------------------------------------------------------

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  }),
});

// ---------------------------------------------------------------------------// Helpers
// ---------------------------------------------------------------------------

const getAttr = (attr: string): string | null => {
  return document.documentElement.getAttribute(attr);
};

const clearDom = (): void => {
  document.documentElement.removeAttribute(DATA_THEME_ATTR);
  document.documentElement.removeAttribute(DATA_MODE_ATTR);
  document.documentElement.style.colorScheme = '';
  localStorage.clear();
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createThemeRuntime', () => {
  let runtime: ThemeRuntime;

  afterEach(() => {
    runtime?.destroy();
    clearDom();
  });

  // --- Initialization ------------------------------------------------------

  describe('initialization', () => {
    test('applies default attributes on creation', () => {
      runtime = createThemeRuntime();
      expect(getAttr(DATA_THEME_ATTR)).toBe('default');
      // mode depends on system, but should be 'light' or 'dark'
      expect(['light', 'dark']).toContain(getAttr(DATA_MODE_ATTR));
    });

    test('uses provided defaults', () => {
      runtime = createThemeRuntime({
        defaultTheme: 'bruttal',
        defaultMode: 'dark',
      });
      expect(getAttr(DATA_THEME_ATTR)).toBe('bruttal');
      expect(getAttr(DATA_MODE_ATTR)).toBe('dark');
    });

    test('reads from localStorage on init', () => {
      localStorage.setItem(
        DEFAULT_STORAGE_KEY,
        JSON.stringify({ themeId: 'oca', mode: 'light' })
      );
      runtime = createThemeRuntime();
      expect(getAttr(DATA_THEME_ATTR)).toBe('oca');
      expect(getAttr(DATA_MODE_ATTR)).toBe('light');
    });

    test('falls back to defaults when localStorage has invalid data', () => {
      localStorage.setItem(DEFAULT_STORAGE_KEY, 'not-json');
      runtime = createThemeRuntime({
        defaultTheme: 'aurora',
        defaultMode: 'dark',
      });
      expect(getAttr(DATA_THEME_ATTR)).toBe('aurora');
      expect(getAttr(DATA_MODE_ATTR)).toBe('dark');
    });

    test('sets color-scheme on root', () => {
      runtime = createThemeRuntime({ defaultMode: 'dark' });
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });
  });

  // --- getState ------------------------------------------------------------

  describe('getState', () => {
    test('returns current state', () => {
      runtime = createThemeRuntime({
        defaultTheme: 'bruttal',
        defaultMode: 'light',
      });
      const state = runtime.getState();
      expect(state.themeId).toBe('bruttal');
      expect(state.mode).toBe('light');
      expect(state.resolvedMode).toBe('light');
    });

    test('resolves system mode', () => {
      runtime = createThemeRuntime({ defaultMode: 'system' });
      const state = runtime.getState();
      expect(state.mode).toBe('system');
      expect(['light', 'dark']).toContain(state.resolvedMode);
    });

    test('resolves system mode as dark when prefers-color-scheme is dark', () => {
      // Temporarily make matchMedia report dark
      (window.matchMedia as jest.Mock).mockImplementation((query: string) => {
        return {
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });

      runtime = createThemeRuntime({ defaultMode: 'system' });
      expect(runtime.getState().resolvedMode).toBe('dark');

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });
    });
  });

  // --- onSystemChange (mediaQuery listener) --------------------------------

  describe('onSystemChange', () => {
    test('updates resolvedMode when system preference changes while in system mode', () => {
      let changeHandler: (() => void) | undefined;
      (window.matchMedia as jest.Mock).mockImplementation((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn((_event: string, handler: () => void) => {
            changeHandler = handler;
          }),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });

      runtime = createThemeRuntime({ defaultMode: 'system' });
      expect(runtime.getState().resolvedMode).toBe('light');

      // Simulate system switching to dark
      (window.matchMedia as jest.Mock).mockImplementation((query: string) => {
        return {
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });

      // Fire the change handler
      changeHandler?.();
      expect(runtime.getState().resolvedMode).toBe('dark');

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });
    });

    test('does not update when mode is explicit (not system)', () => {
      let changeHandler: (() => void) | undefined;
      (window.matchMedia as jest.Mock).mockImplementation((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn((_event: string, handler: () => void) => {
            changeHandler = handler;
          }),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });

      runtime = createThemeRuntime({ defaultMode: 'light' });
      const states: ThemeState[] = [];
      runtime.subscribe((s: ThemeState) => {
        return states.push(s);
      });

      // Fire the change handler — should be ignored since mode is 'light'
      changeHandler?.();
      expect(states).toHaveLength(0);

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      });
    });
  });

  // --- setTheme ------------------------------------------------------------

  describe('setTheme', () => {
    test('updates attribute and state', () => {
      runtime = createThemeRuntime();
      runtime.setTheme('neon');
      expect(getAttr(DATA_THEME_ATTR)).toBe('neon');
      expect(runtime.getState().themeId).toBe('neon');
    });

    test('persists to localStorage', () => {
      runtime = createThemeRuntime();
      runtime.setTheme('terra');
      const stored = JSON.parse(localStorage.getItem(DEFAULT_STORAGE_KEY)!);
      expect(stored.themeId).toBe('terra');
    });

    test('notifies subscribers', () => {
      runtime = createThemeRuntime();
      const states: ThemeState[] = [];
      runtime.subscribe((s: ThemeState) => {
        return states.push(s);
      });
      runtime.setTheme('aurora');
      expect(states).toHaveLength(1);
      expect(states[0].themeId).toBe('aurora');
    });
  });

  // --- setMode -------------------------------------------------------------

  describe('setMode', () => {
    test('updates attribute and state for explicit mode', () => {
      runtime = createThemeRuntime({ defaultMode: 'light' });
      runtime.setMode('dark');
      expect(getAttr(DATA_MODE_ATTR)).toBe('dark');
      expect(runtime.getState().mode).toBe('dark');
      expect(runtime.getState().resolvedMode).toBe('dark');
    });

    test('updates colorScheme style', () => {
      runtime = createThemeRuntime({ defaultMode: 'light' });
      runtime.setMode('dark');
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    test('persists to localStorage', () => {
      runtime = createThemeRuntime();
      runtime.setMode('light');
      const stored = JSON.parse(localStorage.getItem(DEFAULT_STORAGE_KEY)!);
      expect(stored.mode).toBe('light');
    });

    test('resolves system mode', () => {
      runtime = createThemeRuntime({ defaultMode: 'light' });
      runtime.setMode('system');
      expect(runtime.getState().mode).toBe('system');
      expect(['light', 'dark']).toContain(runtime.getState().resolvedMode);
    });
  });

  // --- subscribe -----------------------------------------------------------

  describe('subscribe', () => {
    test('returns unsubscribe function', () => {
      runtime = createThemeRuntime();
      const states: ThemeState[] = [];
      const unsub = runtime.subscribe((s: ThemeState) => {
        return states.push(s);
      });
      runtime.setTheme('bruttal');
      expect(states).toHaveLength(1);

      unsub();
      runtime.setTheme('oca');
      expect(states).toHaveLength(1); // no new notification
    });

    test('supports multiple subscribers', () => {
      runtime = createThemeRuntime();
      let count1 = 0;
      let count2 = 0;
      runtime.subscribe(() => {
        return count1++;
      });
      runtime.subscribe(() => {
        return count2++;
      });
      runtime.setTheme('neon');
      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  // --- destroy -------------------------------------------------------------

  describe('destroy', () => {
    test('removes all subscribers', () => {
      runtime = createThemeRuntime();
      const states: ThemeState[] = [];
      runtime.subscribe((s: ThemeState) => {
        return states.push(s);
      });
      runtime.destroy();
      // setTheme after destroy should not notify (but will still set attrs)
      runtime.setTheme('bruttal');
      expect(states).toHaveLength(0);
    });
  });

  // --- Custom storage key --------------------------------------------------

  describe('custom storageKey', () => {
    test('reads and writes to custom key', () => {
      const key = 'my-custom-key';
      localStorage.setItem(
        key,
        JSON.stringify({ themeId: 'terra', mode: 'dark' })
      );
      runtime = createThemeRuntime({ storageKey: key });
      expect(runtime.getState().themeId).toBe('terra');

      runtime.setTheme('neon');
      const stored = JSON.parse(localStorage.getItem(key)!);
      expect(stored.themeId).toBe('neon');
    });
  });

  // --- Custom root element -------------------------------------------------

  describe('custom root element', () => {
    test('applies attributes to provided root', () => {
      const root = document.createElement('div');
      document.body.appendChild(root);

      runtime = createThemeRuntime({
        root,
        defaultTheme: 'bruttal',
        defaultMode: 'light',
      });

      expect(root.getAttribute(DATA_THEME_ATTR)).toBe('bruttal');
      expect(root.getAttribute(DATA_MODE_ATTR)).toBe('light');

      document.body.removeChild(root);
    });
  });

  // --- Mode sanitization ---------------------------------------------------

  describe('mode sanitization', () => {
    test('falls back to defaultMode when localStorage has invalid mode', () => {
      localStorage.setItem(
        DEFAULT_STORAGE_KEY,
        JSON.stringify({ themeId: 'oca', mode: 'sepia' })
      );
      runtime = createThemeRuntime({ defaultMode: 'dark' });
      expect(runtime.getState().mode).toBe('dark');
      expect(runtime.getState().themeId).toBe('oca');
    });

    test('falls back to defaultMode when stored mode is null', () => {
      localStorage.setItem(
        DEFAULT_STORAGE_KEY,
        JSON.stringify({ themeId: 'bruttal', mode: null })
      );
      runtime = createThemeRuntime({ defaultMode: 'light' });
      expect(runtime.getState().mode).toBe('light');
    });

    test('accepts valid stored modes', () => {
      for (const validMode of ['light', 'dark', 'system']) {
        clearDom();
        localStorage.setItem(
          DEFAULT_STORAGE_KEY,
          JSON.stringify({ themeId: 'default', mode: validMode })
        );
        const rt = createThemeRuntime();
        expect(rt.getState().mode).toBe(validMode);
        rt.destroy();
      }
    });
  });
});
