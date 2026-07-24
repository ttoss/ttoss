import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading, Stack } from '@ttoss/fsl-ui';

const meta: Meta<typeof Heading> = {
  title: 'Structure/Heading',
  component: Heading,
};

export default meta;

type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: { level: 2, size: 'headline-md', children: 'Workspace analytics' },
};

export const Scale: Story = {
  render: () => {
    return (
      <Stack gap="md">
        <Heading level={2} size="display-sm">
          Display sm
        </Heading>
        <Heading level={2} size="headline-lg">
          Headline lg
        </Heading>
        <Heading level={2} size="headline-md">
          Headline md
        </Heading>
        <Heading level={2} size="headline-sm">
          Headline sm
        </Heading>
        <Heading level={2} size="title-lg">
          Title lg
        </Heading>
        <Heading level={2} size="title-md">
          Title md
        </Heading>
        <Heading level={2} size="title-sm">
          Title sm
        </Heading>
      </Stack>
    );
  },
};
