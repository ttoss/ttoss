import * as React from 'react';

import type { AuthScreen } from './types';

export const useAuthScreen = (initialScreen?: AuthScreen) => {
  const [screen, setScreen] = React.useState<AuthScreen>(
    initialScreen || { value: 'signIn', context: {} }
  );

  return { screen, setScreen };
};
