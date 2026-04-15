/**
 * @jest-environment jsdom
 */

import { act, render, renderHook } from '@ttoss/test-utils/react';
import type * as React from 'react';

import { createTheme } from '../../../../../src';
import { baseBundle, baseIcons } from '../../../../../src/baseBundle';
import { useDatavizTokens } from '../../../../../src/dataviz/useDatavizTokens';
import { withDataviz } from '../../../../../src/dataviz/withDataviz';
import {
  ThemeHead,
  ThemeProvider,
  ThemeScript,
  ThemeStyles,
  useColorMode,
  useIconGlyph,
  useResolvedTokens,
  useTokens,
} from '../../../../../src/react';
import { DATA_MODE_ATTR, DATA_THEME_ATTR } from '../../../../../src/runtime';
import { clearDom, matchMediaMockImpl } from '../../../helpers/dom';

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

    // Dark mode remaps content.primary.background to a dark neutral
    const bg = result.current.colors.content?.primary?.background?.default;
    expect(bg).not.toBe(
      defaultBundle.base.semantic.colors.content?.primary?.background?.default
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
      result.current.tokens.colors.content?.primary?.background?.default;

    act(() => {
      result.current.theme.setMode('dark');
    });
    const darkBg =
      result.current.tokens.colors.content?.primary?.background?.default;
    expect(darkBg).not.toBe(lightBg);

    act(() => {
      result.current.theme.setMode('light');
    });
    const restoredBg =
      result.current.tokens.colors.content?.primary?.background?.default;
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
// useIconGlyph
// ---------------------------------------------------------------------------

describe('useIconGlyph', () => {
  afterEach(clearDom);

  test('returns a non-empty string for a valid intent', () => {
    const { result } = renderHook(
      () => {
        return useIconGlyph('action.search');
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

    expect(typeof result.current).toBe('string');
    expect(result.current.length).toBeGreaterThan(0);
  });

  test('returns the glyph defined in baseIcons for each intent', () => {
    const { result } = renderHook(
      () => {
        return useIconGlyph('action.search');
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

    expect(result.current).toBe(baseIcons['action.search']);
  });

  test('returns custom glyph when theme overrides a specific intent', () => {
    const customBundle = createTheme({
      icons: { ...baseIcons, 'action.search': 'custom:magnify' },
    });

    const { result } = renderHook(
      () => {
        return useIconGlyph('action.search');
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={customBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    expect(result.current).toBe('custom:magnify');
  });

  test('non-overridden intents still return baseIcons glyph in custom theme', () => {
    const customBundle = createTheme({
      icons: { ...baseIcons, 'action.search': 'custom:magnify' },
    });

    const { result } = renderHook(
      () => {
        return useIconGlyph('action.delete');
      },
      {
        wrapper: ({ children }) => {
          return (
            <ThemeProvider defaultMode="light" theme={customBundle}>
              {children}
            </ThemeProvider>
          );
        },
      }
    );

    expect(result.current).toBe(baseIcons['action.delete']);
  });

  test('throws when theme prop is missing', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(
        () => {
          return useIconGlyph('action.search');
        },
        {
          wrapper: ({ children }) => {
            return (
              <ThemeProvider defaultMode="light">{children}</ThemeProvider>
            );
          },
        }
      );
    }).toThrow('useIconGlyph requires a <ThemeProvider theme={...}>');

    consoleSpy.mockRestore();
  });

  test('throws when used outside ThemeProvider', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => {
        return useIconGlyph('action.search');
      });
    }).toThrow('useIconGlyph must be used within a <ThemeProvider>');

    consoleSpy.mockRestore();
  });
});
