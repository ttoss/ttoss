/**
 * @jest-environment jsdom
 */

import { act, render, renderHook } from '@ttoss/test-utils/react';

import { ThemeProvider, ThemeScript, useTheme } from '../../../src/react';
import {
  DATA_MODE_ATTR,
  DATA_THEME_ATTR,
  DEFAULT_STORAGE_KEY,
} from '../../../src/runtime';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clearDom = (): void => {
  document.documentElement.removeAttribute(DATA_THEME_ATTR);
  document.documentElement.removeAttribute(DATA_MODE_ATTR);
  document.documentElement.style.colorScheme = '';
  localStorage.clear();
};

// ---------------------------------------------------------------------------
// ThemeProvider
// ---------------------------------------------------------------------------

describe('ThemeProvider', () => {
  afterEach(clearDom);

  test('provides default state via useTheme', () => {
    const { result } = renderHook(
      () => {
        return useTheme();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultTheme="bruttal" defaultMode="light">
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    expect(result.current.themeId).toBe('bruttal');
    expect(result.current.mode).toBe('light');
    expect(result.current.resolvedMode).toBe('light');
  });

  test('applies attributes to documentElement', () => {
    render(
      <ThemeProvider defaultTheme="aurora" defaultMode="dark">
        <div>child</div>
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBe(
      'aurora'
    );
    expect(document.documentElement.getAttribute(DATA_MODE_ATTR)).toBe('dark');
  });

  test('setTheme updates state and DOM', () => {
    const { result } = renderHook(
      () => {
        return useTheme();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultTheme="default" defaultMode="light">
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    act(() => {
      result.current.setTheme('neon');
    });

    expect(result.current.themeId).toBe('neon');
    expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBe('neon');
  });

  test('setMode updates state and DOM', () => {
    const { result } = renderHook(
      () => {
        return useTheme();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultTheme="default" defaultMode="light">
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    act(() => {
      result.current.setMode('dark');
    });

    expect(result.current.mode).toBe('dark');
    expect(result.current.resolvedMode).toBe('dark');
    expect(document.documentElement.getAttribute(DATA_MODE_ATTR)).toBe('dark');
  });

  test('persists theme changes to localStorage', () => {
    const { result } = renderHook(
      () => {
        return useTheme();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultTheme="default" defaultMode="light">
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    act(() => {
      result.current.setTheme('terra');
    });

    const stored = JSON.parse(localStorage.getItem(DEFAULT_STORAGE_KEY)!);
    expect(stored.themeId).toBe('terra');
  });
});

// ---------------------------------------------------------------------------
// useTheme outside provider
// ---------------------------------------------------------------------------

describe('useTheme', () => {
  test('throws when used outside ThemeProvider', () => {
    // Suppress React error boundary console output
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => {
        return useTheme();
      });
    }).toThrow('useTheme must be used within a <ThemeProvider>');

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// ThemeScript
// ---------------------------------------------------------------------------

describe('ThemeScript', () => {
  test('renders a script tag', () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector('script');
    expect(script).not.toBeNull();
  });

  test('script contains bootstrap code', () => {
    const { container } = render(<ThemeScript />);
    const script = container.querySelector('script');
    expect(script?.innerHTML).toContain('data-tt-theme');
    expect(script?.innerHTML).toContain('data-tt-mode');
  });

  test('passes custom defaults to script', () => {
    const { container } = render(
      <ThemeScript defaultTheme="bruttal" defaultMode="dark" />
    );
    const script = container.querySelector('script');
    expect(script?.innerHTML).toContain('"bruttal"');
    expect(script?.innerHTML).toContain('"dark"');
  });

  test('passes nonce to script tag', () => {
    const { container } = render(<ThemeScript nonce="abc123" />);
    const script = container.querySelector('script');
    expect(script?.getAttribute('nonce')).toBe('abc123');
  });
});
