import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DashboardCard } from '@ttoss/react-dashboard';
import { Box, Stack } from '@ttoss/ui';

const meta: Meta = {
  title: 'React Dashboard/BigNumberSparkline',
  parameters: {
    docs: {
      description: {
        component:
          'Use `type: "lineChart"` to render a `BigNumberSparkline` card — a large metric number with an inline SVG sparkline below it. Pass `data.meta.daily` (or `data.api.daily`) as the time-series array and optionally `data.meta.dailyPrevious` to overlay the previous period as a dashed line.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const Basic: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          id="lc-001"
          title="Revenue"
          description="Daily revenue over the last 7 days"
          numberType="currency"
          type="lineChart"
          sourceType={[{ source: 'meta' }]}
          data={{
            meta: {
              total: 150000,
              daily: [12000, 18000, 15000, 22000, 19000, 25000, 21000],
            },
          }}
          trend={{ value: 12.5, status: 'positive' }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic sparkline card with a positive trend. The sparkline renders in green when `trend.status` is `"positive"`.',
      },
    },
  },
};

export const WithPreviousPeriod: StoryObj = {
  render: () => {
    return (
      <Stack
        sx={{
          gap: '4',
          padding: '4',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ width: '320px' }}>
          <DashboardCard
            id="lc-002"
            title="Spend"
            description="Daily spend vs previous period"
            numberType="currency"
            type="lineChart"
            sourceType={[{ source: 'meta' }]}
            data={{
              meta: {
                total: 8500,
                daily: [900, 1200, 1100, 1400, 1300, 1600, 1000],
                dailyPrevious: [800, 950, 1050, 1200, 1100, 1300, 900],
              },
            }}
            trend={{ value: 8.3, status: 'positive' }}
          />
        </Box>
        <Box sx={{ width: '320px' }}>
          <DashboardCard
            id="lc-003"
            title="CPC"
            description="Cost per click — negative trend"
            numberType="currency"
            type="lineChart"
            sourceType={[{ source: 'meta' }]}
            data={{
              meta: {
                total: 0.72,
                daily: [0.85, 0.8, 0.78, 0.75, 0.73, 0.7, 0.72],
                dailyPrevious: [0.9, 0.88, 0.86, 0.84, 0.82, 0.8, 0.79],
              },
            }}
            trend={{ value: -12.5, status: 'negative' }}
          />
        </Box>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'When `dailyPrevious` is provided, a dashed overlay line is rendered for the previous period. The current period uses green for positive trends and red for negative.',
      },
    },
  },
};
