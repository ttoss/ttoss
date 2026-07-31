import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ContextualHelp,
  Heading,
  Select,
  SelectItem,
  Text,
  TextField,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof ContextualHelp> = {
  title: 'Overlay/ContextualHelp',
  component: ContextualHelp,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ContextualHelp>;

export const Default: Story = {
  render: () => {
    return (
      <ContextualHelp aria-label="About regions">
        <Heading level={2} size="title-sm">
          Choosing a region
        </Heading>
        <Text>
          Deploys run in this region. Changing it migrates workspace data on the
          next deploy.
        </Text>
      </ContextualHelp>
    );
  },
};

/**
 * The slot it exists for: `contextualHelp` on any field renders the trigger
 * beside the label — outside the `<label>` element, so the field's accessible
 * name stays the label alone.
 */
export const BesideAFieldLabel: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <TextField
        label="Region"
        name="region"
        description="Where the workspace's infrastructure runs."
        contextualHelp={
          <ContextualHelp aria-label="About regions">
            <Heading level={2} size="title-sm">
              Choosing a region
            </Heading>
            <Text>
              Deploys run in this region. Changing it migrates workspace data on
              the next deploy.
            </Text>
          </ContextualHelp>
        }
      />
    );
  },
};

export const OnAPicker: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Select
        label="Plan"
        contextualHelp={
          <ContextualHelp aria-label="About plans">
            <Text>Upgrades apply immediately; downgrades at renewal.</Text>
          </ContextualHelp>
        }
      >
        <SelectItem id="free">Free</SelectItem>
        <SelectItem id="pro">Pro</SelectItem>
      </Select>
    );
  },
};
