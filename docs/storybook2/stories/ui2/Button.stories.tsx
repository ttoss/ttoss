import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ttoss/ui2';

const meta: Meta<typeof Button> = {
  title: 'ui2/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    children: 'Click me',
  },
  argTypes: {
    evaluation: {
      description:
        'Semantic emphasis. Drives the color role used — maps to `action.*` tokens.',
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'muted', 'negative'],
    },
    isDisabled: {
      description: 'Disables the button. Applies `disabled` state tokens.',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { evaluation: 'primary' },
};

export const Secondary: Story = {
  args: { evaluation: 'secondary' },
};

export const Accent: Story = {
  args: { evaluation: 'accent' },
};

export const Muted: Story = {
  args: { evaluation: 'muted' },
};

export const Negative: Story = {
  args: { evaluation: 'negative' },
};

export const Disabled: Story = {
  args: { evaluation: 'primary', isDisabled: true },
};

/** Focus ring — trigger with Tab after clicking inside the canvas. */
export const FocusState: Story = {
  args: { evaluation: 'primary', autoFocus: true },
};

/** All evaluations side-by-side for quick visual comparison. */
export const AllEvaluations: Story = {
  parameters: { layout: 'padded' },
  render: () => {
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button evaluation="primary">Primary</Button>
        <Button evaluation="secondary">Secondary</Button>
        <Button evaluation="accent">Accent</Button>
        <Button evaluation="muted">Muted</Button>
        <Button evaluation="negative">Negative</Button>
      </div>
    );
  },
};

/** All evaluations in the disabled state — verify token coverage per role. */
export const AllDisabled: Story = {
  parameters: { layout: 'padded' },
  render: () => {
    return (
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button evaluation="primary" isDisabled>
          Primary
        </Button>
        <Button evaluation="secondary" isDisabled>
          Secondary
        </Button>
        <Button evaluation="accent" isDisabled>
          Accent
        </Button>
        <Button evaluation="muted" isDisabled>
          Muted
        </Button>
        <Button evaluation="negative" isDisabled>
          Negative
        </Button>
      </div>
    );
  },
};
