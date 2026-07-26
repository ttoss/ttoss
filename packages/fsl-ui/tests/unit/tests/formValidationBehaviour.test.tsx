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
