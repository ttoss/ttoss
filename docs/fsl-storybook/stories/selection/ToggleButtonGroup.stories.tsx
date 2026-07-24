import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToggleButton, ToggleButtonGroup } from '@ttoss/fsl-ui';

const meta: Meta<typeof ToggleButtonGroup> = {
  title: 'Selection/ToggleButtonGroup',
  component: ToggleButtonGroup,
};

export default meta;

type Story = StoryObj<typeof ToggleButtonGroup>;

export const Default: Story = {
  render: () => {
    return (
      <ToggleButtonGroup aria-label="View" defaultSelectedKeys={['list']}>
        <ToggleButton id="list">List</ToggleButton>
        <ToggleButton id="board">Board</ToggleButton>
        <ToggleButton id="timeline">Timeline</ToggleButton>
      </ToggleButtonGroup>
    );
  },
};
