import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Wizard,
  WizardNavigation,
  WizardStep,
  WizardSummary,
} from '@ttoss/ui2';
import * as React from 'react';

/**
 * `Wizard` is the second runtime proof that FSL `Composition` is a
 * behavior-driving dimension. Unlike `DialogActions` — which reorders
 * leaves by their runtime `composition` prop — `Wizard` dispatches on the
 * *fixed* `composition` identity of its sub-parts to decide which one is
 * rendered for the current step.
 *
 * - `WizardStep` (`composition: 'step'`) — only the step at `currentStep`
 *   is mounted.
 * - `WizardSummary` (`composition: 'summary'`) — mounted iff the user has
 *   advanced past the last step.
 * - `WizardNavigation` (`composition: 'navigation'`) — always mounted;
 *   reads wizard state from context.
 */
const meta: Meta<typeof Wizard> = {
  title: 'ui2/Wizard',
  component: Wizard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  // The Wizard root carries no `evaluation` prop — its frame is visually
  // transparent. See `packages/ui2/CONTRIBUTING.md` §4 (evidence rule).
};

export default meta;
type Story = StoryObj<typeof Wizard>;

/**
 * Uncontrolled — the Wizard manages its own step state.
 * Click Next/Back to see the step swap; finish to see the summary.
 */
export const Uncontrolled: Story = {
  render: (args) => {
    return (
      <Wizard {...args} aria-label="Onboarding">
        <WizardStep>
          <h3 style={{ margin: 0 }}>Step 1 — your info</h3>
          <p>Tell us your name and email.</p>
        </WizardStep>
        <WizardStep>
          <h3 style={{ margin: 0 }}>Step 2 — credentials</h3>
          <p>Pick a password.</p>
        </WizardStep>
        <WizardStep>
          <h3 style={{ margin: 0 }}>Step 3 — review</h3>
          <p>Confirm everything looks right.</p>
        </WizardStep>
        <WizardSummary>
          <h3 style={{ margin: 0 }}>All done!</h3>
          <p>Your account has been created.</p>
        </WizardSummary>
        <WizardNavigation
          onFinish={() => {
            return;
          }}
        />
      </Wizard>
    );
  },
};

/**
 * Controlled — the host owns `currentStep` and receives `onStepChange`.
 * Use this shape when the wizard must gate on async validation between
 * steps or persist progress outside the component.
 */
const ControlledDemo = () => {
  const [step, setStep] = React.useState(0);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 400,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontFamily: 'monospace',
          padding: 8,
          borderRadius: 4,
          background: 'rgba(0,0,0,0.06)',
        }}
      >
        host-owned currentStep = {step}
      </div>
      <Wizard
        currentStep={step}
        onStepChange={setStep}
        aria-label="Controlled wizard"
      >
        <WizardStep>
          <h3 style={{ margin: 0 }}>Step 1</h3>
          <p>First step content.</p>
        </WizardStep>
        <WizardStep>
          <h3 style={{ margin: 0 }}>Step 2</h3>
          <p>Second step content.</p>
        </WizardStep>
        <WizardSummary>
          <h3 style={{ margin: 0 }}>Done</h3>
        </WizardSummary>
        <WizardNavigation />
      </Wizard>
    </div>
  );
};

export const Controlled: Story = {
  render: () => {
    return <ControlledDemo />;
  },
};

/**
 * **Composition dispatch proof.** The sub-parts are declared in scrambled
 * source order (navigation first, summary second, steps last). The Wizard
 * host classifies them by their fixed `composition` identity, so output
 * is still: active step → navigation (summary hidden until complete).
 * The source-order-agnostic dispatch is what distinguishes this from a
 * naive flex layout.
 */
export const CompositionDispatch: Story = {
  render: () => {
    return (
      <Wizard aria-label="Dispatch demo">
        <WizardNavigation />
        <WizardSummary>
          <h3 style={{ margin: 0 }}>All done</h3>
        </WizardSummary>
        <WizardStep>
          <h3 style={{ margin: 0 }}>First</h3>
        </WizardStep>
        <WizardStep>
          <h3 style={{ margin: 0 }}>Second</h3>
        </WizardStep>
      </Wizard>
    );
  },
};
