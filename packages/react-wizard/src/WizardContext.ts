import * as React from 'react';

import type { WizardContextValue } from './types';

const WizardContext = React.createContext<WizardContextValue | null>(null);

/**
 * Hook to access the wizard context from within step content.
 */
export const useWizard = (): WizardContextValue => {
  const context = React.useContext(WizardContext);

  if (!context) {
    throw new Error('useWizard must be used within a Wizard component.');
  }

  return context;
};

export { WizardContext };
