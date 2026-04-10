import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ttoss/ui2';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

const ButtonMeta: Meta<typeof Button> = {
  title: 'ui2/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Click me',
  },
  argTypes: {
    evaluation: {
      control: 'select',
      options: ['primary', 'secondary', 'muted', 'negative'],
    },
    consequence: {
      control: 'select',
      options: [undefined, 'destructive', 'neutral'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
  },
};

export default ButtonMeta;
type ButtonStory = StoryObj<typeof Button>;

export const Primary: ButtonStory = {
  args: { evaluation: 'primary' },
};

export const Secondary: ButtonStory = {
  args: { evaluation: 'secondary' },
};

export const Muted: ButtonStory = {
  args: { evaluation: 'muted' },
};

export const Destructive: ButtonStory = {
  args: { consequence: 'destructive' },
};

export const Disabled: ButtonStory = {
  args: { evaluation: 'primary', disabled: true },
};
