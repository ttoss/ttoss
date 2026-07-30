/**
 * Form validation behaviour we inherit rather than implement.
 *
 * React Aria's native `validationBehavior` already blocks a submit, focuses the
 * first invalid field, and moves to the next one once that is fixed. Measured in
 * the Studio's own login form before anything was built on top of it — which is
 * why the deliverable here is a guard and not a feature.
 *
 * It is worth pinning because it is load-bearing and invisible: it is the thing
 * a headless form library structurally cannot offer (TanStack says so outright —
 * "we intentionally do not have insights into your markup"), and it would be
 * lost silently by an upstream change or by someone setting
 * `validationBehavior="aria"`, which does not merely stop displaying native
 * constraints but removes them.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, Form, FormSubmit, TextField } from 'src/index';

const control = (name: string) => {
  return screen.getByRole('textbox', { name });
};

describe('a failed submit', () => {
  test('is blocked, and focus lands on the first invalid field', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e: React.FormEvent) => {
      e.preventDefault();
    });

    render(
      <Form onSubmit={onSubmit}>
        <TextField label="Email" name="email" isRequired />
        <TextField label="Password" name="password" isRequired />
        <FormSubmit>Sign in</FormSubmit>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(control('Email')).toHaveFocus();
  });

  test('moves to the next invalid field once the first is fixed', async () => {
    const user = userEvent.setup();

    render(
      <Form>
        <TextField label="Email" name="email" isRequired />
        <TextField label="Password" name="password" isRequired />
        <FormSubmit>Sign in</FormSubmit>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    await user.type(control('Email'), 'ennio@meridian.dev');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(control('Password')).toHaveFocus();
  });

  test('reports each invalid field once, with the control as the target', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];

    render(
      <Form
        onInvalid={(e) => {
          const target = e.target as HTMLInputElement;
          // The control itself is the target, carrying its name and its
          // addressable anatomy — which is what makes a form-level summary
          // buildable at all (deferred: FORMS.md B3b).
          expect(target).toHaveAttribute('data-part', 'control');
          seen.push(target.name);
        }}
      >
        <TextField label="Email" name="email" isRequired />
        <TextField label="Password" name="password" isRequired />
        <FormSubmit>Sign in</FormSubmit>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(seen).toEqual(['email', 'password']);
  });

  test('a required Checkbox blocks the submit like any other field', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e: React.FormEvent) => {
      e.preventDefault();
    });

    render(
      <Form onSubmit={onSubmit}>
        <Checkbox isRequired name="terms">
          Accept terms
        </Checkbox>
        <FormSubmit>Continue</FormSubmit>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe('the platform supplies the copy', () => {
  test('a field with no errorMessage still reports why it is invalid', async () => {
    const user = userEvent.setup();

    render(
      <Form>
        <TextField label="Email" name="email" isRequired />
        <FormSubmit>Sign in</FormSubmit>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const message = document.querySelector(
      '[data-scope="text-field"][data-part="validationMessage"]'
    );

    // Whatever the platform says, in whatever language it says it — copy we
    // could not ship ourselves (ADR-001).
    expect(message).toHaveTextContent(/\S/);
  });
});

// ---------------------------------------------------------------------------
// The two §1 claims that had no oracle until the Studio consumed them (forms
// item I): a submit that is genuinely async, and a refusal only a server can
// issue. Both are inherited mechanisms — the guards pin that they stay
// reachable through our composites, because each was once promised in a JSDoc
// while the DOM showed otherwise (FormSubmit's first version hand-wrote
// `data-pending`/`data-composition`, and React Aria clobbered both).
// ---------------------------------------------------------------------------

describe('a pending submit', () => {
  test('marks itself, names its slot, and stays focusable instead of going disabled', () => {
    render(
      <Form>
        <TextField label="Email" name="email" />
        <FormSubmit isPending>Saving…</FormSubmit>
      </Form>
    );

    const button = screen.getByRole('button', { name: /Saving/ });

    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).toHaveAttribute('data-composition', 'primaryAction');
    // Pending is aria-disabled, never `disabled`: the control must not vanish
    // from under the keyboard user mid-submit. React Aria blocks the press and
    // implicit re-submission instead (the `type` rides as `button` while
    // pending), and announces the state change to AT.
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('type', 'button');
  });

  test('blocks the press while pending', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e: React.FormEvent) => {
      e.preventDefault();
    });

    render(
      <Form onSubmit={onSubmit}>
        <TextField label="Email" name="email" />
        <FormSubmit isPending>Saving…</FormSubmit>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: /Saving/ }));

    // What is NOT blocked, measured while writing this: the form's own
    // implicit submission (Enter in a lone text input) still fires — that is
    // the platform's behaviour on the <form>, out of any button's reach,
    // which is why a host that owns the submission lifecycle re-entry-guards
    // its handler (the Studio's create flow does).
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('server errors', () => {
  test('validationErrors lands on the field by name and clears when edited', async () => {
    const user = userEvent.setup();

    render(
      <Form validationErrors={{ email: 'That address is already invited.' }}>
        <TextField label="Email" name="email" />
        <FormSubmit>Invite</FormSubmit>
      </Form>
    );

    // The refusal arrives from outside the field's own validation — routed by
    // `name`, shown in the field's message slot, control flagged invalid.
    expect(screen.getByText('That address is already invited.')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInvalid();

    // A corrected value withdraws the server message on **commit** (blur),
    // not on each keystroke — read in react-stately's
    // useFormValidationState: `commitValidation` is what "also clear[s] any
    // server errors". Pinned at the commit boundary because a stale server
    // error over a corrected value is the classic server-validation defect.
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'x');
    await user.tab();
    expect(screen.queryByText('That address is already invited.')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Email' })).not.toBeInvalid();
  });
});
