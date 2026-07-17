import type { Scenario } from '../types.ts';
import { check } from './check.ts';

export const fieldValidation: Scenario = {
  id: 'field-validation',
  title: 'Field + validation',
  prompt: [
    'Build a newsletter signup form with a text field labeled',
    "'Email' and a submit button labeled 'Subscribe'.",
    'Submitting with an empty or invalid email must not succeed: show the',
    "error message 'Enter a valid email' associated with the field and mark",
    'the field invalid for assistive technology (aria-invalid).',
    "After submitting a valid email, render the text 'Subscribed'.",
    'Implement the validation with the mechanism your UI library provides',
    'for invalid fields — do not rely on native browser validation popups.',
  ].join(' '),
  assert: async ({ screen, user, waitFor }) => {
    const input = screen.getByLabelText(/email/i);
    const submit = screen.getByRole('button', { name: /subscribe/i });

    await user.click(submit);

    await waitFor(() => {
      check(
        screen.queryByText(/enter a valid email/i),
        "submitting an empty email should show 'Enter a valid email'"
      );
    });

    check(
      input.getAttribute('aria-invalid') === 'true',
      'the field should carry aria-invalid="true" after an invalid submit'
    );
    check(
      screen.queryByText(/^subscribed$/i) === null,
      'an invalid submit must not succeed'
    );

    await user.clear(input);
    await user.type(input, 'user@example.com');
    await user.click(submit);

    await waitFor(() => {
      check(
        screen.queryByText(/subscribed/i),
        "a valid submit should render 'Subscribed'"
      );
    });
  },
};
