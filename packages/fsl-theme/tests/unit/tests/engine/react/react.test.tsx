/**
 * @jest-environment jsdom
 */

import { act, render, renderHook } from '@ttoss/test-utils/react';
import type * as React from 'react';

import { baseBundle } from '../../../../../src/baseBundle';
import { createTheme } from '../../../../../src/createTheme';
import { useDatavizTokens } from '../../../../../src/dataviz/useDatavizTokens';
import { withDataviz } from '../../../../../src/dataviz/withDataviz';
import {
  ThemeHead,
  ThemeProvider,
  ThemeScript,
  ThemeStyles,
  useColorMode,
  useResolvedTokens,
  useTokens,
} from '../../../../../src/react';
import { DATA_MODE_ATTR, DATA_THEME_ATTR } from '../../../../../src/runtime';
import { clearDom, matchMediaMockImpl } from '../../../fixtures/dom';

// jsdom does not implement matchMedia reliably — provide a stable light-mode mock
// so all tests that create a ThemeProvider (which internally creates a runtime) are
// deterministic regardless of the host OS colour scheme preference.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(matchMediaMockImpl()),
});

const defaultBundle = baseBundle;
const defaultWithDataviz = withDataviz(baseBundle);

// ---------------------------------------------------------------------------
// ThemeProvider
// ---------------------------------------------------------------------------

describe('ThemeProvider', () => {
  afterEach(clearDom);

  test('provides default state via useColorMode', () => {
    const { result } = renderHook(
      () => {
        return useColorMode();
      },
      {
        wrapper: ({ children }) => {
          return <ThemeProvider defaultMode="light">{children}</ThemeProvider>;
        },
      }
    );

    expect(result.current.mode).toBe('light');
    expect(result.current.resolvedMode).toBe('light');
  });

  test('applies attributes to documentElement', () => {
    render(
      <ThemeProvider defaultMode="dark">
        <div>child</div>
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBeNull();
    expect(document.documentElement.getAttribute(DATA_MODE_ATTR)).toBe('dark');
  });

  test('setMode updates state and DOM', () => {
    const { result } = renderHook(
      () => {
        return useColorMode();
      },
      {
        wrapper: ({ children }) => {
          return <ThemeProvider defaultMode="light">{children}</ThemeProvider>;
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

  test('throws when used outside ThemeProvider', () => {
    // Suppress React error boundary console output
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => {
        return useColorMode();
      });
    }).toThrow('useColorMode must be used within a <ThemeProvider>');

    consoleSpy.mockRestore();
  });

  test('resolvedMode defaults to light when defaultMode is omitted', () => {
    // defaultMode defaults to 'system'; in jsdom (no real matchMedia) this
    // resolves to 'light' — verifies the SSR state initialisation path.
    const { result } = renderHook(
      () => {
        return useColorMode();
      },
      {
        wrapper: ({ children }) => {
          return <ThemeProvider>{children}</ThemeProvider>;
        },
      }
    );
    expect(result.current.resolvedMode).toBe('light');
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
  afterEach(clearDom);

  test('defaultMode prop is only read on initial mount (not reactive)', () => {
    let providerMode: 'light' | 'dark' = 'light';

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <ThemeProvider defaultMode={providerMode}>{children}</ThemeProvider>
      );
    };

    const { result, rerender } = renderHook(
      () => {
        return useColorMode();
      },
      { wrapper: Wrapper }
    );

    expect(result.current.mode).toBe('light');

    // Changing the prop after mount does NOT recreate the runtime.
    // defaultMode is an initial-mount-only value, consistent with its JSDoc.
    providerMode = 'dark';
    rerender();

    expect(result.current.mode).toBe('light');
  });

  test('themeId prop is reactive — updates data-tt-theme on change', () => {
    let providerThemeId = 'alpha';

    const Wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <ThemeProvider themeId={providerThemeId} defaultMode="light">
          {children}
        </ThemeProvider>
      );
    };

    const { rerender } = renderHook(
      () => {
        return null;
      },
      { wrapper: Wrapper }
    );

    expect(document.documentElement.getAttribute('data-tt-theme')).toBe(
      'alpha'
    );

    providerThemeId = 'beta';
    rerender();

    expect(document.documentElement.getAttribute('data-tt-theme')).toBe('beta');
  });

  // Regression: the provider used to inject CSS scoped to `:root` regardless of
  // `themeId`, breaking the documented MFE / Storybook-harmony contract — the
  // `data-tt-theme` attribute was written to the DOM but no CSS selector used it.
  //
  // We query the whole document because React 19 hoists `<style precedence>`
  // to `<head>` in real browsers but jsdom may render it inline as a child
  // of the rendering container — the assertion is on the CSS *content*, not
  // the placement.
  test('injected <style> is scoped to [data-tt-theme="<id>"] when themeId is provided', () => {
    renderHook(
      () => {
        return null;
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider theme={defaultBundle} themeId="corporate">
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => {
        return s.textContent ?? '';
      })
      .join('\n');

    expect(styles).toContain('[data-tt-theme="corporate"]');
  });

  test('injected <style> targets :root when themeId is omitted (canonical case)', () => {
    renderHook(
      () => {
        return null;
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider theme={defaultBundle}>{children}</ThemeProvider>
          );
        },
      }
    );

    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => {
        return s.textContent ?? '';
      })
      .join('\n');

    expect(styles).toMatch(/:root\s*\{/);
    expect(styles).not.toContain('[data-tt-theme=');
  });
});

// ---------------------------------------------------------------------------
// SSR style injection — hoistable <style> carries a stable href (React 19
// dedup key). Without href the same :root block duplicates per provider.
// ---------------------------------------------------------------------------

describe('SSR style injection (href dedup key)', () => {
  test('ThemeProvider server-renders a hoistable <style> keyed on a stable href + the CSS', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      <ThemeProvider theme={defaultBundle}>
        <div />
      </ThemeProvider>
    );
    expect(html).toContain(':root');
    // React reflects the hoist key as `href` or `data-href` depending on
    // renderer; assert on the stable key value, not the attribute spelling.
    expect(html).toMatch(/href="tt-theme-root"/);
  });

  test('themeId scopes the href so distinct themes coexist (no dedup collision)', async () => {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(
      <ThemeProvider theme={defaultBundle} themeId="brand-a">
        <div />
      </ThemeProvider>
    );
    expect(html).toMatch(/href="tt-theme-brand-a"/);
    expect(html).toContain('[data-tt-theme="brand-a"]');
  });
});

// ---------------------------------------------------------------------------
// useTokens
// ---------------------------------------------------------------------------

describe('useTokens', () => {
  afterEach(clearDom);

  test('returns semantic tokens for the active theme', () => {
    const { result } = renderHook(
      () => {
        return useTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={defaultBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    expect(result.current.colors).toBeDefined();
    expect(result.current.elevation).toBeDefined();
    expect(result.current.text).toBeDefined();
    expect(result.current.spacing).toBeDefined();
  });

  test('semantic tokens do not expose core', () => {
    const { result } = renderHook(
      () => {
        return useTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={defaultBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    // SemanticTokens type has no `core` property — verify at runtime too
    expect((result.current as Record<string, unknown>)['core']).toBeUndefined();
  });

  test('returns dark-mode semantic tokens when resolvedMode is dark', () => {
    const { result } = renderHook(
      () => {
        return useTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="dark" theme={defaultBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    // Dark mode remaps informational.primary.background to a dark neutral
    const bg =
      result.current.colors.informational?.primary?.background?.default;
    expect(bg).not.toBe(
      defaultBundle.base.semantic.colors.informational?.primary?.background
        ?.default
    );
  });

  test('throws when theme prop is missing', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(
        () => {
          return useTokens();
        },
        {
          wrapper: ({ children }) => {
            return (
              <ThemeProvider defaultMode="light">{children}</ThemeProvider>
            );
          },
        }
      );
    }).toThrow('useTokens requires a <ThemeProvider theme={...}>');

    consoleSpy.mockRestore();
  });

  test('throws when used outside ThemeProvider', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => {
        return useTokens();
      });
    }).toThrow('useTokens must be used within a <ThemeProvider>');

    consoleSpy.mockRestore();
  });

  test('light→dark→light: returns to original token values', () => {
    // Verifies resolveSemanticTokens + deepMerge idempotency through the
    // full React context cycle.
    const { result } = renderHook(
      () => {
        return { theme: useColorMode(), tokens: useTokens() };
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={defaultBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    const lightBg =
      result.current.tokens.colors.informational?.primary?.background?.default;

    act(() => {
      result.current.theme.setMode('dark');
    });
    const darkBg =
      result.current.tokens.colors.informational?.primary?.background?.default;
    expect(darkBg).not.toBe(lightBg);

    act(() => {
      result.current.theme.setMode('light');
    });
    const restoredBg =
      result.current.tokens.colors.informational?.primary?.background?.default;
    expect(restoredBg).toBe(lightBg);
  });
});

// ---------------------------------------------------------------------------
// useDatavizTokens (Phase 8.1)
// ---------------------------------------------------------------------------

describe('useDatavizTokens', () => {
  afterEach(clearDom);

  const datavizBundle = defaultWithDataviz;

  test('returns dataviz tokens for theme with dataviz extension', () => {
    const { result } = renderHook(
      () => {
        return useDatavizTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={datavizBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    expect(result.current.color).toBeDefined();
    expect(result.current.color.series).toBeDefined();
    expect(result.current.color.series[1]).toBeDefined();
    expect(result.current.encoding).toBeDefined();
    expect(result.current.geo).toBeDefined();
  });

  test('throws descriptive error when theme has no dataviz extension', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(
        () => {
          return useDatavizTokens();
        },
        {
          wrapper: ({ children }) => {
            return (
              <ThemeProvider defaultMode="light" theme={defaultBundle}>
                {children}
              </ThemeProvider>
            );
          },
        }
      );
    }).toThrow(
      /useDatavizTokens: the active theme does not include the dataviz extension/
    );

    consoleSpy.mockRestore();
  });

  test('throws when theme prop is missing', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(
        () => {
          return useDatavizTokens();
        },
        {
          wrapper: ({ children }) => {
            return (
              <ThemeProvider defaultMode="light">{children}</ThemeProvider>
            );
          },
        }
      );
    }).toThrow('useTokens requires a <ThemeProvider theme={...}>');

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// theme prop
// ---------------------------------------------------------------------------

describe('ThemeProvider theme prop', () => {
  afterEach(clearDom);

  test('enables useTokens', () => {
    const { result } = renderHook(
      () => {
        return useTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider theme={defaultBundle}>{children}</ThemeProvider>
          );
        },
      }
    );

    expect(result.current.colors).toBeDefined();
    expect(result.current.elevation).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// useColorMode
// ---------------------------------------------------------------------------

describe('useColorMode', () => {
  afterEach(clearDom);

  test('returns mode state', () => {
    const { result } = renderHook(
      () => {
        return useColorMode();
      },
      {
        wrapper: ({ children }) => {
          return <ThemeProvider defaultMode="light">{children}</ThemeProvider>;
        },
      }
    );

    expect(result.current.mode).toBe('light');
    expect(result.current.resolvedMode).toBe('light');
    expect(typeof result.current.setMode).toBe('function');
  });

  test('setMode updates mode state', () => {
    const { result } = renderHook(
      () => {
        return useColorMode();
      },
      {
        wrapper: ({ children }) => {
          return <ThemeProvider defaultMode="light">{children}</ThemeProvider>;
        },
      }
    );

    act(() => {
      result.current.setMode('dark');
    });

    expect(result.current.mode).toBe('dark');
    expect(result.current.resolvedMode).toBe('dark');
  });

  test('throws when used outside ThemeProvider', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => {
        return useColorMode();
      });
    }).toThrow('useColorMode must be used within a <ThemeProvider>');

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// useResolvedTokens
// ---------------------------------------------------------------------------

describe('useResolvedTokens', () => {
  afterEach(clearDom);

  test('returns flat map of semantic.* keys with resolved values', () => {
    const { result } = renderHook(
      () => {
        return useResolvedTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={defaultBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    const keys = Object.keys(result.current);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key.startsWith('semantic.')).toBe(true);
    }
  });

  test('values are raw (not unresolved token refs)', () => {
    const { result } = renderHook(
      () => {
        return useResolvedTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={defaultBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    for (const value of Object.values(result.current)) {
      if (typeof value === 'string') {
        expect(value).not.toMatch(/^\{.+\}$/);
      }
    }
  });

  test('dark mode returns different resolved values for mode-sensitive tokens', () => {
    const { result: lightResult } = renderHook(
      () => {
        return useResolvedTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={defaultBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    const { result: darkResult } = renderHook(
      () => {
        return useResolvedTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="dark" theme={defaultBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    const lightValues = lightResult.current;
    const darkValues = darkResult.current;
    const allKeys = Object.keys(lightValues);
    const hasDiff = allKeys.some((k) => {
      return lightValues[k] !== darkValues[k];
    });
    expect(hasDiff).toBe(true);
  });

  test('throws when theme prop is missing', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(
        () => {
          return useResolvedTokens();
        },
        {
          wrapper: ({ children }) => {
            return (
              <ThemeProvider defaultMode="light">{children}</ThemeProvider>
            );
          },
        }
      );
    }).toThrow('useResolvedTokens requires a <ThemeProvider theme={...}>');

    consoleSpy.mockRestore();
  });

  test('throws when used outside ThemeProvider', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => {
        return useResolvedTokens();
      });
    }).toThrow('useResolvedTokens must be used within a <ThemeProvider>');

    consoleSpy.mockRestore();
  });

  test('applies coarse-pointer hit overrides when any-pointer: coarse matches', () => {
    // Simulate coarse pointer (touch device)
    jest
      .mocked(window.matchMedia)
      .mockImplementation(matchMediaMockImpl({ coarsePointer: true }));

    const { result } = renderHook(
      () => {
        return useResolvedTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={defaultBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    // Coarse hit values should be the raw core.sizing.hit.coarse values
    const coarseBase = defaultBundle.base.core.sizing.hit.coarse.base;
    expect(result.current['semantic.sizing.hit.base']).toBe(coarseBase);
    expect(result.current['semantic.sizing.hit.min']).toBe(
      defaultBundle.base.core.sizing.hit.coarse.min
    );
    expect(result.current['semantic.sizing.hit.prominent']).toBe(
      defaultBundle.base.core.sizing.hit.coarse.prominent
    );

    // Restore default mock
    jest.mocked(window.matchMedia).mockImplementation(matchMediaMockImpl());
  });

  test('uses fine-pointer hit values when any-pointer: coarse does not match', () => {
    // Default mock: no coarse pointer
    jest.mocked(window.matchMedia).mockImplementation(matchMediaMockImpl());

    const { result } = renderHook(
      () => {
        return useResolvedTokens();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={defaultBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    // Fine hit values — these are clamp() expressions resolved from core.sizing.hit.fine
    const fineBase = defaultBundle.base.core.sizing.hit.fine.base;
    expect(result.current['semantic.sizing.hit.base']).toBe(fineBase);
  });
});

// ---------------------------------------------------------------------------
// onModeChange callback
// ---------------------------------------------------------------------------

describe('ThemeProvider onModeChange', () => {
  afterEach(clearDom);

  test('does NOT fire on initial mount', () => {
    const onModeChange = jest.fn();

    renderHook(
      () => {
        return useColorMode();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" onModeChange={onModeChange}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    expect(onModeChange).not.toHaveBeenCalled();
  });

  test('fires after setMode is called', () => {
    const onModeChange = jest.fn();

    const { result } = renderHook(
      () => {
        return useColorMode();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" onModeChange={onModeChange}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    act(() => {
      result.current.setMode('dark');
    });

    expect(onModeChange).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenCalledWith('dark', 'dark');
  });

  test('receives both mode and resolvedMode', () => {
    const onModeChange = jest.fn();

    const { result } = renderHook(
      () => {
        return useColorMode();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" onModeChange={onModeChange}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    act(() => {
      result.current.setMode('dark');
    });

    const [mode, resolvedMode] = onModeChange.mock.calls[0];
    expect(mode).toBe('dark');
    expect(resolvedMode).toBe('dark');
  });

  test('fires again on subsequent mode changes', () => {
    const onModeChange = jest.fn();

    const { result } = renderHook(
      () => {
        return useColorMode();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" onModeChange={onModeChange}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    act(() => {
      result.current.setMode('dark');
    });
    act(() => {
      result.current.setMode('light');
    });

    expect(onModeChange).toHaveBeenCalledTimes(2);
    expect(onModeChange.mock.calls[1]).toEqual(['light', 'light']);
  });

  test('onModeChange does NOT fire when root prop changes from undefined to element', () => {
    const onModeChange = jest.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const Wrapper = ({ root }: { root: HTMLElement | undefined }) => {
      return (
        <ThemeProvider
          defaultMode="light"
          theme={defaultBundle}
          root={root}
          onModeChange={onModeChange}
        >
          <div />
        </ThemeProvider>
      );
    };

    const { rerender, unmount } = render(<Wrapper root={undefined} />);

    // Simulate ref becoming available (Storybook pattern: undefined → element)
    rerender(<Wrapper root={container} />);

    // onModeChange must NOT fire — no user action, no mode change
    expect(onModeChange).not.toHaveBeenCalled();

    unmount();
    container.remove();
  });

  test('onModeChange fires after mode change following root transition', () => {
    const onModeChange = jest.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const { result, rerender, unmount } = renderHook(
      () => {
        return useColorMode();
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider
              defaultMode="light"
              theme={defaultBundle}
              root={container}
              onModeChange={onModeChange}
            >
              <div />
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    // Trigger a re-render (simulating root transition)
    rerender();

    // Now trigger a real mode change
    act(() => {
      result.current.setMode('dark');
    });

    expect(onModeChange).toHaveBeenCalledTimes(1);
    expect(onModeChange).toHaveBeenCalledWith('dark', 'dark');

    unmount();
    container.remove();
  });

  test('onModeChange does NOT fire when root changes multiple times without mode change', () => {
    const onModeChange = jest.fn();
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    document.body.appendChild(container1);
    document.body.appendChild(container2);

    const Wrapper = ({ root }: { root: HTMLElement | undefined }) => {
      return (
        <ThemeProvider
          defaultMode="dark"
          theme={defaultBundle}
          root={root}
          onModeChange={onModeChange}
        >
          <div />
        </ThemeProvider>
      );
    };

    const { rerender, unmount } = render(<Wrapper root={undefined} />);
    rerender(<Wrapper root={container1} />);
    rerender(<Wrapper root={container2} />);

    expect(onModeChange).not.toHaveBeenCalled();

    unmount();
    container1.remove();
    container2.remove();
  });
});

// ---------------------------------------------------------------------------
// root prop
// ---------------------------------------------------------------------------

describe('ThemeProvider root prop', () => {
  afterEach(clearDom);

  test('applies attributes to the custom root element (proper cleanup)', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const { unmount } = render(
      <ThemeProvider defaultMode="dark" root={container}>
        <div>child</div>
      </ThemeProvider>
    );

    expect(container.getAttribute(DATA_THEME_ATTR)).toBeNull();
    expect(container.getAttribute(DATA_MODE_ATTR)).toBe('dark');
    expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBeNull();

    // Unmount React before removing DOM — ensures runtime cleanup runs first
    unmount();
    container.remove();
  });

  test('root prop transition applies attributes to new element, removes from documentElement', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const Wrapper = ({ root }: { root: HTMLElement | undefined }) => {
      return (
        <ThemeProvider defaultMode="light" root={root}>
          <div />
        </ThemeProvider>
      );
    };

    const { rerender, unmount } = render(<Wrapper root={undefined} />);

    // Before root: attributes on documentElement
    expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBeNull();

    rerender(<Wrapper root={container} />);

    // After root transition: attributes on container, NOT on documentElement
    // (documentElement was set by the first runtime; after recreate it targets container)
    expect(container.getAttribute(DATA_THEME_ATTR)).toBeNull();

    unmount();
    container.remove();
    document.documentElement.removeAttribute(DATA_THEME_ATTR);
    document.documentElement.removeAttribute(DATA_MODE_ATTR);
  });
});

// ---------------------------------------------------------------------------
// ThemeStyles
// ---------------------------------------------------------------------------

describe('ThemeStyles', () => {
  test('renders a style tag', () => {
    const { container } = render(
      <ThemeStyles theme={defaultBundle} themeId="default" />
    );
    const style = container.querySelector('style');
    expect(style).not.toBeNull();
  });

  test('style scoped to themeId selector', () => {
    const { container } = render(
      <ThemeStyles theme={defaultBundle} themeId="default" />
    );
    const style = container.querySelector('style');
    expect(style?.innerHTML).toContain('[data-tt-theme="default"]');
  });

  test('style targets :root when themeId is omitted', () => {
    const { container } = render(<ThemeStyles theme={defaultBundle} />);
    const style = container.querySelector('style');
    expect(style?.innerHTML).toContain(':root {');
    expect(style?.innerHTML).not.toContain('[data-tt-theme');
  });

  test('alternate mode uses :root[data-tt-mode] when themeId is omitted', () => {
    const { container } = render(<ThemeStyles theme={defaultBundle} />);
    const style = container.querySelector('style');
    expect(style?.innerHTML).toContain(':root[data-tt-mode="dark"]');
  });

  test('passes nonce to style tag', () => {
    const { container } = render(
      <ThemeStyles theme={defaultBundle} themeId="default" nonce="abc123" />
    );
    const style = container.querySelector('style');
    expect(style?.getAttribute('nonce')).toBe('abc123');
  });
});

// ---------------------------------------------------------------------------
// ThemeHead
// ---------------------------------------------------------------------------

describe('ThemeHead', () => {
  test('renders a script tag and a style tag', () => {
    const { container } = render(<ThemeHead theme={defaultBundle} />);
    expect(container.querySelector('script')).not.toBeNull();
    expect(container.querySelector('style')).not.toBeNull();
  });

  test('style targets :root when themeId is omitted', () => {
    const { container } = render(<ThemeHead theme={defaultBundle} />);
    const style = container.querySelector('style');
    expect(style?.innerHTML).toContain(':root {');
    expect(style?.innerHTML).not.toContain('[data-tt-theme');
  });

  test('style scoped to themeId when provided', () => {
    const { container } = render(
      <ThemeHead theme={defaultBundle} themeId="default" />
    );
    const style = container.querySelector('style');
    expect(style?.innerHTML).toContain('[data-tt-theme="default"]');
  });

  test('passes nonce to both script and style', () => {
    const { container } = render(
      <ThemeHead theme={defaultBundle} nonce="xyz" />
    );
    expect(container.querySelector('script')?.getAttribute('nonce')).toBe(
      'xyz'
    );
    expect(container.querySelector('style')?.getAttribute('nonce')).toBe('xyz');
  });

  test('passes defaultMode to ThemeScript', () => {
    const { container } = render(
      <ThemeHead theme={defaultBundle} defaultMode="dark" />
    );
    const script = container.querySelector('script');
    expect(script?.innerHTML).toContain('"dark"');
  });
});

// ---------------------------------------------------------------------------
// DEV-only warnings — root/themeId pairing and hoisted-style dedup mismatch
// ---------------------------------------------------------------------------

describe('ThemeProvider DEV warnings', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    clearDom();
  });

  test('warns when root is passed without themeId', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    render(
      <ThemeProvider theme={defaultBundle} root={container}>
        <div>child</div>
      </ThemeProvider>
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('`root` was passed without `themeId`')
    );
    container.remove();
  });

  test('does not warn when root is paired with themeId', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    render(
      <ThemeProvider theme={defaultBundle} themeId="scoped" root={container}>
        <div>child</div>
      </ThemeProvider>
    );

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('`root` was passed without `themeId`')
    );
    container.remove();
  });

  test('warns when two providers with different themes share the same style href', () => {
    const themeA = createTheme({
      overrides: { core: { colors: { brand: { 500: '#AA0000' } } } },
    });
    const themeB = createTheme({
      overrides: { core: { colors: { brand: { 500: '#00BB00' } } } },
    });

    render(
      <>
        <ThemeProvider theme={themeA}>
          <div>a</div>
        </ThemeProvider>
        <ThemeProvider theme={themeB}>
          <div>b</div>
        </ThemeProvider>
      </>
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('share the same style key')
    );
  });

  test('does not warn for two providers with distinct themeIds', () => {
    const themeA = createTheme({
      overrides: { core: { colors: { brand: { 500: '#AA0000' } } } },
    });
    const themeB = createTheme({
      overrides: { core: { colors: { brand: { 500: '#00BB00' } } } },
    });

    render(
      <>
        <ThemeProvider theme={themeA} themeId="brand-a">
          <div>a</div>
        </ThemeProvider>
        <ThemeProvider theme={themeB} themeId="brand-b">
          <div>b</div>
        </ThemeProvider>
      </>
    );

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('share the same style key')
    );
  });

  test('does not warn when the same theme is re-rendered (dedup is intended)', () => {
    const { rerender } = render(
      <ThemeProvider theme={defaultBundle}>
        <div>a</div>
      </ThemeProvider>
    );
    rerender(
      <ThemeProvider theme={defaultBundle}>
        <div>b</div>
      </ThemeProvider>
    );

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('share the same style key')
    );
  });
});

// ---------------------------------------------------------------------------
// systemModeFallback derivation from defaultMode
// ---------------------------------------------------------------------------

describe('OS-preference fallback follows defaultMode', () => {
  // renderToStaticMarkup sidesteps React 19's per-document hoisted-style
  // cache, which would swallow repeat injections of the same href in jsdom.
  const staticMarkup = (node: React.ReactElement): string => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { renderToStaticMarkup } = require('react-dom/server');
    return renderToStaticMarkup(node);
  };

  test('ThemeProvider: system default emits the fallback; fixed light does not', () => {
    const system = staticMarkup(
      <ThemeProvider theme={defaultBundle}>
        <div>x</div>
      </ThemeProvider>
    );
    const light = staticMarkup(
      <ThemeProvider theme={defaultBundle} defaultMode="light">
        <div>x</div>
      </ThemeProvider>
    );

    expect(system).toContain('@media (prefers-color-scheme: dark)');
    expect(light).not.toContain('@media (prefers-color-scheme:');
  });

  test('ThemeHead derives the gate from its defaultMode', () => {
    const fixedDark = staticMarkup(
      <ThemeHead theme={defaultBundle} defaultMode="dark" />
    );
    const system = staticMarkup(<ThemeHead theme={defaultBundle} />);

    expect(fixedDark).not.toContain('@media (prefers-color-scheme:');
    expect(system).toContain('@media (prefers-color-scheme: dark)');
  });

  test('ThemeStyles exposes an explicit systemModeFallback prop', () => {
    const suppressed = staticMarkup(
      <ThemeStyles theme={defaultBundle} systemModeFallback={false} />
    );
    expect(suppressed).not.toContain('@media (prefers-color-scheme:');
  });
});

// ---------------------------------------------------------------------------
// root as RefObject — no transient attach to <html>
// ---------------------------------------------------------------------------

describe('ThemeProvider root as RefObject', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    clearDom();
  });

  test('attaches directly to the ref element with no transient <html> attach', () => {
    // Manual ref object + callback ref — the file imports React as type-only.
    const rootRef: { current: HTMLDivElement | null } = { current: null };

    render(
      <ThemeProvider theme={defaultBundle} defaultMode="light">
        <div
          ref={(el) => {
            rootRef.current = el;
          }}
          data-testid="scope"
        >
          <ThemeProvider
            theme={defaultBundle}
            themeId="scoped"
            defaultMode="light"
            root={rootRef}
          >
            <div>x</div>
          </ThemeProvider>
        </div>
      </ThemeProvider>
    );

    const scope = document.querySelector('[data-testid="scope"]');
    expect(scope?.getAttribute(DATA_MODE_ATTR)).toBe('light');
    expect(scope?.getAttribute(DATA_THEME_ATTR)).toBe('scoped');
    // The outer provider owns <html>; the scoped one never touched it.
    expect(document.documentElement.getAttribute(DATA_THEME_ATTR)).toBeNull();
    // No spurious multi-runtime warning — the ref form never attaches to <html>.
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Multiple theme runtimes')
    );
  });
});
