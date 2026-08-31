/**
 * @jest-environment jsdom
 */

/**
 * ThemeProvider itself: mounting, prop reactivity, SSR style injection and the
 * root target. Colour-mode behaviour lives in react.colorMode.test.tsx and
 * token/style output in react.tokens.test.tsx.
 */

import { act, render, renderHook } from '@ttoss/test-utils/react';
import type * as React from 'react';

import { baseBundle } from '../../../../../src/baseBundle';
import {
  ThemeProvider,
  ThemeScript,
  useColorMode,
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
