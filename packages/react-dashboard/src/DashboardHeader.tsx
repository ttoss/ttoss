import { Box, Flex } from '@ttoss/ui';
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
      <Box
        sx={{
          borderRadius: 'lg',
          backgroundColor: 'white',
          padding: '3',
          border: '1px solid',
          borderColor: 'display.border.muted.default',
        }}
      >
        <Flex
          sx={{
            padding: '2',
            flexWrap: 'wrap',
            gap: '4',
            alignItems: 'flex-end',
          }}
        >
          <DashboardFilters />
          {children && (
            <Flex
              sx={{
                gap: '2',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {children}
            </Flex>
          )}
        </Flex>
        {editable && (
          <Flex sx={{ paddingTop: '2' }}>
            <DashboardEditToolbar />
          </Flex>
        )}
      </Box>
    </Flex>
  );
};
