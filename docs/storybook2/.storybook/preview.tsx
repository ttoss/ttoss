import type { Preview } from '@storybook/react-vite';
import { createTheme } from '@ttoss/theme2';
import {
  type ThemeMode,
  ThemeProvider,
  useColorMode,
} from '@ttoss/theme2/react';
import { bruttal } from '@ttoss/theme2/themes/bruttal';
import { corporate } from '@ttoss/theme2/themes/corporate';
import { oca } from '@ttoss/theme2/themes/oca';
import { ventures } from '@ttoss/theme2/themes/ventures';
import * as React from 'react';

const themes = {
  base: createTheme(),
  bruttal,
  corporate,
  oca,
  ventures,
} as const;

type ThemeKey = keyof typeof themes;

/**
 * Syncs the Storybook toolbar `colorMode` into the active ThemeProvider
 * via `setMode()` — the documented, public way to switch modes at runtime.
 *
 * Why not `key={colorMode}` on the provider?
 * - `defaultMode` is init-only on the provider, so toggling via remount
 *   only works while localStorage is empty. The moment anything persists
 *   a mode, the toolbar and the provider drift apart.
 * - Remounting also blows away every `useColorMode()` consumer's state.
 *
 * This mirrors what a real app does: a toggle button calls `setMode('dark')`.
 * The toolbar is that button, relocated to the Storybook toolbar.
 */
const ColorModeSync = ({ mode }: { mode: ThemeMode }) => {
  const { setMode } = useColorMode();
  React.useEffect(() => {
    setMode(mode);
  }, [mode, setMode]);
  return null;
};

/**
 * Dark-mode chrome override.
 *
 * WHY `Canvas` / `CanvasText` instead of theme tokens:
 * The theme-v2 semantic layer (`action.*`, `input.*`, `navigation.*`, …)
 * does not define a page-level `content.*` or `surface.*` family — themes
 * only tokenize interactive / informational surfaces. There is no canonical
 * "page background" token. Using an undefined `var()` would resolve to
 * transparent and do nothing, which is exactly what happened in prior
 * attempts.
 *
 * `Canvas` and `CanvasText` are CSS system colors that follow the element's
 * active `color-scheme`. `createThemeRuntime()` already sets
 * `root.style.colorScheme = resolvedMode` on `<html>`, so these system
 * colors automatically flip to dark when mode flips — no extra state to
 * keep in sync.
 *
 * Scope: only Storybook's autodocs chrome (the preview wrappers, the
 * zoom toolbar, and the ArgsTable cells) — not the story canvas itself.
 * Story content continues to paint through the theme's own tokens
 * (buttons, inputs, etc.), and individual components (e.g. `Button`) are
 * never touched because the selectors never reach inside `.docs-story`'s
 * story root.
 *
 * Injected per render via React 19 style hoisting (`precedence` attribute
 * → placed in `<head>`).
 */
const darkChromeCss = `
  html[data-tt-mode="dark"] .sbdocs,
  html[data-tt-mode="dark"] .sbdocs-wrapper,
  html[data-tt-mode="dark"] .sbdocs-content,
  html[data-tt-mode="dark"] .sbdocs-preview,
  html[data-tt-mode="dark"] .docblock-argstable,
  html[data-tt-mode="dark"] .docblock-argstable th,
  html[data-tt-mode="dark"] .docblock-argstable td {
    background: Canvas;
    color: CanvasText;
    border-color: color-mix(in srgb, CanvasText 20%, transparent);
  }
`;

const preview: Preview = {
  globalTypes: {
    theme: {
      name: 'Theme',
      defaultValue: 'base',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'base', title: 'Base Theme' },
          { value: 'bruttal', title: 'Bruttal' },
          { value: 'corporate', title: 'Corporate' },
          { value: 'oca', title: 'Oca' },
          { value: 'ventures', title: 'Ventures' },
        ],
        dynamicTitle: true,
      },
    },
    colorMode: {
      name: 'Color Mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'system', title: 'System', icon: 'mirror' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const themeKey = (context.globals.theme as ThemeKey) || 'base';
      const colorMode = (context.globals.colorMode as ThemeMode) || 'light';
      // `key={themeKey}` forces a fresh ThemeProvider only when the THEME
      // changes — not on every mode toggle. Mode is driven through the
      // provider's public `setMode()` API via <ColorModeSync />, so
      // `useColorMode()` consumers keep their state across mode changes.
      //
      // No inner wrapper div — the story canvas must stay free of our
      // background paint so components that set their own inline
      // `background-color` (e.g. every `Button evaluation`) keep the
      // contrast the theme designed for them. The `darkChromeCss` rule
      // handles dark-mode chrome at the `html[data-tt-mode="dark"]` layer
      // instead.
      return (
        <ThemeProvider
          key={themeKey}
          theme={themes[themeKey]}
          defaultMode={colorMode}
        >
          <ColorModeSync mode={colorMode} />
          <style precedence="tt-storybook-chrome">{darkChromeCss}</style>
          <Story />
        </ThemeProvider>
      );
    },
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
    options: {
      storySort: {
        method: 'alphabetical',
        order: [
          'Introduction',
          'theme-v2',
          [
            'Overview',
            'Tokens',
            [
              'Colors',
              'Typography',
              'Spacing',
              'Elevation',
              'Motion',
              'Graph',
              '*',
            ],
            '*',
          ],
          'ui2',
          '*',
        ],
      },
    },
  },
  tags: ['autodocs'],
};

export default preview;
