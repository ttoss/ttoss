import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  initialThemeState,
  type ThemeAction,
  themeReducer,
  ThemeStoreProvider,
  useThemeStore,
} from 'src/studio/theme/themeStore';

describe('themeReducer', () => {
  test('setColor adds an override and tags origin manual', () => {
    const next = themeReducer(initialThemeState, {
      type: 'setColor',
      hue: 'brand',
      step: '500',
      value: '#ff0000',
    });
    expect(next.colors).toEqual({ brand: { 500: '#ff0000' } });
    expect(next.origins['brand.500']).toBe('manual');
  });

  test('revertColor removes the override and its origin', () => {
    const edited = themeReducer(initialThemeState, {
      type: 'setColor',
      hue: 'brand',
      step: '500',
      value: '#ff0000',
    });
    const reverted = themeReducer(edited, {
      type: 'revertColor',
      hue: 'brand',
      step: '500',
    });
    expect(reverted.colors).toEqual({});
    expect(reverted.origins['brand.500']).toBeUndefined();
  });

  test('resetAll clears all overrides and origins', () => {
    const edited = themeReducer(initialThemeState, {
      type: 'setColor',
      hue: 'brand',
      step: '500',
      value: '#ff0000',
    });
    const reset = themeReducer(edited, { type: 'resetAll' });
    expect(reset.colors).toEqual({});
    expect(reset.origins).toEqual({});
  });

  test('setPreset switches preset and starts a fresh diff', () => {
    const edited = themeReducer(initialThemeState, {
      type: 'setColor',
      hue: 'brand',
      step: '500',
      value: '#ff0000',
    });
    const switched = themeReducer(edited, {
      type: 'setPreset',
      preset: 'bruttal',
    });
    expect(switched.preset).toBe('bruttal');
    expect(switched.colors).toEqual({});
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
              return store.setColor('brand', '500', '#123456');
            }}
          >
            edit
          </button>
          <span data-testid="origin">
            {String(store.origin('brand', '500'))}
          </span>
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
});
