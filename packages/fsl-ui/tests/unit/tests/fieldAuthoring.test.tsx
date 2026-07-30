/**
 * Field authoring — the one-line form and the composed form.
 *
 * A field may be written as copy-props or as slots, never both (the union is a
 * compile-time rule, so what is testable at runtime is that each form produces
 * the same wiring). These assert the part that matters and cannot be seen from
 * the type: that the one-line form reaches the *same* a11y wiring the composed
 * form does — label associated, description and message linked through
 * `aria-describedby`, and the message mounted so the platform's own constraint
 * copy appears without the caller supplying any.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form, FormSubmit, TextArea, TextField } from 'src/index';

describe('field authoring: the one-line form', () => {
  test('TextField associates its label with the control', () => {
    render(<TextField label="Email" />);

    const control = screen.getByRole('textbox', { name: 'Email' });

    expect(control.tagName.toLowerCase()).toBe('input');
    expect(control).toHaveAttribute('data-scope', 'text-field');
    expect(control).toHaveAttribute('data-part', 'control');
  });

  test('TextField links its description to the control', () => {
    render(<TextField label="Email" description="We never share it." />);

    const control = screen.getByRole('textbox', { name: 'Email' });
    const described = control.getAttribute('aria-describedby');

    expect(described).not.toBeNull();
    expect(
      document.getElementById((described as string).split(' ')[0] as string)
    ).toHaveTextContent('We never share it.');
  });

  test('TextField renders the caller-supplied message only while invalid', () => {
    const { rerender } = render(
      <TextField label="Email" errorMessage="Enter an email." />
    );

    expect(screen.queryByText('Enter an email.')).toBeNull();

    rerender(
      <TextField label="Email" errorMessage="Enter an email." isInvalid />
    );

    expect(screen.getByText('Enter an email.')).toBeInTheDocument();
  });

  test('with no errorMessage, the platform supplies the copy on a failed submit', async () => {
    const user = userEvent.setup();

    render(
      <Form>
        <TextField label="Email" name="email" isRequired />
        <FormSubmit>Save</FormSubmit>
      </Form>
    );

    // Nothing to say before the field has been asked for.
    expect(
      document.querySelector(
        '[data-scope="text-field"][data-part="validationMessage"]'
      )
    ).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    const message = document.querySelector(
      '[data-scope="text-field"][data-part="validationMessage"]'
    );

    // The caller supplied no copy, so what appears is the browser's own
    // constraint message — already localized by the platform, which is why the
    // one-line form always mounts the slot.
    expect(message).not.toBeNull();
    expect(message).toHaveTextContent(/\S/);
  });

  test('placeholder reaches the control, which the RAC root does not accept', () => {
    render(<TextField label="Email" placeholder="you@example.com" />);

    expect(screen.getByPlaceholderText('you@example.com')).toHaveAttribute(
      'data-part',
      'control'
    );
  });

  test('a label-less one-line field still renders its control', () => {
    render(<TextField aria-label="Search term" />);

    expect(screen.getByRole('textbox', { name: 'Search term' })).toBeVisible();
  });

  test('TextArea takes the same one-line form and stays multiline', async () => {
    const user = userEvent.setup();

    render(<TextArea label="Notes" description="Optional." />);

    const control = screen.getByRole('textbox', { name: 'Notes' });

    expect(control.tagName.toLowerCase()).toBe('textarea');
    await user.type(control, 'first');
    expect(control).toHaveValue('first');
  });

  test('TextArea one-line form links description and mounts the message', () => {
    render(
      <TextArea
        label="Notes"
        description="Optional."
        errorMessage="Required."
        isInvalid
      />
    );

    expect(screen.getByText('Required.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAttribute(
      'aria-describedby'
    );
  });

  test('TextArea placeholder reaches the textarea', () => {
    render(<TextArea label="Notes" placeholder="Write something" />);

    expect(screen.getByPlaceholderText('Write something')).toHaveAttribute(
      'data-part',
      'control'
    );
  });
});

describe('field authoring: the composed form still works', () => {
  test('a render-prop child receives the field state', () => {
    render(
      <TextField isInvalid>
        {({ isInvalid }) => {
          return <span data-testid="flag">{String(isInvalid)}</span>;
        }}
      </TextField>
    );

    expect(screen.getByTestId('flag')).toHaveTextContent('true');
  });

  test('a render-prop child works on TextArea too', () => {
    render(
      <TextArea isRequired>
        {({ isRequired }) => {
          return <span data-testid="req">{String(isRequired)}</span>;
        }}
      </TextArea>
    );

    expect(screen.getByTestId('req')).toHaveTextContent('true');
  });
});
