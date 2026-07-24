import type { Meta, StoryObj } from '@storybook/react-vite';
import { Disclosure, DisclosurePanel, DisclosureTrigger } from '@ttoss/fsl-ui';

const meta: Meta<typeof Disclosure> = {
  title: 'Disclosure/Disclosure',
  component: Disclosure,
  subcomponents: { DisclosureTrigger, DisclosurePanel },
};

export default meta;

type Story = StoryObj<typeof Disclosure>;

export const Default: Story = {
  render: () => {
    return (
      <Disclosure>
        <DisclosureTrigger>Advanced options</DisclosureTrigger>
        <DisclosurePanel>
          Environment variables, build flags, and cache policy.
        </DisclosurePanel>
      </Disclosure>
    );
  },
};

export const Expanded: Story = {
  render: () => {
    return (
      <Disclosure defaultExpanded>
        <DisclosureTrigger>Advanced options</DisclosureTrigger>
        <DisclosurePanel>
          Environment variables, build flags, and cache policy.
        </DisclosurePanel>
      </Disclosure>
    );
  },
};
