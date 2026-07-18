import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  initialThemeState,
  type ThemeAction,
  themeReducer,
  ThemeStoreProvider,
  useThemeStore,
} from 'src/studio/theme/themeStore';

const BRAND = 'core.colors.brand.500';

describe('themeReducer', () => {
  test('setToken adds an override and tags origin manual', () => {
    const next = themeReducer(initialThemeState, {
      type: 'setToken',
      path: BRAND,
      value: '#ff0000',
    });
    expect(next.overrides).toEqual({ [BRAND]: '#ff0000' });
    expect(next.origins[BRAND]).toBe('manual');
  });

  test('revertToken removes the override and its origin', () => {
    const edited = themeReducer(initialThemeState, {
      type: 'setToken',
      path: BRAND,
      value: '#ff0000',
    });
    const reverted = themeReducer(edited, {
      type: 'revertToken',
      path: BRAND,
    });
    expect(reverted.overrides).toEqual({});
    expect(reverted.origins[BRAND]).toBeUndefined();
  });

  test('resetAll clears all overrides and origins', () => {
    const edited = themeReducer(initialThemeState, {
      type: 'setToken',
      path: BRAND,
      value: '#ff0000',
    });
    const reset = themeReducer(edited, { type: 'resetAll' });
    expect(reset.overrides).toEqual({});
    expect(reset.origins).toEqual({});
  });

  test('setPreset switches preset and starts a fresh diff', () => {
    const edited = themeReducer(initialThemeState, {
      type: 'setToken',
      path: BRAND,
      value: '#ff0000',
    });
    const switched = themeReducer(edited, {
      type: 'setPreset',
      preset: 'bruttal',
    });
    expect(switched.preset).toBe('bruttal');
    expect(switched.overrides).toEqual({});
    expect(switched.origins).toEqual({});
  });

  test('setApplyToStudio toggles the flag', () => {
    const on = themeReducer(initialThemeState, {
      type: 'setApplyToStudio',
      value: true,
    });
    expect(on.applyToStudio).toBe(true);
  });

  test('unknown action returns state unchanged (defensive default)', () => {
    const bogus = { type: 'nope' } as unknown as ThemeAction;
    expect(themeReducer(initialThemeState, bogus)).toBe(initialThemeState);
  });
});

describe('useThemeStore', () => {
  test('throws when used outside a provider', () => {
    const Consumer = () => {
      useThemeStore();
      return null;
    };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      return render(<Consumer />);
    }).toThrow('useThemeStore must be used within a ThemeStoreProvider');
    spy.mockRestore();
  });

  test('tracks per-leaf origin', async () => {
    const user = userEvent.setup();
    const Probe = () => {
      const store = useThemeStore();
      return (
        <div>
          <button
            type="button"
            onClick={() => {
              return store.setToken(BRAND, '#123456');
            }}
          >
            edit
          </button>
          <span data-testid="origin">{String(store.origin(BRAND))}</span>
        </div>
      );
    };

    render(
      <ThemeStoreProvider>
        <Probe />
      </ThemeStoreProvider>
    );

    expect(screen.getByTestId('origin').textContent).toBe('undefined');
    await user.click(screen.getByRole('button', { name: 'edit' }));
    expect(screen.getByTestId('origin').textContent).toBe('manual');
  });

  test('accepts boot-time initial state (URL fork / draft restore)', () => {
    const Probe = () => {
      const store = useThemeStore();
      return (
        <div>
          <span data-testid="preset">{store.preset}</span>
          <span data-testid="value">{store.overrides[BRAND]}</span>
        </div>
      );
    };

    render(
      <ThemeStoreProvider
        initial={{ preset: 'minimalist', overrides: { [BRAND]: '#abcdef' } }}
      >
        <Probe />
      </ThemeStoreProvider>
    );

    expect(screen.getByTestId('preset').textContent).toBe('minimalist');
    expect(screen.getByTestId('value').textContent).toBe('#abcdef');
  });

  test('exposes broken refs and dark contrast for the live bundle', async () => {
    const user = userEvent.setup();
    const Probe = () => {
      const store = useThemeStore();
      return (
        <div>
          <button
            type="button"
            onClick={() => {
              return store.setToken(
                'semantic.radii.control',
                '{core.radii.nope}'
              );
            }}
          >
            break
          </button>
          <span data-testid="broken">{store.brokenRefs.join(',')}</span>
          <span data-testid="dark-count">{store.contrast.dark.length}</span>
        </div>
      );
    };

    render(
      <ThemeStoreProvider>
        <Probe />
      </ThemeStoreProvider>
    );

    // The base theme resolves cleanly, and a dark alternate yields dark rows.
    expect(screen.getByTestId('broken').textContent).toBe('');
    expect(
      Number(screen.getByTestId('dark-count').textContent)
    ).toBeGreaterThan(0);

    // A remap to a nonexistent core ref surfaces as a broken token.
    await user.click(screen.getByRole('button', { name: 'break' }));
    expect(screen.getByTestId('broken').textContent).toContain(
      'semantic.radii.control'
    );
  });
});
