import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Tooltip, TooltipTrigger } from '@ttoss/fsl-ui';

const meta: Meta<typeof Tooltip> = {
  title: 'Overlay/Tooltip',
  component: Tooltip,
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => {
    return (
      <TooltipTrigger>
        <Button evaluation="muted" aria-label="Copy link">
          Copy
        </Button>
        <Tooltip>Copy a shareable link</Tooltip>
      </TooltipTrigger>
    );
  },
};

export const Open: Story = {
  render: () => {
    return (
      <TooltipTrigger defaultOpen>
        <Button evaluation="muted" aria-label="Copy link">
          Copy
        </Button>
        <Tooltip>Copy a shareable link</Tooltip>
      </TooltipTrigger>
    );
  },
};
