import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DashboardCard, DashboardProvider } from '@ttoss/react-dashboard';
import { Box, Stack } from '@ttoss/ui';

const meta: Meta = {
  title: 'React Dashboard/DashboardCard',
  parameters: {
    docs: {
      description: {
        component:
          'Individual dashboard card component. Currently supports `bigNumber` type with various formatting options, variants, and features like trends and status indicators.',
      },
    },
  },
  decorators: [
    (Story) => {
      return (
        <DashboardProvider>
          <Story />
        </DashboardProvider>
      );
    },
  ],
  tags: ['autodocs'],
};

export default meta;

export const CurrencyCard: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="Total Revenue"
          description="Revenue from all sources"
          numberType="currency"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 150000 },
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Currency formatted card displaying revenue. Uses BRL (Brazilian Real) formatting by default.',
      },
    },
  },
};

export const PercentageCard: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="CTR"
          description="Click-through rate"
          numberType="percentage"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 2.35 },
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Percentage formatted card. Automatically adds the % symbol and formats to 2 decimal places.',
      },
    },
  },
};

export const NumberCard: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="ROAS"
          description="Return on ad spend"
          numberType="number"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 3.5 },
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Number formatted card. For metrics like ROAS, automatically adds an "x" suffix. Formatted to 2 decimal places with locale-specific number formatting.',
      },
    },
  },
};

export const WithPositiveTrend: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="Total Revenue"
          description="Revenue from all sources"
          numberType="currency"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 150000 },
          }}
          trend={{
            value: 15.5,
            status: 'positive',
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with positive trend indicator. Shows an up arrow and percentage change compared to the previous period.',
      },
    },
  },
};

export const WithNegativeTrend: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="CTR"
          description="Click-through rate"
          numberType="percentage"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 2.35 },
          }}
          trend={{
            value: 5.2,
            status: 'negative',
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with negative trend indicator. Shows a down arrow and percentage change in red.',
      },
    },
  },
};

export const WithNeutralTrend: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="Impressions"
          numberType="number"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 1250000 },
          }}
          trend={{
            value: 0.1,
            status: 'neutral',
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with neutral trend indicator. Shows a horizontal arrow when there is no significant change.',
      },
    },
  },
};

export const WithStatus: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="Campaign Status"
          description="Current campaign status"
          numberType="number"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 42 },
          }}
          status={{
            text: 'Active',
            icon: 'mdi:check-circle',
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with status indicator. Displays a status text and optional icon, useful for showing operational status.',
      },
    },
  },
};

export const WithAdditionalInfo: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="Total Revenue"
          description="Revenue from all sources"
          numberType="currency"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 150000 },
          }}
          trend={{
            value: 15.5,
            status: 'positive',
          }}
          additionalInfo="Compared to last month"
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with additional information text. Useful for providing context about comparisons or data sources.',
      },
    },
  },
};

export const DarkVariant: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="CPC"
          description="Cost per click"
          numberType="currency"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 0.85 },
          }}
          variant="dark"
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with dark variant. Uses a dark background with white text, useful for highlighting important metrics.',
      },
    },
  },
};

export const LightGreenVariant: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="ROAS"
          description="Return on ad spend"
          numberType="number"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 3.5 },
          }}
          variant="light-green"
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Card with light green variant. Uses a light green background with green accent text, perfect for positive metrics like ROAS or ROI.',
      },
    },
  },
};

export const CompleteExample: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          title="Total Revenue"
          description="Revenue from all sources this month"
          icon="mdi:currency-usd"
          color="green"
          numberType="currency"
          type="bigNumber"
          sourceType={[{ source: 'api' }]}
          data={{
            api: { total: 250000 },
          }}
          trend={{
            value: 22.5,
            status: 'positive',
          }}
          additionalInfo="Compared to last month"
          status={{
            text: 'On Track',
            icon: 'mdi:check-circle',
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Complete card example with all features: title, description, trend, additional info, and status indicator.',
      },
    },
  },
};

export const CardGrid: StoryObj = {
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
        <Box sx={{ width: '300px' }}>
          <DashboardCard
            title="Revenue"
            numberType="currency"
            type="bigNumber"
            sourceType={[{ source: 'api' }]}
            data={{ api: { total: 150000 } }}
            trend={{ value: 15.5, status: 'positive' }}
          />
        </Box>
        <Box sx={{ width: '300px' }}>
          <DashboardCard
            title="ROAS"
            numberType="number"
            type="bigNumber"
            sourceType={[{ source: 'api' }]}
            data={{ api: { total: 3.5 } }}
            variant="light-green"
          />
        </Box>
        <Box sx={{ width: '300px' }}>
          <DashboardCard
            title="CPC"
            numberType="currency"
            type="bigNumber"
            sourceType={[{ source: 'api' }]}
            data={{ api: { total: 0.85 } }}
            variant="dark"
          />
        </Box>
        <Box sx={{ width: '300px' }}>
          <DashboardCard
            title="CTR"
            numberType="percentage"
            type="bigNumber"
            sourceType={[{ source: 'api' }]}
            data={{ api: { total: 2.35 } }}
            trend={{ value: 5.2, status: 'negative' }}
          />
        </Box>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Grid of different card types showing various configurations and variants side by side.',
      },
    },
  },
};
