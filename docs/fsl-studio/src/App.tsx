import { getThemeStylesContent } from '@ttoss/fsl-theme/css';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import * as React from 'react';

import { StudioShell } from './studio/StudioShell';
import { ThemeStoreProvider, useThemeStore } from './studio/theme/themeStore';

/**
 * Chrome + shell. The chrome is themed by the live bundle when "apply to
 * Studio" is on, and by the unedited preset (the safe fallback) otherwise —
 * so a broken work-in-progress theme can never lock the user out of the
 * editor (PRD §6.1, F2.5).
 *
 * We inject the chrome's `:root` CSS ourselves (mirroring the stage) rather
 * than via ThemeProvider's `theme` prop: React 19 hoists the provider's
 * href-keyed `<style>` and does not reliably update its text when the bundle
 * changes, so applied edits wouldn't reach the chrome. A plain `<style>` text
 * child updates on every render. ThemeProvider (no `theme`) still owns the
 * color-mode runtime that stamps `data-tt-mode` on `<html>`.
 */
const ChromeThemedShell = () => {
  const { applyToStudio, liveBundle, fallbackBundle } = useThemeStore();
  const chromeTheme = applyToStudio ? liveBundle : fallbackBundle;

  const chromeCss = React.useMemo(() => {
    return getThemeStylesContent(chromeTheme);
  }, [chromeTheme]);

  return (
    <ThemeProvider defaultMode="system">
      <style>{chromeCss}</style>
      <StudioShell />
    </ThemeProvider>
  );
};

/**
 * FSL Studio root. The theme store sits above the chrome so the chrome can
 * read whether to apply the edited theme to itself.
 */
export const App = () => {
  return (
    <ThemeStoreProvider>
      <ChromeThemedShell />
    </ThemeStoreProvider>
  );
};
