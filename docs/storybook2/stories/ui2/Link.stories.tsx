import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '@ttoss/ui2';

const meta: Meta<typeof Link> = {
  title: 'ui2/Link',
  component: Link,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    children: 'Click me',
    href: '#',
  },
  argTypes: {
    evaluation: {
      description:
        'Semantic emphasis. Drives the color role used — maps to `navigation.*` tokens.',
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'muted'],
    },
    isDisabled: {
      description: 'Disables the link. Applies `disabled` state tokens.',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

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

export const Disabled: Story = {
  args: { evaluation: 'primary', isDisabled: true },
};

/** All evaluations side-by-side for quick visual comparison. */
export const AllEvaluations: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link evaluation="primary" href="#">
          {'Primary'}
        </Link>
        <Link evaluation="secondary" href="#">
          {'Secondary'}
        </Link>
        <Link evaluation="accent" href="#">
          {'Accent'}
        </Link>
        <Link evaluation="muted" href="#">
          {'Muted'}
        </Link>
      </div>
    );
  },
};
