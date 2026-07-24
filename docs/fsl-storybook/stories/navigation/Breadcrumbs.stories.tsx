import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb, Breadcrumbs } from '@ttoss/fsl-ui';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Navigation/Breadcrumbs',
  component: Breadcrumbs,
  subcomponents: { Breadcrumb },
};

export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  render: () => {
    return (
      <Breadcrumbs>
        <Breadcrumb href="#workspace">Workspace</Breadcrumb>
        <Breadcrumb href="#projects">Projects</Breadcrumb>
        <Breadcrumb>Deploy pipeline</Breadcrumb>
      </Breadcrumbs>
    );
  },
};
