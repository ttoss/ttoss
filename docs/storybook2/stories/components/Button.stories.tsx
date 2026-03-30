import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@ttoss/ui2';

/**
 * Accessible button component.
 *
 * **Responsibility**: Action — triggers actions or commands.
 *
 * **Semantic tokens**: `action.{primary|secondary|negative}.{dimension}.{state}`
 */
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
  args: {
    children: 'Button',
    variant: 'solid',
    size: 'md',
  },
  parameters: {
    ttoss: {
      responsibility: 'Action',
      foundations: {
        color: [
          'action.primary.background.default',
          'action.primary.text.default',
        ],
        spacing: ['spacing.inset.control.md'],
        radii: ['radii.control'],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

/** Default solid button (action.primary). */
export const Solid: Story = {
  args: { variant: 'solid', children: 'Save' },
};

/** Outline button (action.secondary). */
export const Outline: Story = {
  args: { variant: 'outline', children: 'Cancel' },
};

/** Ghost button (transparent background). */
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Details' },
};

/** Danger button (action.negative). */
export const Danger: Story = {
  args: { variant: 'danger', children: 'Delete' },
};

/** All sizes side by side. */
export const Sizes: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
    );
  },
};

/** All variants side by side. */
export const AllVariants: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button variant="solid">Solid</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
    );
  },
};

/** Disabled state. */
export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};
