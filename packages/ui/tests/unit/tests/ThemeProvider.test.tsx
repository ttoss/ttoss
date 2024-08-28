import { BruttalTheme } from '@ttoss/theme/Bruttal';
import { ThemeProvider, useTheme } from '../../../src';
import { renderHook } from '@ttoss/test-utils';

test('should return default theme colors', () => {
  const { result } = renderHook(
    () => {
      return useTheme();
    },
    {
      wrapper: ThemeProvider,
      initialProps: { theme: {} },
    }
  );

  expect(result.current.theme.rawColors).toEqual(BruttalTheme.colors);
});

test('should return new theme colors', () => {
  const newColor = '#000';

  const { result } = renderHook(
    () => {
      return useTheme();
    },
    {
      wrapper: ({ children }) => {
        return (
          <ThemeProvider
            theme={{
              colors: {
                background: newColor,
                text: newColor,
                primary: newColor,
                secondary: newColor,
              },
            }}
          >
            {children}
          </ThemeProvider>
        );
      },
    }
  );

  expect(result.current.theme.rawColors?.background).toEqual(newColor);
  expect(result.current.theme.rawColors?.text).toEqual(newColor);
  expect(result.current.theme.rawColors?.primary).toEqual(newColor);
  expect(result.current.theme.rawColors?.secondary).toEqual(newColor);
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

  const { result } = renderHook(
    () => {
      return useTheme();
    },
    {
      wrapper: ({ children }) => {
        return (
          <ThemeProvider
            theme={{
              colors: {},
              ...variants,
            }}
          >
            {children}
          </ThemeProvider>
        );
      },
    }
  );

  expect(result.current.theme.cards).toEqual(
    expect.objectContaining(variants.cards)
  );

  expect(result.current.theme.layout).toEqual(
    expect.objectContaining(variants.layout)
  );
});
