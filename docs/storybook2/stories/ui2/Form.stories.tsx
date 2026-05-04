import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Form,
  FormActions,
  FormSubmit,
  TextField,
  TextFieldControl,
  TextFieldDescription,
  TextFieldError,
  TextFieldLabel,
} from '@ttoss/ui2';
import * as React from 'react';

const meta: Meta<typeof Form> = {
  title: 'ui2/Form',
  component: Form,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Form>;

/**
 * Standard form — Input + Action coexist under a single submission contract.
 *
 * `<Form>` is the semantic scope (Structure root); its default flex-column
 * layout separates field blocks and the action row. Submission is handled
 * by the native `<form>` element via React Aria's `Form`; `onSubmit`
 * receives a standard `SubmitEvent` and the story handler calls
 * `preventDefault()` to keep the page from navigating.
 */
export const Standard: Story = {
  render: () => {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const data = Object.fromEntries(
        new FormData(event.currentTarget).entries()
      );
      alert(`Submitted: ${JSON.stringify(data, null, 2)}`);
    };

    return (
      <div style={{ minWidth: '20rem' }}>
        <Form onSubmit={handleSubmit}>
          <TextField name="email" type="email" isRequired>
            <TextFieldLabel>Email</TextFieldLabel>
            <TextFieldControl placeholder="you@example.com" />
            <TextFieldDescription>
              We never share your email.
            </TextFieldDescription>
            <TextFieldError />
          </TextField>
          <TextField name="password" type="password" isRequired>
            <TextFieldLabel>Password</TextFieldLabel>
            <TextFieldControl />
            <TextFieldError />
          </TextField>
          <FormActions>
            <Button type="reset" evaluation="muted">
              Reset
            </Button>
            <FormSubmit>Save</FormSubmit>
          </FormActions>
        </Form>
      </div>
    );
  },
};

/**
 * `State.invalid` at the composite level — the key FSL validation of Step 3.
 *
 * React Aria's `<Form validationErrors={…}>` propagates server-style
 * validation errors to nested fields by `name`. Each `TextField` surfaces
 * its own `isInvalid` state via the existing `resolveInteractiveStyle`
 * cascade — the Form composite adds **no new state machinery** (per the
 * "foundation is closed" principle). `TextFieldError` auto-renders the
 * message, and the control + label pick up the `invalid` token state.
 */
export const InvalidState: Story = {
  render: () => {
    return (
      <div style={{ minWidth: '20rem' }}>
        <Form
          validationErrors={{
            email: 'This email is already registered.',
            username: 'Username must be at least 3 characters.',
          }}
        >
          <TextField name="email" type="email">
            <TextFieldLabel>Email</TextFieldLabel>
            <TextFieldControl defaultValue="taken@example.com" />
            <TextFieldError />
          </TextField>
          <TextField name="username">
            <TextFieldLabel>Username</TextFieldLabel>
            <TextFieldControl defaultValue="ab" />
            <TextFieldError />
          </TextField>
          <FormActions>
            <FormSubmit>Continue</FormSubmit>
          </FormActions>
        </Form>
      </div>
    );
  },
};

/**
 * `Consequence = 'committing'` — the second real callsite, distinct from
 * `MenuItem`'s typical values (`neutral` / `destructive`).
 *
 * `<FormSubmit>` defaults to `consequence="committing"`. Inspect the DOM:
 * the submit button renders with `data-consequence="committing"` and
 * `data-composition="primaryAction"`. Just like `MenuItem`, the attribute
 * does **not** drive color — it is the grep-able signal that host
 * integrations (telemetry, undo/redo hooks, optimistic-UI wrappers) can
 * observe to distinguish "button that writes state" from "button that
 * opens a form" or "button that cancels".
 */
export const CommittingConsequence: Story = {
  render: () => {
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      alert('Committed.');
    };

    return (
      <div style={{ minWidth: '20rem' }}>
        <Form onSubmit={handleSubmit}>
          <TextField name="note">
            <TextFieldLabel>Quick note</TextFieldLabel>
            <TextFieldControl />
          </TextField>
          <FormActions>
            <Button type="reset" evaluation="muted">
              Discard
            </Button>
            <FormSubmit>Save note</FormSubmit>
          </FormActions>
        </Form>
      </div>
    );
  },
};

/**
 * Pending submit — the host owns lifecycle, the composite emits the signal.
 *
 * `isPending` is host-controlled (ui2 does not own form submission state).
 * When `true`, `<FormSubmit>` is disabled (preventing double-submit) and
 * emits `data-pending` so CSS/tests can show a spinner, skeleton, or
 * blocked cursor without re-wiring the disabled path.
 */
const PendingSubmitComponent = () => {
  const [pending, setPending] = React.useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    window.setTimeout(() => {
      return setPending(false);
    }, 1500);
  };

  return (
    <div style={{ minWidth: '20rem' }}>
      <Form onSubmit={handleSubmit}>
        <TextField name="title">
          <TextFieldLabel>Title</TextFieldLabel>
          <TextFieldControl />
        </TextField>
        <FormActions>
          <FormSubmit isPending={pending}>
            {pending ? 'Saving…' : 'Save'}
          </FormSubmit>
        </FormActions>
      </Form>
    </div>
  );
};

export const PendingSubmit: Story = {
  render: () => {
    return <PendingSubmitComponent />;
  },
};

/**
 * `FormActions` alignment variants.
 *
 * `align="end"` (default) matches the platform convention of submit-on-
 * the-right. `align="between"` is useful when a destructive reset sits
 * on the opposite side of the primary commit. The row carries
 * `composition="supporting"` to tag it as supplementary to the form's
 * primary input content — a divergence from its `structure="content"`
 * that Menu could not produce (Menu items' `structure` and `composition`
 * are both leaf-level).
 */
export const ActionsAlignment: Story = {
  render: () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          minWidth: '24rem',
        }}
      >
        <Form>
          <TextField name="a">
            <TextFieldLabel>align=&quot;end&quot; (default)</TextFieldLabel>
            <TextFieldControl />
          </TextField>
          <FormActions>
            <Button evaluation="muted">Cancel</Button>
            <FormSubmit>Save</FormSubmit>
          </FormActions>
        </Form>
        <Form>
          <TextField name="b">
            <TextFieldLabel>align=&quot;between&quot;</TextFieldLabel>
            <TextFieldControl />
          </TextField>
          <FormActions align="between">
            <Button evaluation="muted">Discard</Button>
            <FormSubmit>Save</FormSubmit>
          </FormActions>
        </Form>
      </div>
    );
  },
};
