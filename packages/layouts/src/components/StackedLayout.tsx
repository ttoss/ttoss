import { Stack, type StackProps } from '@ttoss/ui';
import * as React from 'react';

import { getSematicElements } from '../getSemanticElements';
import { LayoutProvider } from './LayoutProvider';

export const StackedLayout = ({
  children,
  ...props
}: React.PropsWithChildren<StackProps>) => {
  const { header, main, footer } = getSematicElements({ children });

  return (
    <LayoutProvider>
      <Stack {...props}>
        {header}
        {main}
        {footer}
      </Stack>
    </LayoutProvider>
  );
};
