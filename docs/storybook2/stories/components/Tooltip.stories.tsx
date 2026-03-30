import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Tooltip } from '@ttoss/ui2';

/**
 * Accessible tooltip built on Ark UI.
 *
 * **Responsibility**: Overlay — temporary layered UI for contextual information.
 *
 * **Semantic tokens**: `content.primary.*` (inverted)
 */
const meta: Meta<typeof Tooltip> = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    content: { control: 'text' },
  },
  args: {
    content: 'This is a tooltip',
  },
  parameters: {
    ttoss: {
      responsibility: 'Overlay',
      foundations: {
        color: [
          'content.primary.background.default',
          'content.primary.text.default',
        ],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

/** Default tooltip on hover. */
export const Default: Story = {
  render: (args) => {
    return (
      <Tooltip content={args.content ?? 'Tooltip content'}>
        <Button>Hover me</Button>
      </Tooltip>
    );
  },
};

/** Tooltip with long text. */
export const LongContent: Story = {
  render: () => {
    return (
      <Tooltip content="This is a longer tooltip that contains a more detailed explanation of the UI element.">
        <Button variant="outline">Hover for details</Button>
      </Tooltip>
    );
  },
};

/** Multiple tooltips. */
export const Multiple: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', gap: 16 }}>
        <Tooltip content="Save changes">
          <Button>Save</Button>
        </Tooltip>
        <Tooltip content="Discard all changes">
          <Button variant="outline">Cancel</Button>
        </Tooltip>
        <Tooltip content="Permanently remove this item">
          <Button variant="danger">Delete</Button>
        </Tooltip>
      </div>
    );
  },
};
