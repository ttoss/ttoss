import { Flex } from '@ttoss/ui';
import type * as React from 'react';

import { DashboardEditToolbar } from './DashboardEditToolbar';
import { DashboardFilters } from './DashboardFilters';
import { useDashboard } from './DashboardProvider';

export const DashboardHeader = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const { editable } = useDashboard();
  return (
    <Flex sx={{ gap: '3', flexDirection: 'column' }}>
      <Flex
        sx={{
          padding: '2',
          flexWrap: 'wrap',
          gap: '4',
          alignItems: 'center',
        }}
      >
        <DashboardFilters />
        {children}
      </Flex>
      {editable && <DashboardEditToolbar />}
    </Flex>
  );
};
