import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Form,
  Text,
  TextField,
  Wizard,
  WizardNavigation,
  WizardStep,
  WizardSummary,
} from '@ttoss/fsl-ui';
import * as React from 'react';

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

/**
 * Per-step validation is a composition, not a Wizard feature: each step's
 * content is its own `Form`, and the navigation's forward button is a submit
 * bound to the ACTIVE step's form via the HTML `form` attribute — so the
 * platform's native validation gates the advance, and the step's own fields
 * report the refusal.
 */
const PerStepValidationFlow = () => {
  const [step, setStep] = React.useState(0);
  return (
    <Wizard currentStep={step} onStepChange={setStep} aria-label="Checkout">
      <WizardStep aria-label="Card details">
        <Form
          id="checkout-step-0"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(1);
          }}
        >
          <TextField label="Card number" name="card" isRequired />
        </Form>
      </WizardStep>
      <WizardStep aria-label="Billing address">
        <Form
          id="checkout-step-1"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(2);
          }}
        >
          <TextField label="Billing address" name="address" isRequired />
        </Form>
      </WizardStep>
      <WizardSummary>Saved.</WizardSummary>
      <WizardNavigation>
        {(state) => {
          return (
            <>
              <Button
                evaluation="secondary"
                onPress={state.goPrev}
                isDisabled={state.isFirst || state.isComplete}
              >
                Back
              </Button>
              <Button
                type="submit"
                form={`checkout-step-${state.currentStep}`}
                isDisabled={state.isComplete}
              >
                {state.isLast ? 'Save' : 'Next'}
              </Button>
            </>
          );
        }}
      </WizardNavigation>
    </Wizard>
  );
};

export const PerStepValidation: Story = {
  tags: ['autodocs'],
  render: () => {
    return <PerStepValidationFlow />;
  },
};
