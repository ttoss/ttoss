import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { Label, LabelProps } from '@ttoss/ui';

type Story = StoryObj<typeof Label>;

const TooltipComponent = () => {
  return (
    <div>
      <h3>This is a very interesting header</h3>
      <p>some interesting stuff:</p>
      <ul>
        <li>Some</li>
        <li>Interesting</li>
        <li>Stuff</li>
      </ul>
      <a href="https://www.google.com.br/"> Go to google</a>
    </div>
  );
};

const tooltipClickable: LabelProps = {
  tooltip: {
    render: <TooltipComponent />,
    place: 'top',
    openOnClick: false,
    clickable: true,
  },
};

const tooltipNotClickable: LabelProps = {
  tooltip: {
    render: <TooltipComponent />,
    place: 'top',
    openOnClick: false,
    clickable: false,
  },
};

const tooltipOpenOnClick: LabelProps = {
  tooltip: {
    render: <TooltipComponent />,
    place: 'top',
    openOnClick: true,
    clickable: false,
  },
};

export default {
  title: 'UI/Label',
  component: Label,
} as Meta<typeof Label>;

export const Default: Story = {
  args: {
    onChange: action('onChange'),
    children: 'Label (optional)',
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    'aria-disabled': 'true',
  },
};

export const WithTooltip: Story = {
  args: {
    ...Default.args,
    tooltip: { render: 'tooltip message', place: 'top' },
  },
};

export const WithTooltipVariantLight: Story = {
  args: {
    ...Default.args,
    tooltip: {
      render: 'Light tooltip message',
      place: 'top',
      variant: 'light',
    },
  },
};

export const WithTooltipVariantSuccess: Story = {
  args: {
    ...Default.args,
    tooltip: {
      render: 'Success tooltip message',
      place: 'top',
      variant: 'success',
    },
  },
};

export const WithTooltipVariantWarning: Story = {
  args: {
    ...Default.args,
    tooltip: {
      render: 'Warning tooltip message',
      place: 'top',
      variant: 'warning',
    },
  },
};

export const WithTooltipVariantError: Story = {
  args: {
    ...Default.args,
    tooltip: {
      render: 'Error tooltip message',
      place: 'top',
      variant: 'error',
    },
  },
};

export const WithTooltipChildrenAndClickable: Story = {
  args: {
    ...Default.args,
    tooltip: tooltipClickable.tooltip,
  },
};

export const WithTooltipChildrenAndNotClickable: Story = {
  args: {
    ...Default.args,
    tooltip: tooltipNotClickable.tooltip,
  },
};

export const WithTooltipChildrenOpenOnClick: Story = {
  args: {
    ...Default.args,
    tooltip: tooltipOpenOnClick.tooltip,
  },
};
