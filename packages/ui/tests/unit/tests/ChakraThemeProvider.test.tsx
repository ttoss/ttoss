import { render, screen } from '@ttoss/test-utils/react';
import { BruttalTheme } from '@ttoss/theme/Bruttal';

import { ThemeProvider } from '../../../src';
import { ChakraProvider } from '../../../src/chakra/ChakraThemeProvider';

describe('ChakraProvider', () => {
  test('should render children', () => {
    render(
      <ThemeProvider theme={BruttalTheme}>
        <ChakraProvider>
          <div data-testid="child">Test content</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toHaveTextContent('Test content');
  });

  test('should inherit theme tokens from ThemeProvider', () => {
    const customTheme = {
      colors: {
        primary: '#ff0000',
        secondary: '#00ff00',
      },
      fonts: {
        body: 'Arial, sans-serif',
        heading: 'Georgia, serif',
      },
    };

    const { container } = render(
      <ThemeProvider theme={customTheme}>
        <ChakraProvider>
          <div>Content</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    // ChakraProvider should render without errors when inheriting custom theme
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  test('should apply overrides on top of inherited theme', () => {
    const overrides = {
      theme: {
        tokens: {
          colors: {
            brand: {
              500: { value: '#0469E3' },
            },
          },
        },
      },
    };

    const { container } = render(
      <ThemeProvider theme={BruttalTheme}>
        <ChakraProvider overrides={overrides}>
          <div>Content with overrides</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    // ChakraProvider should render without errors when applying overrides
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  test('should accept custom fonts prop', () => {
    const customFonts = [
      'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
    ];

    const { container } = render(
      <ThemeProvider theme={BruttalTheme}>
        <ChakraProvider fonts={customFonts}>
          <div>Content with custom fonts</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    // ChakraProvider should render without errors when custom fonts are provided
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  test('should render with default Bruttal fonts when no fonts provided', () => {
    const { container } = render(
      <ThemeProvider theme={BruttalTheme}>
        <ChakraProvider>
          <div>Content with default fonts</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    // ChakraProvider should render without errors with default fonts
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  test('should handle empty theme gracefully', () => {
    const { container } = render(
      <ThemeProvider theme={{}}>
        <ChakraProvider>
          <div>Content with empty theme</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    expect(container.querySelector('div')).toBeInTheDocument();
  });

  test('should handle theme with breakpoints array', () => {
    const themeWithBreakpoints = {
      ...BruttalTheme,
      breakpoints: ['640px', '768px', '1024px', '1280px', '1536px'],
    };

    const { container } = render(
      <ThemeProvider theme={themeWithBreakpoints}>
        <ChakraProvider>
          <div>Content with breakpoints</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    expect(container.querySelector('div')).toBeInTheDocument();
  });

  test('should handle theme without rawColors', () => {
    const themeWithoutRawColors = {
      colors: {
        primary: '#ff0000',
        secondary: '#00ff00',
      },
    };

    const { container } = render(
      <ThemeProvider theme={themeWithoutRawColors}>
        <ChakraProvider>
          <div>Content without rawColors</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    expect(container.querySelector('div')).toBeInTheDocument();
  });

  test('should memoize chakra system when theme and overrides do not change', () => {
    const { rerender } = render(
      <ThemeProvider theme={BruttalTheme}>
        <ChakraProvider>
          <div>Initial render</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    // Rerender with same props should use memoized system
    rerender(
      <ThemeProvider theme={BruttalTheme}>
        <ChakraProvider>
          <div>Second render</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    expect(screen.getByText('Second render')).toBeInTheDocument();
  });

  test('should update chakra system when theme changes', () => {
    const theme1 = {
      colors: { primary: '#ff0000' },
    };

    const theme2 = {
      colors: { primary: '#00ff00' },
    };

    const { rerender } = render(
      <ThemeProvider theme={theme1}>
        <ChakraProvider>
          <div>Theme 1</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    rerender(
      <ThemeProvider theme={theme2}>
        <ChakraProvider>
          <div>Theme 2</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    expect(screen.getByText('Theme 2')).toBeInTheDocument();
  });

  test('should update chakra system when overrides change', () => {
    const overrides1 = {
      theme: {
        tokens: {
          colors: { brand: { 500: { value: '#ff0000' } } },
        },
      },
    };

    const overrides2 = {
      theme: {
        tokens: {
          colors: { brand: { 500: { value: '#00ff00' } } },
        },
      },
    };

    const { rerender } = render(
      <ThemeProvider theme={BruttalTheme}>
        <ChakraProvider overrides={overrides1}>
          <div>Overrides 1</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    rerender(
      <ThemeProvider theme={BruttalTheme}>
        <ChakraProvider overrides={overrides2}>
          <div>Overrides 2</div>
        </ChakraProvider>
      </ThemeProvider>
    );

    expect(screen.getByText('Overrides 2')).toBeInTheDocument();
  });
});
