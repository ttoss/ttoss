import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Text,
  Wizard,
  WizardNavigation,
  WizardStep,
  WizardSummary,
} from '@ttoss/fsl-ui';

const meta: Meta<typeof Wizard> = {
  title: 'Structure/Wizard',
  component: Wizard,
  subcomponents: { WizardStep, WizardNavigation, WizardSummary },
};

export default meta;

type Story = StoryObj<typeof Wizard>;

export const Default: Story = {
  render: () => {
    return (
      <Wizard aria-label="Workspace setup">
        <WizardStep>
          <Text>Step one — name your workspace.</Text>
        </WizardStep>
        <WizardStep>
          <Text>Step two — invite your team.</Text>
        </WizardStep>
        <WizardNavigation
          prevLabel="Back"
          nextLabel="Next"
          finishLabel="Finish"
        />
        <WizardSummary>
          <Text>All set — the workspace is ready.</Text>
        </WizardSummary>
      </Wizard>
    );
  },
};
