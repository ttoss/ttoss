/**
 * @jest-environment jsdom
 */

/**
 * Colour-mode behaviour: useColorMode, onModeChange, the OS-preference
 * fallback and the development-only warnings.
 */

import { act, render, renderHook } from '@ttoss/test-utils/react';
import type * as React from 'react';

import { baseBundle } from '../../../../../src/baseBundle';
import { createTheme } from '../../../../../src/createTheme';
import {
  ThemeHead,
  ThemeProvider,
  ThemeStyles,
  useColorMode,
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
