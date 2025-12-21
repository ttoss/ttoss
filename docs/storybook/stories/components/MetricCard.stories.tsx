import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MetricCard } from '@ttoss/components/MetricCard';

const meta: Meta<typeof MetricCard> = {
  title: 'Components/MetricCard',
  component: MetricCard,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof MetricCard>;

export const DateMetric: Story = {
  args: {
    metric: {
      type: 'date',
      label: 'Renewal date',
      date: '31/12/2025',
      icon: 'fluent:calendar-24-regular',
      remainingDaysMessage: '10 days remaining',
    },
  },
};

export const DateMetricWarning: Story = {
  args: {
    metric: {
      type: 'date',
      label: 'Expires on',
      date: '05/01/2026',
      icon: 'fluent:calendar-24-regular',
      remainingDaysMessage: '3 days remaining',
      isWarning: true,
    },
  },
};

export const PercentageMetric: Story = {
  args: {
    metric: {
      type: 'percentage',
      label: 'Plan usage',
      current: 350,
      max: 1000,
      icon: 'fluent:gauge-24-regular',
      showAlertThreshold: 80,
    },
  },
};

export const PercentageMetricNearLimit: Story = {
  args: {
    metric: {
      type: 'percentage',
      label: 'API calls',
      current: 900,
      max: 1000,
      icon: 'fluent:data-usage-24-regular',
      showAlertThreshold: 80,
      tooltip: 'Counts API requests for the current billing period.',
    },
  },
};

export const PercentageMetricReachedLimit: Story = {
  args: {
    metric: {
      type: 'percentage',
      label: 'API calls',
      current: 1000,
      max: 1000,
      icon: 'fluent:data-usage-24-regular',
      showAlertThreshold: 80,
      tooltip: () => {
        return alert('Open help article');
      },
    },
  },
};

export const UnlimitedMetric: Story = {
  args: {
    metric: {
      type: 'percentage',
      label: 'Team members',
      current: 42,
      max: null,
      icon: 'fluent:people-24-regular',
      tooltip: 'Unlimited on this plan.',
    },
  },
};

export const NumberMetric: Story = {
  args: {
    metric: {
      type: 'number',
      label: 'Active projects',
      current: 3,
      max: 5,
      icon: 'fluent:apps-24-regular',
      footerText: 'Upgrade to increase your project limit.',
    },
  },
};

export const ClickableMetric: Story = {
  args: {
    metric: {
      type: 'number',
      label: 'Invoices',
      current: 12,
      max: null,
      icon: 'fluent:receipt-24-regular',
      onClick: () => {
        return alert('Open invoices');
      },
      footerText: 'View all invoices.',
    },
  },
};
