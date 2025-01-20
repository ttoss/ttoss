import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { Label } from '@ttoss/ui';

type Story = StoryObj<typeof Label>;

const Component = () => {
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

export default {
  title: 'UI/Label',
  component: Label,
} as Meta<typeof Label>;

export const Default: Story = {
  args: {
    onChange: action('onChange'),
    children: 'Label (optional)',
    tooltip: 'tooltip',
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    'aria-disabled': 'true',
  },
};

export const WithoutTooltip: Story = {
  args: {
    ...Default.args,
    tooltip: false,
  },
};

export const WithTooltipChildrenAndClickable: Story = {
  args: {
    ...Default.args,
    tooltip: <Component />,
    tooltipClickable: true,
  },
};

export const WithTooltipChildrenAndNotClickable: Story = {
  args: {
    ...Default.args,
    tooltip: <Component />,
    tooltipClickable: false,
  },
};
export const WithTooltipCSS: Story = {
  args: {
    ...Default.args,
    tooltip: 'tooltip with css',
    tooltipClickable: false,
    tooltipStyle: { backgroundColor: 'green' },
  },
};
