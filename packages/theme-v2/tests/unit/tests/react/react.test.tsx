/**
 * @jest-environment jsdom
 */

import { act, render, renderHook } from '@ttoss/test-utils/react';
import type * as React from 'react';

import { ThemeProvider, ThemeScript, useTheme, useTokens } from '../../../../src/react';
import { useDatavizTokens } from '../../../../src/dataviz/useDatavizTokens';
import {
  DATA_MODE_ATTR,
  DATA_THEME_ATTR,
  DEFAULT_STORAGE_KEY,
} from '../../../../src/runtime';
import { defaultBundle, auroraBundle } from '../../../../src/themes';
import { defaultWithDataviz } from '../../../../src/dataviz/themes';

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

  test('preserves user-set theme across re-renders with same props', () => {
    const { result, rerender } = renderHook(
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

    // Change theme via setter
    act(() => {
      result.current.setTheme('neon');
    });
    expect(result.current.themeId).toBe('neon');

    // Re-render with different defaultTheme prop — should NOT reset to aurora
    rerender();
    expect(result.current.themeId).toBe('neon');
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

// ---------------------------------------------------------------------------
// ThemeProvider prop reactivity
// ---------------------------------------------------------------------------

describe('ThemeProvider prop reactivity', () => {
  afterEach(() => {
    document.documentElement.removeAttribute(DATA_THEME_ATTR);
    document.documentElement.removeAttribute(DATA_MODE_ATTR);
    document.documentElement.style.colorScheme = '';
    localStorage.clear();
  });

  test('defaultTheme prop is only read on initial mount (not reactive)', () => {
    let providerTheme = 'bruttal';

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <ThemeProvider defaultTheme={providerTheme} defaultMode="light">
          {children}
        </ThemeProvider>
      );
    };

    const { result, rerender } = renderHook(
      () => {
        return useTheme();
      },
      { wrapper: Wrapper }
    );

    expect(result.current.themeId).toBe('bruttal');

    // Changing the prop after mount does NOT recreate the runtime.
    // defaultTheme is an initial-mount-only value, consistent with its JSDoc.
    providerTheme = 'aurora';
    rerender();

    expect(result.current.themeId).toBe('bruttal');
  });
});

// ---------------------------------------------------------------------------
// useTokens
// ---------------------------------------------------------------------------

describe('useTokens', () => {
  afterEach(() => {
    document.documentElement.removeAttribute(DATA_THEME_ATTR);
    document.documentElement.removeAttribute(DATA_MODE_ATTR);
    localStorage.clear();
  });

  const registeredBundles = { default: defaultBundle, aurora: auroraBundle };

  test('returns semantic tokens for the active theme', () => {
    const { result } = renderHook(() => useTokens(), {
      wrapper: ({ children }) => (
        <ThemeProvider
          defaultTheme="default"
          defaultMode="light"
          bundles={registeredBundles}
        >
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current.colors).toBeDefined();
    expect(result.current.elevation).toBeDefined();
    expect(result.current.text).toBeDefined();
    expect(result.current.spacing).toBeDefined();
  });

  test('semantic tokens do not expose core', () => {
    const { result } = renderHook(() => useTokens(), {
      wrapper: ({ children }) => (
        <ThemeProvider
          defaultTheme="default"
          defaultMode="light"
          bundles={registeredBundles}
        >
          {children}
        </ThemeProvider>
      ),
    });

    // SemanticTokens type has no `core` property — verify at runtime too
    expect((result.current as Record<string, unknown>)['core']).toBeUndefined();
  });

  test('returns dark-mode semantic tokens when resolvedMode is dark', () => {
    const { result } = renderHook(() => useTokens(), {
      wrapper: ({ children }) => (
        <ThemeProvider
          defaultTheme="default"
          defaultMode="dark"
          bundles={registeredBundles}
        >
          {children}
        </ThemeProvider>
      ),
    });

    // Dark mode remaps content.primary.background to a dark neutral
    const bg = result.current.colors.content?.primary?.background?.default;
    expect(bg).not.toBe(defaultBundle.base.semantic.colors.content?.primary?.background?.default);
  });

  test('throws when bundles prop is missing', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTokens(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="default" defaultMode="light">
            {children}
          </ThemeProvider>
        ),
      });
    }).toThrow('useTokens requires a <ThemeProvider> with a `bundles` prop');

    consoleSpy.mockRestore();
  });

  test('throws when used outside ThemeProvider', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTokens());
    }).toThrow('useTokens must be used within a <ThemeProvider>');

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// useDatavizTokens (Phase 8.1)
// ---------------------------------------------------------------------------

describe('useDatavizTokens', () => {
  afterEach(() => {
    document.documentElement.removeAttribute(DATA_THEME_ATTR);
    document.documentElement.removeAttribute(DATA_MODE_ATTR);
    localStorage.clear();
  });

  const datavizBundle = {
    baseMode: 'light' as const,
    base: defaultWithDataviz,
  };

  const nonDatavizBundles = { default: defaultBundle };

  test('returns dataviz tokens for theme with dataviz extension', () => {
    const { result } = renderHook(() => useDatavizTokens(), {
      wrapper: ({ children }) => (
        <ThemeProvider
          defaultTheme="default"
          defaultMode="light"
          bundles={{ default: datavizBundle }}
        >
          {children}
        </ThemeProvider>
      ),
    });

    expect(result.current.color).toBeDefined();
    expect(result.current.color.series).toBeDefined();
    expect(result.current.color.series[1]).toBeDefined();
    expect(result.current.encoding).toBeDefined();
    expect(result.current.geo).toBeDefined();
  });

  test('dataviz tokens have complete structure', () => {
    const { result } = renderHook(() => useDatavizTokens(), {
      wrapper: ({ children }) => (
        <ThemeProvider
          defaultTheme="default"
          defaultMode="light"
          bundles={{ default: datavizBundle }}
        >
          {children}
        </ThemeProvider>
      ),
    });

    // Series colors (1-8)
    expect(result.current.color.series[1]).toBeDefined();
    expect(result.current.color.series[8]).toBeDefined();

    // Sequential scale (1-7)
    expect(result.current.color.scale.sequential[1]).toBeDefined();
    expect(result.current.color.scale.sequential[7]).toBeDefined();

    // Diverging scale (neg3 to pos3)
    expect(result.current.color.scale.diverging.neg3).toBeDefined();
    expect(result.current.color.scale.diverging.neutral).toBeDefined();
    expect(result.current.color.scale.diverging.pos3).toBeDefined();

    // Encoding
    expect(result.current.encoding.shape).toBeDefined();
    expect(result.current.encoding.pattern).toBeDefined();
    expect(result.current.encoding.stroke).toBeDefined();
    expect(result.current.encoding.opacity).toBeDefined();

    // Geo
    expect(result.current.geo.context).toBeDefined();
    expect(result.current.geo.state).toBeDefined();
  });

  test('throws descriptive error when theme has no dataviz extension', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useDatavizTokens(), {
        wrapper: ({ children }) => (
          <ThemeProvider
            defaultTheme="default"
            defaultMode="light"
            bundles={nonDatavizBundles}
          >
            {children}
          </ThemeProvider>
        ),
      });
    }).toThrow(/useDatavizTokens: the active theme does not include the dataviz extension/);

    consoleSpy.mockRestore();
  });

  test('error message includes helpful instructions', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      renderHook(() => useDatavizTokens(), {
        wrapper: ({ children }) => (
          <ThemeProvider
            defaultTheme="default"
            defaultMode="light"
            bundles={nonDatavizBundles}
          >
            {children}
          </ThemeProvider>
        ),
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect((error as Error).message).toContain('withDataviz');
      expect((error as Error).message).toContain('Add dataviz tokens to your theme');
    }

    consoleSpy.mockRestore();
  });

  test('throws when bundles prop is missing', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useDatavizTokens(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="default" defaultMode="light">
            {children}
          </ThemeProvider>
        ),
      });
    }).toThrow('useTokens requires a <ThemeProvider> with a `bundles` prop');

    consoleSpy.mockRestore();
  });
});
