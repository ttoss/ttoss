import '@ttoss/ui2/styles.css';

import type { Preview } from '@storybook/react-vite';
import { themes, toCssVars } from '@ttoss/theme2';
import { ThemeProvider } from '@ttoss/theme2/react';

/**
 * Pre-generate CSS strings for all themes × modes.
 * Injected once via a <style> tag so every story picks up the correct tokens.
 */
const allThemeCss = Object.entries(themes)
  .flatMap(([id, theme]) => {
    return (['light', 'dark'] as const).map((mode) => {
      return toCssVars(theme, { themeId: id, mode }).toCssString();
    });
  })
  .join('\n');

const themeNames = Object.keys(themes);

const CONTAINER_PRESETS: Record<string, string> = {
  xs: '320px',
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  auto: '100%',
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Active theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: themeNames,
        dynamicTitle: true,
      },
    },
    mode: {
      description: 'Color mode (light / dark)',
      toolbar: {
        title: 'Mode',
        icon: 'mirror',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
    container: {
      description: 'Container width preset',
      toolbar: {
        title: 'Container',
        icon: 'grow',
        items: Object.keys(CONTAINER_PRESETS),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'default',
    mode: 'light',
    container: 'auto',
  },
  decorators: [
    (Story, context) => {
      const themeId = context.globals.theme ?? 'default';
      const mode = context.globals.mode ?? 'light';
      const container = context.globals.container ?? 'auto';
      const maxWidth = CONTAINER_PRESETS[container] ?? '100%';

      return (
        <ThemeProvider defaultTheme={themeId} defaultMode={mode}>
          {/* Inject all theme CSS vars */}
          <style dangerouslySetInnerHTML={{ __html: allThemeCss }} />

          {/* Container wrapper for container-query testing */}
          <div
            className="tt-container"
            style={{
              maxWidth,
              margin: '0 auto',
              containerType: 'inline-size',
            }}
          >
            <Story />
          </div>
        </ThemeProvider>
      );
    },
  ],
  parameters: {
    options: {
      storySort: {
        method: 'alphabetical' as const,
        order: [
          'Introduction',
          'Foundations',
          'Components',
          'Composites',
          'Sandbox',
          '*',
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
