import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { DatePicker, type DateRange } from '@ttoss/components/DatePicker';
import { Box, Stack } from '@ttoss/ui';
import * as React from 'react';

const meta: Meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  parameters: {
    docs: {
      description: {
        component:
          'A date range picker component with preset options. Supports selecting date ranges with a calendar interface and optional preset buttons for common date ranges.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj = {
  render: () => {
    const [value, setValue] = React.useState<DateRange | undefined>(undefined);

    return (
      <Box sx={{ padding: '4', maxWidth: '400px' }}>
        <DatePicker
          label="Date Range"
          value={value}
          onChange={(range) => {
            setValue(range);
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default date picker without presets. Click the button to open the calendar and select a date range.',
      },
    },
  },
};

export const WithPresets: StoryObj = {
  render: () => {
    const [value, setValue] = React.useState<DateRange | undefined>(undefined);

    const presets = [
      {
        label: 'Last 7 days',
        getValue: () => {
          return {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            to: new Date(),
          };
        },
      },
      {
        label: 'Last 30 days',
        getValue: () => {
          return {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date(),
          };
        },
      },
      {
        label: 'Last 90 days',
        getValue: () => {
          return {
            from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            to: new Date(),
          };
        },
      },
      {
        label: 'This month',
        getValue: () => {
          const now = new Date();
          return {
            from: new Date(now.getFullYear(), now.getMonth(), 1),
            to: new Date(),
          };
        },
      },
      {
        label: 'Last month',
        getValue: () => {
          const now = new Date();
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastDayOfLastMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            0
          );
          return {
            from: lastMonth,
            to: lastDayOfLastMonth,
          };
        },
      },
    ];

    return (
      <Box sx={{ padding: '4', maxWidth: '400px' }}>
        <DatePicker
          label="Date Range"
          value={value}
          onChange={(range) => {
            setValue(range);
          }}
          presets={presets}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date picker with preset options. Users can quickly select common date ranges using the preset buttons on the left side of the calendar.',
      },
    },
  },
};

export const WithInitialValue: StoryObj = {
  render: () => {
    const [value, setValue] = React.useState<DateRange>({
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(),
    });

    return (
      <Box sx={{ padding: '4', maxWidth: '400px' }}>
        <DatePicker
          label="Date Range"
          value={value}
          onChange={(range) => {
            setValue(range || { from: undefined, to: undefined });
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date picker with an initial value set. The selected date range is displayed in the button.',
      },
    },
  },
};

export const WithoutLabel: StoryObj = {
  render: () => {
    const [value, setValue] = React.useState<DateRange | undefined>(undefined);

    return (
      <Box sx={{ padding: '4', maxWidth: '400px' }}>
        <DatePicker
          value={value}
          onChange={(range) => {
            setValue(range);
          }}
        />
      </Box>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date picker without a label. Useful when the label is provided by a parent component or form field wrapper.',
      },
    },
  },
};

export const MultipleDatePickers: StoryObj = {
  render: () => {
    const [value1, setValue1] = React.useState<DateRange | undefined>(
      undefined
    );
    const [value2, setValue2] = React.useState<DateRange | undefined>(
      undefined
    );

    const presets = [
      {
        label: 'Last 7 days',
        getValue: () => {
          return {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            to: new Date(),
          };
        },
      },
      {
        label: 'Last 30 days',
        getValue: () => {
          return {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: new Date(),
          };
        },
      },
    ];

    return (
      <Stack sx={{ gap: '4', padding: '4', maxWidth: '600px' }}>
        <DatePicker
          label="Start Date Range"
          value={value1}
          onChange={(range) => {
            setValue1(range);
          }}
          presets={presets}
        />
        <DatePicker
          label="End Date Range"
          value={value2}
          onChange={(range) => {
            setValue2(range);
          }}
          presets={presets}
        />
      </Stack>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multiple date pickers in a form. Each picker maintains its own state independently.',
      },
    },
  },
};
