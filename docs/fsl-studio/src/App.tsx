import { ThemeProvider, ThemeReset } from '@ttoss/fsl-theme/react';
import { ToastRegion } from '@ttoss/fsl-ui';

import { LoginPage } from './pages/LoginPage';
import { useRoute } from './router';
import { useSession } from './session';
import { AppFrame } from './shell/AppFrame';
import { theme } from './theme';
import { toasts } from './toasts';

const Stage = () => {
  const session = useSession();
  const route = useRoute();

  if (!session) {
    return <LoginPage />;
  }

  return <AppFrame route={route} session={session} />;
};

/**
 * Meridian — the FSL Studio Stage. A ThemeProvider at the root styles the
 * whole product; every screen below is fsl-ui on fsl-theme tokens.
 */
export const App = () => {
  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <ThemeReset />
      <Stage />
      <ToastRegion queue={toasts} />
    </ThemeProvider>
  );
};
