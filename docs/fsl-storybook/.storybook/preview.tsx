// Inter Variable — the base theme's first-choice family; self-hosted via
// Fontsource (no external font CDN).
import '@fontsource-variable/inter';

import type { Decorator, Preview } from '@storybook/react-vite';
import { bruttal, createTheme } from '@ttoss/fsl-theme';
import { ThemeProvider, useColorMode } from '@ttoss/fsl-theme/react';
import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';

const themes = {
  base: createTheme(),
  bruttal,
} as const;

type ThemeName = keyof typeof themes;
type Mode = 'light' | 'dark';

/**
 * Keeps the provider's mode in sync with the toolbar global. The provider's
 * `defaultMode` is only read on mount, so toolbar changes flow through the
 * runtime setter instead.
 */
const ModeSync = ({
  mode,
  children,
}: {
  mode: Mode;
  children: React.ReactNode;
}) => {
  const { setMode } = useColorMode();
  React.useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);
  return <>{children}</>;
};

// Stories sit on the theme canvas — the same token Surface's `flat` level
// resolves to — so dark mode reads correctly without the backgrounds addon.
const canvasStyle: React.CSSProperties = {
  backgroundColor: vars.colors.informational.primary.background?.default,
  color: vars.colors.informational.primary.text?.default,
  padding: '1.5rem',
};

const withFslTheme: Decorator = (Story, context) => {
  const themeName = (context.globals.fslTheme ?? 'base') as ThemeName;
  const mode = (context.globals.mode ?? 'light') as Mode;
  return (
    <ThemeProvider
      theme={themes[themeName]}
      themeId={themeName}
      defaultMode="light"
    >
      <ModeSync mode={mode}>
        <div style={canvasStyle}>
          <Story />
        </div>
      </ModeSync>
    </ThemeProvider>
  );
};

const preview: Preview = {
  globalTypes: {
    fslTheme: {
      description: 'FSL theme bundle',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['base', 'bruttal'],
        dynamicTitle: true,
      },
    },
    mode: {
      description: 'Color mode',
      toolbar: {
        title: 'Mode',
        icon: 'mirror',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    fslTheme: 'base',
    mode: 'light',
  },
  decorators: [withFslTheme],
  parameters: {
    backgrounds: { disable: true },
    options: {
      storySort: { method: 'alphabetical' },
    },
  },
  tags: ['autodocs'],
};

export default preview;
