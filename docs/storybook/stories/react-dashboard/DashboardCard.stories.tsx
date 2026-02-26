import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DashboardCard } from '@ttoss/react-dashboard';
import { Box, Stack } from '@ttoss/ui';

const meta: Meta = {
  title: 'React Dashboard/DashboardCard',
  parameters: {
    docs: {
      description: {
        component:
          'Individual dashboard card component. Currently supports `bigNumber` type with various formatting options, variants, and features like trends and status indicators. Use `numberDecimalPlaces` to control the number of decimal places displayed (defaults to 2). Use the optional `suffix` prop to append text after the formatted number (e.g. `"kg"`, `"un"`, `"p.p."`); the suffix is not shown when the value is undefined.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const CurrencyCard: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          id="abc-123"
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
          id="abc-456"
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
          id="abc-789"
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
          'Number formatted card. For metrics like ROAS, automatically adds an "x" suffix. Formatted to 2 decimal places by default (can be customized with `numberDecimalPlaces` prop) with locale-specific number formatting.',
      },
    },
  },
};

export const WithPositiveTrend: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          id="abc-101"
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
          'Card with positive trend indicator. Shows an up arrow icon and percentage value (e.g., "15.5% vs. anterior"). Note: positive values do not include a "+" sign prefix.',
      },
    },
  },
};

export const WithNegativeTrend: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          id="abc-102"
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
          'Card with negative trend indicator. Shows a down arrow and percentage change (e.g., "5.2% vs. anterior") in red.',
      },
    },
  },
};

export const WithNeutralTrend: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          id="abc-103"
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
          'Card with neutral trend indicator. Shows the percentage value (e.g., "0.1% vs. anterior") without an arrow icon when status is neutral.',
      },
    },
  },
};

export const WithStatus: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          id="abc-104"
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
          id="abc-105"
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
          id="abc-106"
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
          id="abc-107"
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

export const WithSuffix: StoryObj = {
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
            id="abc-108"
            title="Weight"
            description="Total weight"
            numberType="number"
            numberDecimalPlaces={2}
            type="bigNumber"
            sourceType={[{ source: 'api' }]}
            data={{ api: { total: 1500.5 } }}
            suffix="kg"
          />
        </Box>
        <Box sx={{ width: '300px' }}>
          <DashboardCard
            id="abc-109"
            title="Units"
            description="Quantity in units"
            numberType="currency"
            type="bigNumber"
            sourceType={[{ source: 'api' }]}
            data={{ api: { total: 12500 } }}
            suffix="un"
          />
        </Box>
        <Box sx={{ width: '300px' }}>
          <DashboardCard
            id="abc-110"
            title="Change (p.p.)"
            description="Percentage points"
            numberType="percentage"
            numberDecimalPlaces={1}
            type="bigNumber"
            sourceType={[{ source: 'api' }]}
            data={{ api: { total: 2.3 } }}
            suffix="p.p."
          />
        </Box>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Use the `suffix` prop to append a unit or qualifier after the formatted number (e.g. "kg", "un", "p.p."). The suffix is rendered with a space before it. When the value is undefined, only a dash is shown and no suffix is appended.',
      },
    },
  },
};

export const CustomDecimalPlaces: StoryObj = {
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
            id="abc-111"
            title="Precise Metric (0 decimals)"
            description="No decimal places"
            numberType="number"
            numberDecimalPlaces={0}
            type="bigNumber"
            sourceType={[{ source: 'api' }]}
            data={{
              api: { total: 1234.567 },
            }}
          />
        </Box>
        <Box sx={{ width: '300px' }}>
          <DashboardCard
            id="abc-112"
            title="Standard Metric (2 decimals)"
            description="Default 2 decimal places"
            numberType="number"
            numberDecimalPlaces={2}
            type="bigNumber"
            sourceType={[{ source: 'api' }]}
            data={{
              api: { total: 1234.567 },
            }}
          />
        </Box>
        <Box sx={{ width: '300px' }}>
          <DashboardCard
            id="abc-113"
            title="High Precision (4 decimals)"
            description="4 decimal places"
            numberType="number"
            numberDecimalPlaces={4}
            type="bigNumber"
            sourceType={[{ source: 'api' }]}
            data={{
              api: { total: 1234.567 },
            }}
          />
        </Box>
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the `numberDecimalPlaces` prop to control decimal precision. The prop only affects `numberType="number"` formatting. Currency and percentage types have their own fixed formatting rules.',
      },
    },
  },
};

export const CompleteExample: StoryObj = {
  render: () => {
    return (
      <Box sx={{ maxWidth: '400px', padding: '4' }}>
        <DashboardCard
          id="abc-114"
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
            id="abc-115"
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
            id="abc-116"
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
            id="abc-117"
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
            id="abc-118"
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
