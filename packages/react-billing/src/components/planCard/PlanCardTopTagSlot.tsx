import { Box } from '@ttoss/ui';
import type * as React from 'react';

import type { PlanCardVariant } from './PlanCardVariants';

export interface PlanCardTopTagSlotProps {
  children: React.ReactNode;
  variant?: PlanCardVariant;
}

export const PlanCardTopTagSlot = ({ children }: PlanCardTopTagSlotProps) => {
  return <Box sx={{ padding: '4' }}>{children}</Box>;
};
