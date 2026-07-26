/**
 * Field layout — the Form publishes it, the fields read it.
 *
 * Three things are worth guarding and none is visible from the types. That a
 * field standing on its own still marks itself required, because the marker
 * belongs to the field's meaning and not to the form's chrome. That the marker
 * is decoration for the eye only — the control already carries the native
 * `required` attribute, which AT announces on its own (measured: React Aria sets
 * `required` and no `aria-required`), so a second announcement would be noise and
 * an asterisk absorbed into the accessible name would be worse. And that the
 * context stays **static**: it is read by every field, so a value that changed
 * identity per render would re-render all of them.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFieldLayout } from 'src/components/Field/anatomy';
import {
  Checkbox,
  Form,
  FormSubmit,
  TextArea,
  TextField,
  TextFieldLabel,
} from 'src/index';

const marker = () => {
  return document.querySelector('[data-part="necessityMarker"]');
};

describe('necessity marker', () => {
  test('a required field marks itself, with no Form around it', () => {
    render(<TextField label="Age" isRequired />);

    expect(marker()).not.toBeNull();
  });

  test('a field that is not required carries no marker', () => {
    render(<TextField label="Age" />);

    expect(marker()).toBeNull();
  });

  test('the marker is hidden from assistive tech, which hears aria-required instead', () => {
    render(<TextField label="Age" isRequired />);

    expect(marker()).toHaveAttribute('aria-hidden', 'true');
    // The accessible name must stay the label alone — an asterisk read out as
    // part of the name is exactly the defect the Checkbox envelope measured.
    // What carries the requirement to AT is the native attribute: React Aria
    // sets `required` and no `aria-required` (measured).
    expect(screen.getByRole('textbox', { name: 'Age' })).toBeRequired();
  });

  test('a Form can turn the marker off for every field at once', () => {
    render(
      <Form necessityIndicator="none">
        <TextField label="Age" isRequired />
        <TextArea label="Notes" isRequired />
      </Form>
    );

    expect(
      document.querySelectorAll('[data-part="necessityMarker"]')
    ).toHaveLength(0);
    // Still required, still announced — only the decoration is gone.
    expect(screen.getByRole('textbox', { name: 'Age' })).toBeRequired();
  });

  test('a Form defaults to marking required fields', () => {
    render(
      <Form>
        <TextField label="Age" isRequired />
        <TextArea label="Notes" isRequired />
      </Form>
    );

    expect(
      document.querySelectorAll('[data-part="necessityMarker"]')
    ).toHaveLength(2);
  });

  test('the composed authoring form marks required identically to the one-line form', () => {
    const { unmount } = render(<TextField label="Age" isRequired />);
    const fromProps = marker() !== null;

    unmount();

    render(
      <TextField isRequired>
        <TextFieldLabel>Age</TextFieldLabel>
      </TextField>
    );

    expect(marker() !== null).toBe(fromProps);
  });
});

describe('the layout context is static', () => {
  test('typing in one field does not re-render its siblings', async () => {
    const user = userEvent.setup();
    const renders = { sibling: 0 };

    const Sibling = () => {
      renders.sibling += 1;
      return <TextField label="Untouched" />;
    };

    render(
      <Form>
        <TextField label="Typed" />
        <Sibling />
        <FormSubmit>Save</FormSubmit>
      </Form>
    );

    const before = renders.sibling;

    await user.type(screen.getByRole('textbox', { name: 'Typed' }), 'abc');

    // The context carries configuration, not value: a keystroke in one field
    // must not travel through the provider to every other field.
    expect(renders.sibling).toBe(before);
  });

  test('re-rendering the Form with the same setting keeps one provider value', () => {
    const seen = new Set<unknown>();

    const Probe = () => {
      seen.add(useFieldLayout());
      return null;
    };

    const { rerender } = render(
      <Form necessityIndicator="icon">
        <Probe />
      </Form>
    );

    rerender(
      <Form necessityIndicator="icon">
        <Probe />
      </Form>
    );

    expect(seen.size).toBe(1);
  });
});

describe('the marker reaches every field kind, not just the text ones', () => {
  test('a required Checkbox marks itself, in both of its shapes', () => {
    const { unmount } = render(<Checkbox isRequired>Accept</Checkbox>);

    expect(marker()).not.toBeNull();

    unmount();

    render(
      <Checkbox isRequired description="You agree to the terms.">
        Accept
      </Checkbox>
    );

    expect(marker()).not.toBeNull();
  });

  test('a Form turns it off for a Checkbox too', () => {
    render(
      <Form necessityIndicator="none">
        <Checkbox isRequired>Accept</Checkbox>
      </Form>
    );

    expect(marker()).toBeNull();
    expect(screen.getByRole('checkbox')).toBeRequired();
  });
});
