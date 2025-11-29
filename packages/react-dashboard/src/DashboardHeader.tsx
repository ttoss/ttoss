import { Flex } from '@ttoss/ui';
import * as React from 'react';

import { DashboardFilters } from './DashboardFilters';

export const DashboardHeader = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  return (
    <Flex
      sx={{
        padding: '2',
      }}
    >
      <DashboardFilters />
      {children}
    </Flex>
  );
};
