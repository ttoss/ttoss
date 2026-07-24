import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from '@ttoss/fsl-ui';

const meta: Meta<typeof RadioGroup> = {
  title: 'Selection/RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => {
    return (
      <RadioGroup label="Billing period" defaultValue="monthly">
        <Radio value="monthly">Monthly</Radio>
        <Radio value="yearly">Yearly</Radio>
      </RadioGroup>
    );
  },
};
