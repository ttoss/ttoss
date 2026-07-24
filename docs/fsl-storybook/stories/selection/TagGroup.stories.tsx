import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag, TagGroup } from '@ttoss/fsl-ui';

const meta: Meta<typeof TagGroup> = {
  title: 'Selection/TagGroup',
  component: TagGroup,
  subcomponents: { Tag },
};

export default meta;

type Story = StoryObj<typeof TagGroup>;

export const Default: Story = {
  render: () => {
    return (
      <TagGroup label="Filters" onRemove={() => {}}>
        <Tag id="react">React</Tag>
        <Tag id="vue">Vue</Tag>
        <Tag id="svelte">Svelte</Tag>
      </TagGroup>
    );
  },
};
