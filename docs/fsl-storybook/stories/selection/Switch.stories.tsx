import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form, FormSubmit, Stack, Switch } from '@ttoss/fsl-ui';

const meta: Meta<typeof Switch> = {
  title: 'Selection/Switch',
  component: Switch,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: { children: 'Enable notifications' },
};

export const States: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Stack gap="sm">
        <Switch>Off</Switch>
        <Switch defaultSelected>On</Switch>
        <Switch isDisabled>Disabled</Switch>
      </Stack>
    );
  },
};

export const WithDescription: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Switch description="Applies to every member of the workspace.">
        Enforce two-factor authentication
      </Switch>
    );
  },
};

/**
 * A switch that must be ON before the form submits — an acknowledgement gate.
 * Validation arrived with the `SwitchField` root (forms item E, F-033): a
 * required switch blocks the submit and reports why through `errorMessage`.
 */
export const RequiredAcknowledgement: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Switch
          name="ack"
          isRequired
          errorMessage="Confirm before continuing."
          description="This action affects the whole workspace."
        >
          I understand the consequences
        </Switch>
        <FormSubmit>Continue</FormSubmit>
      </Form>
    );
  },
};

/**
 * With no `errorMessage`, the always-mounted message part carries the
 * platform's own localized constraint copy — copy the package cannot ship
 * itself (ADR-001).
 */
export const PlatformValidationCopy: Story = {
  tags: ['autodocs'],
  render: () => {
    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Switch name="ack" isRequired>
          Accept the terms
        </Switch>
        <FormSubmit>Continue</FormSubmit>
      </Form>
    );
  },
};
