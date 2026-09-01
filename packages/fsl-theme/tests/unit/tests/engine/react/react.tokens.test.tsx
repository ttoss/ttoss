/**
 * @jest-environment jsdom
 */

/**
 * Token access and emitted style output: useTokens, useDatavizTokens,
 * useResolvedTokens, ThemeStyles, ThemeHead and the preflight reset.
 */

import { act, render, renderHook } from '@ttoss/test-utils/react';

import { baseBundle } from '../../../../../src/baseBundle';
import {
  getPreflightStyles,
  PREFLIGHT_CSS,
  toCssVars,
} from '../../../../../src/css';
import { useDatavizTokens } from '../../../../../src/dataviz/useDatavizTokens';
import { withDataviz } from '../../../../../src/dataviz/withDataviz';
import {
  ThemeHead,
  ThemeProvider,
  ThemeReset,
  ThemeStyles,
  useColorMode,
  useResolvedTokens,
  useTokens,
} from '../../../../../src/react';
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

    // Coarse hit value should be the raw core.sizing.hit.coarse value
    expect(result.current['semantic.sizing.hit']).toBe(
      defaultBundle.base.core.sizing.hit.coarse
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

    // Fine hit value — a clamp() expression resolved from core.sizing.hit.fine
    expect(result.current['semantic.sizing.hit']).toBe(
      defaultBundle.base.core.sizing.hit.fine
    );
  });
});

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

describe('ThemeReset / preflight', () => {
  test('getPreflightStyles returns the preflight CSS', () => {
    expect(getPreflightStyles()).toBe(PREFLIGHT_CSS);
  });

  test('preflight resets box-sizing and binds the body to tokens', () => {
    expect(PREFLIGHT_CSS).toContain('box-sizing: border-box;');
    expect(PREFLIGHT_CSS).toContain(
      'var(--tt-colors-informational-primary-background-default)'
    );
    expect(PREFLIGHT_CSS).toContain('prefers-reduced-motion: reduce');
    // Layout-agnostic: the base declares no layout (that is fsl-ui / the app).
    expect(PREFLIGHT_CSS).not.toContain('display:');
    expect(PREFLIGHT_CSS).not.toContain('grid');
  });

  test('every var() the preflight reads is emitted by the theme CSS', () => {
    // Guard against emitter/preflight naming drift: the preflight is a static
    // string, so a rename in the emitter (toCssVarName) would otherwise make
    // its var() reads silently fall back (T-20). Every custom property the
    // preflight reads must exist in the vars record the emitter produces.
    const emittedVars = toCssVars(defaultBundle).base.cssVars;
    const readVars = [...PREFLIGHT_CSS.matchAll(/var\((--tt-[\w-]+)/g)].map(
      (match) => {
        return match[1];
      }
    );

    // Sanity: the body typography reads are among them.
    expect(readVars).toEqual(
      expect.arrayContaining([
        '--tt-text-body-md-fontFamily',
        '--tt-text-body-md-fontSize',
        '--tt-text-body-md-lineHeight',
      ])
    );

    for (const varName of readVars) {
      expect(emittedVars).toHaveProperty([varName]);
    }
  });

  test('ThemeReset injects the preflight into a <style> tag', () => {
    const { container } = render(<ThemeReset />);
    const style = container.querySelector('style');
    expect(style?.textContent).toBe(PREFLIGHT_CSS);
  });

  test('ThemeReset forwards a CSP nonce', () => {
    const { container } = render(<ThemeReset nonce="abc123" />);
    expect(container.querySelector('style')?.getAttribute('nonce')).toBe(
      'abc123'
    );
  });
});
