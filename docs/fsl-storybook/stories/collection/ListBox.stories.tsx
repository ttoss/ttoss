import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListBox, ListBoxItem } from '@ttoss/fsl-ui';

const meta: Meta<typeof ListBox> = {
  title: 'Collection/ListBox',
  component: ListBox,
  subcomponents: { ListBoxItem },
};

export default meta;

type Story = StoryObj<typeof ListBox>;

export const Default: Story = {
  render: () => {
    return (
      <ListBox
        aria-label="Frameworks"
        selectionMode="single"
        defaultSelectedKeys={['react']}
      >
        <ListBoxItem id="react">React</ListBoxItem>
        <ListBoxItem id="vue">Vue</ListBoxItem>
        <ListBoxItem id="svelte">Svelte</ListBoxItem>
      </ListBox>
    );
  },
};
