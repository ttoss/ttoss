import { defaultTheme } from './defaultTheme';
import { renderHook } from '@ttoss/test-utils';
import { useTheme } from './useTheme';
import ThemeProvider from './ThemeProvider';

test('should return default theme colors', () => {
  const { result } = renderHook(() => useTheme(), {
    wrapper: ThemeProvider,
    initialProps: { theme: {} },
  });

  expect(result.current.theme.colors).toEqual(defaultTheme.colors);
});

test('should return new theme colors', () => {
  const newColor = '#000';

  const { result } = renderHook(() => useTheme(), {
    wrapper: ThemeProvider,
    initialProps: {
      theme: {
        colors: {
          background: newColor,
          text: newColor,
          primary: newColor,
          secondary: newColor,
        },
      },
    },
  });

  expect(result.current.theme.colors?.background).toEqual(newColor);
  expect(result.current.theme.colors?.text).toEqual(newColor);
  expect(result.current.theme.colors?.primary).toEqual(newColor);
  expect(result.current.theme.colors?.secondary).toEqual(newColor);
});

test('should pass variants', () => {
  const authCard = {
    backgroundColor: 'red',
  };

  const authLayout = {
    backgroundColor: 'blue',
  };

  const variants = {
    layout: {
      auth: authLayout,
    },
    cards: {
      auth: authCard,
    },
  };

  const { result } = renderHook(() => useTheme(), {
    wrapper: ThemeProvider,
    initialProps: {
      theme: {
        colors: {},
        ...variants,
      },
    },
  });

  expect(result.current.theme.cards).toEqual(
    expect.objectContaining(variants.cards)
  );

  expect(result.current.theme.layout).toEqual(
    expect.objectContaining(variants.layout)
  );
});
