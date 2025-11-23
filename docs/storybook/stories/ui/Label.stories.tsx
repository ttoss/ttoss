import { Meta, StoryObj } from '@storybook/react-webpack5';
import { Label, LabelProps } from '@ttoss/ui';
import { action } from 'storybook/actions';

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
    children: <TooltipComponent />,
    place: 'top',
    openOnClick: false,
    clickable: true,
  },
};

const tooltipNotClickable: LabelProps = {
  tooltip: {
    children: <TooltipComponent />,
    place: 'top',
    openOnClick: false,
    clickable: false,
  },
};

const tooltipOpenOnClick: LabelProps = {
  tooltip: {
    children: <TooltipComponent />,
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
    tooltip: { children: 'tooltip message', place: 'top' },
  },
};

export const WithTooltipVariantInfo: Story = {
  args: {
    ...Default.args,
    tooltip: {
      children: 'Info tooltip message',
      place: 'bottom',
      variant: 'info',
    },
  },
};

export const WithTooltipVariantSuccess: Story = {
  args: {
    ...Default.args,
    tooltip: {
      children: 'Success tooltip message',
      place: 'top',
      variant: 'success',
    },
  },
};

export const WithTooltipVariantWarning: Story = {
  args: {
    ...Default.args,
    tooltip: {
      children: 'Warning tooltip message',
      place: 'top',
      variant: 'warning',
    },
  },
};

export const WithTooltipVariantError: Story = {
  args: {
    ...Default.args,
    tooltip: {
      children: 'Error tooltip message',
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
