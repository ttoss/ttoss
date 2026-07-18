import {
  Button,
  Checkbox,
  ConfirmationDialog,
  createToastQueue,
  Grid,
  Meter,
  ProgressBar,
  Select,
  SelectItem,
  Separator,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  TextFieldControl,
  TextFieldDescription,
  TextFieldError,
  TextFieldLabel,
  ToastRegion,
  Wizard,
  WizardNavigation,
  WizardStep,
  WizardSummary,
} from '@ttoss/fsl-ui';
import * as React from 'react';

/**
 * Example pages (PRD F3.5) — hand-authored realistic compositions that
 * demonstrate composites live (the ones the per-component preview registry
 * doesn't cover). They are stage content, themed by the live bundle, and are
 * aligned with the fsl-bench golden scenarios (field-validation, destructive
 * confirm, wizard, themed dashboard) so the same canonical flows drive the
 * benchmark and the Studio.
 */

const FormPage = () => {
  const [email, setEmail] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const invalid = submitted && email.trim() === '';

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <Stack gap="sm">
        <TextField value={email} onChange={setEmail} isInvalid={invalid}>
          <TextFieldLabel>Email</TextFieldLabel>
          <TextFieldControl type="email" placeholder="you@example.com" />
          <TextFieldDescription>
            We never share your email.
          </TextFieldDescription>
          {invalid ? <TextFieldError>Email is required.</TextFieldError> : null}
        </TextField>

        <Select label="Framework" placeholder="Choose a framework">
          <SelectItem id="react">React</SelectItem>
          <SelectItem id="vue">Vue</SelectItem>
          <SelectItem id="svelte">Svelte</SelectItem>
        </Select>

        <Checkbox>I accept the terms of service</Checkbox>

        <Stack direction="horizontal" gap="md">
          <Button type="submit" evaluation="primary" consequence="committing">
            Create account
          </Button>
        </Stack>
      </Stack>
    </form>
  );
};

const ConfirmPage = () => {
  return (
    <Stack direction="horizontal" gap="md" wrap align="center">
      <ConfirmationDialog
        trigger={<Button evaluation="primary">Publish post</Button>}
        title="Publish post?"
        confirmLabel="Publish"
        cancelLabel="Cancel"
        consequence="committing"
        onConfirm={() => {}}
      >
        Your post will become visible to everyone.
      </ConfirmationDialog>

      <ConfirmationDialog
        trigger={<Button evaluation="negative">Delete account</Button>}
        title="Delete account?"
        confirmLabel="Delete"
        armedLabel="Click again to confirm"
        cancelLabel="Cancel"
        consequence="destructive"
        onConfirm={() => {}}
      >
        This permanently removes your account and all its data.
      </ConfirmationDialog>
    </Stack>
  );
};

const WizardPage = () => {
  const [step, setStep] = React.useState(0);
  return (
    <Wizard currentStep={step} onStepChange={setStep} aria-label="Onboarding">
      <WizardStep>Step 1 — tell us about your project.</WizardStep>
      <WizardStep>Step 2 — invite your team.</WizardStep>
      <WizardStep>Step 3 — pick a plan.</WizardStep>
      <WizardSummary>All set — welcome aboard!</WizardSummary>
      <WizardNavigation
        prevLabel="Back"
        nextLabel="Next"
        finishLabel="Finish"
      />
    </Wizard>
  );
};

const DashboardPage = () => {
  return (
    <Tabs>
      <TabList aria-label="Dashboard sections">
        <Tab id="usage">Usage</Tab>
        <Tab id="activity">Activity</Tab>
      </TabList>
      <TabPanel id="usage">
        <Stack gap="sm">
          <Grid columns={3} gap="sm">
            <Meter aria-label="Storage" label="Storage" value={72} />
            <Meter
              aria-label="Bandwidth"
              label="Bandwidth"
              value={91}
              evaluation="caution"
            />
            <Meter
              aria-label="Errors"
              label="Error budget"
              value={12}
              evaluation="negative"
            />
          </Grid>
          <Separator />
          <ProgressBar label="Sync in progress" value={48} />
        </Stack>
      </TabPanel>
      <TabPanel id="activity">Recent activity would appear here.</TabPanel>
    </Tabs>
  );
};

const TOAST_EVALUATIONS = [
  'primary',
  'positive',
  'caution',
  'negative',
] as const;

const ToastsPage = () => {
  // One queue per page instance: each stage pane keeps its own toasts, so
  // the two color modes never share a notification stack. The region is
  // viewport-fixed by design but inherits the pane's theme vars through the
  // DOM, so its surfaces still follow the pane's mode.
  const [queue] = React.useState(() => {
    return createToastQueue();
  });

  return (
    <Stack gap="xs">
      <Stack direction="horizontal" gap="md" wrap align="center">
        {TOAST_EVALUATIONS.map((evaluation) => {
          return (
            <Button
              key={evaluation}
              evaluation="muted"
              onPress={() => {
                queue.add(
                  {
                    title: `A ${evaluation} toast`,
                    description: 'Queued from the example page.',
                    evaluation,
                  },
                  { timeout: 5000 }
                );
              }}
            >
              Toast: {evaluation}
            </Button>
          );
        })}
      </Stack>
      <ToastRegion queue={queue} />
    </Stack>
  );
};

export interface ExamplePage {
  id: string;
  label: string;
  description: string;
  render: () => React.ReactNode;
}

export const EXAMPLE_PAGES: readonly ExamplePage[] = [
  {
    id: 'form',
    label: 'Form + validation',
    description: 'Text field, select, and checkbox with a validated submit.',
    render: () => {
      return <FormPage />;
    },
  },
  {
    id: 'confirm',
    label: 'Destructive confirm',
    description:
      'Committing vs destructive ConfirmationDialog — the destructive one arms on two clicks.',
    render: () => {
      return <ConfirmPage />;
    },
  },
  {
    id: 'wizard',
    label: 'Wizard',
    description: 'A three-step flow with navigation and a summary.',
    render: () => {
      return <WizardPage />;
    },
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Feedback surfaces: meters, a progress bar, and tabs.',
    render: () => {
      return <DashboardPage />;
    },
  },
  {
    id: 'toasts',
    label: 'Toasts',
    description:
      'Queued Feedback toasts across every legal evaluation — primary, positive, caution, negative.',
    render: () => {
      return <ToastsPage />;
    },
  },
];

export const findPage = (id: string): ExamplePage | undefined => {
  return EXAMPLE_PAGES.find((page) => {
    return page.id === id;
  });
};
