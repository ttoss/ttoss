import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DashboardSectionDivider } from '@ttoss/react-dashboard';
import { Box, Stack } from '@ttoss/ui';

const meta: Meta = {
  title: 'React Dashboard/DashboardSectionDivider',
  parameters: {
    docs: {
      description: {
        component:
          'Section divider component that displays a title and horizontal line to visually separate sections in the dashboard grid. Used within the dashboard grid to organize content into logical sections.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj = {
  render: () => {
    return (
      <Box sx={{ width: '100%', padding: '4' }}>
        <DashboardSectionDivider
          type="sectionDivider"
          title="Performance Metrics"
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default section divider with a title. The divider displays a title on the left and a horizontal line extending to the right.',
      },
    },
  },
};

export const MultipleDividers: StoryObj = {
  render: () => {
    return (
      <Stack sx={{ gap: '4', width: '100%', padding: '4' }}>
        <DashboardSectionDivider
          type="sectionDivider"
          title="Revenue Metrics"
        />
        <DashboardSectionDivider
          type="sectionDivider"
          title="Performance Metrics"
        />
        <DashboardSectionDivider
          type="sectionDivider"
          title="Engagement Metrics"
        />
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multiple section dividers stacked vertically, showing how they can be used to separate different sections of a dashboard.',
      },
    },
  },
};

export const LongTitle: StoryObj = {
  render: () => {
    return (
      <Box sx={{ width: '100%', padding: '4' }}>
        <DashboardSectionDivider
          type="sectionDivider"
          title="Campaign Performance and Analytics Metrics"
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Section divider with a longer title. The title text is truncated appropriately if needed, and the divider line adjusts accordingly.',
      },
    },
  },
};

export const ShortTitle: StoryObj = {
  render: () => {
    return (
      <Box sx={{ width: '100%', padding: '4' }}>
        <DashboardSectionDivider type="sectionDivider" title="KPIs" />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Section divider with a short title. Even with minimal text, the divider maintains its visual structure.',
      },
    },
  },
};
