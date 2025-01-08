import { Stack, type StackProps } from '@ttoss/ui';
import * as React from 'react';

import { getSematicElements } from '../getSemanticElements';
import { GlobalProvider } from './GlobalProvider';

export const StackedLayout = ({
  children,
  ...props
}: React.PropsWithChildren<StackProps>) => {
  const { header, main, footer } = getSematicElements({ children });

  return (
    <GlobalProvider>
      <Stack {...props}>
        {header}
        {main}
        {footer}
      </Stack>
    </GlobalProvider>
  );
};
