import { Drawer } from '@ttoss/components';
import { Box, Flex, Stack, Text } from '@ttoss/ui';
import type * as React from 'react';

import type { DashboardGridItem } from './Dashboard';
import type { CardNumberType, DashboardCard } from './DashboardCard';

type Props = {
  open: boolean;
  onClose: () => void;
  card: DashboardCard | null;
  gridItem?: DashboardGridItem | null;
  /** Slot for consumer-provided content below the daily chart (e.g. campaign breakdown). */
  children?: React.ReactNode;
  size?: number;
};

const formatValue = (value: number, numberType: CardNumberType): string => {
  if (numberType === 'currency') {
    return `R$${value.toFixed(2)}`;
  }
  if (numberType === 'percentage') {
    return `${value.toFixed(1)}%`;
  }
  return value.toFixed(2);
};

type DailyBarChartProps = {
  values: number[];
  numberType: CardNumberType;
};

const DailyBarChart = ({ values, numberType }: DailyBarChartProps) => {
  const max = Math.max(...values);
  return (
    <Flex sx={{ alignItems: 'flex-end', height: '80px', gap: '2px' }}>
      {values.map((v, i) => {
        return (
          <Box
            key={i}
            title={formatValue(v, numberType)}
            sx={{
              flex: 1,
              minWidth: '4px',
              height: `${Math.max((v / max) * 100, 2)}%`,
              bg: 'primary',
              opacity: 0.7,
              borderRadius: '2px 2px 0 0',
              '&:hover': {
                opacity: 1,
              },
            }}
          />
        );
      })}
    </Flex>
  );
};

export const DashboardCardDetailDrawer = ({
  open,
  onClose,
  card,
  gridItem: _gridItem,
  children,
  size,
}: Props) => {
  const rawDaily = card?.data.meta?.daily ?? card?.data.api?.daily ?? [];
  const validDailyData = rawDaily.filter((v): v is number => {
    return v != null;
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      direction="right"
      size={size ?? 400}
      lockBackgroundScroll
    >
      <Stack sx={{ height: '100%', overflowY: 'auto', p: 4, gap: 5 }}>
        {card && (
          <>
            <Text sx={{ fontSize: 3, fontWeight: 'bold' }}>{card.title}</Text>
            {validDailyData.length > 0 && (
              <DailyBarChart
                values={validDailyData}
                numberType={card.numberType}
              />
            )}
            {children}
          </>
        )}
      </Stack>
    </Drawer>
  );
};
