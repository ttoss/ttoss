import { Meta, StoryObj } from '@storybook/react';
import { Select } from '@ttoss/ui/src';
import { action } from '@storybook/addon-actions';

type Story = StoryObj<typeof Select>;

const OPTIONS = ['orange', 'grape', 'apple'];

export default {
  title: 'UI/Select',
  component: Select,
} as Meta<typeof Select>;

export const Default: Story = {
  args: {
    onChange: action('onChange'),
    children: (
      <>
        {OPTIONS.map((option) => {
          return (
            <option key={option} value={option}>
              {option}
            </option>
          );
        })}
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const Error: Story = {
  args: {
    ...Default.args,
    'aria-invalid': 'true',
    errorIcon: 'carbon:error-filled',
  },
};
