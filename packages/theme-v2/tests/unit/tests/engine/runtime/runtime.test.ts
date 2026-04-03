/**
 * @jest-environment jsdom
 */

import {
  createThemeRuntime,
  DATA_MODE_ATTR,
  DATA_THEME_ATTR,
  DEFAULT_STORAGE_KEY,
  type ThemeMode,
  type ThemeRuntime,
  type ThemeState,
} from '../../../../../src/runtime';
import { clearDom, matchMediaMockImpl } from '../../../helpers/dom';

// ---------------------------------------------------------------------------// jsdom does not implement matchMedia — provide a mock.
// ---------------------------------------------------------------------------

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(matchMediaMockImpl()),
});

// ---------------------------------------------------------------------------// Helpers
// ---------------------------------------------------------------------------

const getAttr = (attr: string): string | null => {
  return document.documentElement.getAttribute(attr);
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
      expect(getAttr(DATA_THEME_ATTR)).toBeNull();
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
      // themeId in storage is ignored — only mode is restored
      expect(getAttr(DATA_THEME_ATTR)).toBeNull();
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
      (window.matchMedia as jest.Mock).mockImplementation(
        matchMediaMockImpl({ dark: true })
      );

      runtime = createThemeRuntime({ defaultMode: 'system' });
      expect(runtime.getState().resolvedMode).toBe('dark');

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl());
    });
  });

  // --- onSystemChange (mediaQuery listener) --------------------------------

  describe('onSystemChange', () => {
    test('updates resolvedMode when system preference changes while in system mode', () => {
      let changeHandler: (() => void) | undefined;
      const captureListener = jest.fn((_event: string, handler: () => void) => {
        changeHandler = handler;
      });
      (window.matchMedia as jest.Mock).mockImplementation(
        matchMediaMockImpl({ addEventListener: captureListener })
      );

      runtime = createThemeRuntime({ defaultMode: 'system' });
      expect(runtime.getState().resolvedMode).toBe('light');

      // Simulate system switching to dark
      (window.matchMedia as jest.Mock).mockImplementation(
        matchMediaMockImpl({ dark: true })
      );

      // Fire the change handler
      changeHandler?.();
      expect(runtime.getState().resolvedMode).toBe('dark');

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl());
    });

    test('does not update when mode is explicit (not system)', () => {
      let changeHandler: (() => void) | undefined;
      const captureListener = jest.fn((_event: string, handler: () => void) => {
        changeHandler = handler;
      });
      (window.matchMedia as jest.Mock).mockImplementation(
        matchMediaMockImpl({ addEventListener: captureListener })
      );

      runtime = createThemeRuntime({ defaultMode: 'light' });
      const states: ThemeState[] = [];
      runtime.subscribe((s: ThemeState) => {
        return states.push(s);
      });

      // Fire the change handler — should be ignored since mode is 'light'
      changeHandler?.();
      expect(states).toHaveLength(0);

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl());
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
      runtime.setMode('dark');
      expect(states).toHaveLength(1);

      unsub();
      runtime.setMode('light');
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
      runtime.setMode('dark');
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
      // setMode after destroy should not notify
      runtime.setMode('dark');
      expect(states).toHaveLength(0);
    });

    test('removes media query listener when mode is system', () => {
      const removeFn = jest.fn();
      (window.matchMedia as jest.Mock).mockImplementation(
        matchMediaMockImpl({ removeEventListener: removeFn })
      );

      runtime = createThemeRuntime({ defaultMode: 'system' });
      runtime.destroy();
      expect(removeFn).toHaveBeenCalledWith('change', expect.any(Function));

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl());
    });

    test('does not mutate DOM after destroy', () => {
      runtime = createThemeRuntime({ defaultMode: 'light' });
      expect(getAttr(DATA_MODE_ATTR)).toBe('light');
      runtime.destroy();
      // Force a different mode on the DOM to verify setMode is a no-op
      document.documentElement.setAttribute(DATA_MODE_ATTR, 'dark');
      runtime.setMode('light');
      // DOM was NOT reverted — setMode is a no-op after destroy
      expect(getAttr(DATA_MODE_ATTR)).toBe('dark');
    });

    test('does not re-register media listener when setMode("system") called after destroy', () => {
      const addFn = jest.fn();
      (window.matchMedia as jest.Mock).mockImplementation(
        matchMediaMockImpl({ addEventListener: addFn })
      );

      runtime = createThemeRuntime({ defaultMode: 'light' });
      runtime.destroy();
      addFn.mockClear();

      runtime.setMode('system');
      expect(addFn).not.toHaveBeenCalled();

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl());
    });

    test('does not mutate DOM when OS prefers-color-scheme fires after destroy', () => {
      let capturedHandler: (() => void) | undefined;
      const addFn = jest.fn((_event: string, handler: () => void) => {
        capturedHandler = handler;
      });
      (window.matchMedia as jest.Mock).mockImplementation(
        matchMediaMockImpl({ addEventListener: addFn })
      );

      runtime = createThemeRuntime({ defaultMode: 'system' });
      expect(capturedHandler).toBeDefined();

      runtime.destroy();
      // Simulate a mode change on the DOM so we can detect any mutation
      document.documentElement.setAttribute(DATA_MODE_ATTR, 'sentinel');

      // Fire the OS change event after destroy — must be a no-op
      capturedHandler!();
      expect(getAttr(DATA_MODE_ATTR)).toBe('sentinel');

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl());
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
      // mode is read from storage; themeId in storage is ignored
      expect(runtime.getState().mode).toBe('dark');

      runtime.setMode('light');
      const stored = JSON.parse(localStorage.getItem(key)!);
      expect(stored.mode).toBe('light');
      expect(stored.themeId).toBeUndefined();
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

  // --- Short-circuit (no-op) -----------------------------------------------

  describe('short-circuit', () => {
    test('setMode with same value does not notify', () => {
      runtime = createThemeRuntime({
        defaultTheme: 'default',
        defaultMode: 'light',
      });
      const states: ThemeState[] = [];
      runtime.subscribe((s: ThemeState) => {
        return states.push(s);
      });
      runtime.setMode('light');
      expect(states).toHaveLength(0);
    });
  });

  // --- Input sanitization --------------------------------------------------

  describe('input sanitization', () => {
    test('setMode ignores invalid mode', () => {
      runtime = createThemeRuntime({
        defaultTheme: 'default',
        defaultMode: 'light',
      });
      const states: ThemeState[] = [];
      runtime.subscribe((s: ThemeState) => {
        return states.push(s);
      });
      runtime.setMode('sepia' as unknown as ThemeMode);
      expect(states).toHaveLength(0);
      expect(runtime.getState().mode).toBe('light');
    });
  });

  // --- Lazy media query listener -------------------------------------------

  describe('lazy media query listener', () => {
    test('does not register listener when mode is explicit', () => {
      const addFn = jest.fn();
      (window.matchMedia as jest.Mock).mockImplementation(
        matchMediaMockImpl({ addEventListener: addFn })
      );

      runtime = createThemeRuntime({ defaultMode: 'light' });
      expect(addFn).not.toHaveBeenCalled();

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl());
    });

    test('registers listener when switching to system mode', () => {
      const addFn = jest.fn();
      const removeFn = jest.fn();
      (window.matchMedia as jest.Mock).mockImplementation(
        matchMediaMockImpl({
          addEventListener: addFn,
          removeEventListener: removeFn,
        })
      );

      runtime = createThemeRuntime({ defaultMode: 'light' });
      expect(addFn).not.toHaveBeenCalled();

      runtime.setMode('system');
      expect(addFn).toHaveBeenCalledTimes(1);

      // Restore default mock
      (window.matchMedia as jest.Mock).mockImplementation(matchMediaMockImpl());
    });
  });
});
