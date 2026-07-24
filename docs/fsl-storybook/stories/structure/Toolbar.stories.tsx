import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ToggleButton, Toolbar } from '@ttoss/fsl-ui';

const meta: Meta<typeof Toolbar> = {
  title: 'Structure/Toolbar',
  component: Toolbar,
};

export default meta;

type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {
  render: () => {
    return (
      <Toolbar aria-label="Formatting">
        <ToggleButton evaluation="muted" aria-label="Bold">
          B
        </ToggleButton>
        <ToggleButton evaluation="muted" aria-label="Italic">
          I
        </ToggleButton>
        <Button evaluation="muted" aria-label="Insert link">
          Link
        </Button>
      </Toolbar>
    );
  },
};
