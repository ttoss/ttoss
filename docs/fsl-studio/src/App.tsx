import { ThemeProvider } from '@ttoss/fsl-theme/react';

import { StudioShell } from './studio/StudioShell';
import { studioBundle } from './theme';

/**
 * FSL Studio root. The chrome is themed by the canonical (`:root`) theme via
 * ThemeProvider; the stage panes carry their own element-scoped theme CSS so
 * they can show light and dark simultaneously (PRD §6.1–6.2).
 */
export const App = () => {
  return (
    <ThemeProvider theme={studioBundle} defaultMode="system">
      <StudioShell />
    </ThemeProvider>
  );
};
