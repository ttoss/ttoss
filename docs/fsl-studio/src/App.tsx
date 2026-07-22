import { ThemeProvider } from '@ttoss/fsl-theme/react';

import { Shell } from './app/Shell';
import { theme } from './theme';

/**
 * FSL Studio v2 — the adoption proving ground for `@ttoss/fsl-theme` and
 * `@ttoss/fsl-ui` (Program P1). The theme mounts once here; everything below
 * composes exclusively from fsl-ui primitives.
 */
export const App = () => {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <Shell />
    </ThemeProvider>
  );
};
