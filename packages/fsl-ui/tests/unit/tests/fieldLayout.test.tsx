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
  ComboBox,
  ComboBoxItem,
  Form,
  FormActions,
  FormSubmit,
  Select,
  SelectItem,
  Switch,
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

// ---------------------------------------------------------------------------
// `labelPosition="side"` — the Form owns one label column for the whole form
//
// The mechanism is `grid-template-columns: subgrid`: the Form declares the two
// columns and each field root becomes a row that inherits them, so the alignment
// is the browser's and not a width measured and threaded down. That is also why
// this cannot be a per-field prop — per-field grids each size their own label
// column and leave the controls ragged, which is the opposite of the point.
//
// jsdom has no layout, so what is asserted here is the *declaration*: the grid
// exists, each field spans it, and every part is in the column it belongs to. The
// pixel proof (labels sharing a column, controls sharing an x) is the browser
// measurement that gates the item.
// ---------------------------------------------------------------------------

const styleOf = (selector: string) => {
  const el = document.querySelector<HTMLElement>(selector);

  expect(el).not.toBeNull();

  return (el as HTMLElement).style;
};

describe('a side-label Form', () => {
  const wideForm = (labelPosition: 'top' | 'side') => {
    return (
      <Form labelPosition={labelPosition}>
        <TextField label="Workspace name" description="Shown to members." />
        <TextArea label="Description" />
        <Select label="Region">
          <SelectItem id="eu">Europe</SelectItem>
        </Select>
        <ComboBox label="Timezone">
          <ComboBoxItem id="lisbon">Lisbon</ComboBoxItem>
        </ComboBox>
        <FormActions>
          <FormSubmit>Save</FormSubmit>
        </FormActions>
      </Form>
    );
  };

  test('declares the two columns the fields row into', () => {
    render(wideForm('side'));

    const form = styleOf('[data-scope="form"][data-part="root"]');

    expect(form.display).toBe('grid');
    // `max-content` is what subgrid is for: the column is as wide as the widest
    // label and nobody measures anything. Overridable, never hard-coded.
    expect(form.gridTemplateColumns).toBe(
      'var(--fsl-form-label-width, max-content) minmax(0, 1fr)'
    );
  });

  test.each([
    ['text-field', 'control'],
    ['text-area', 'control'],
    ['select', 'trigger'],
    ['combo-box', 'frame'],
  ])(
    '%s becomes a subgrid row with its label in column 1',
    (scope, control) => {
      render(wideForm('side'));

      const root = styleOf(`[data-scope="${scope}"][data-part="root"]`);

      expect(root.display).toBe('grid');
      expect(root.gridTemplateColumns).toBe('subgrid');
      expect(root.gridColumn).toBe('1 / -1');
      // Baseline, not start: the control's own inset would otherwise push its value
      // below a top-aligned label, and an offset to compensate is a number that
      // stops being right when the inset changes — which a theme may do (the
      // inset is a fixed contract since ADR-022, but still theme-tunable).
      expect(root.alignItems).toBe('baseline');

      expect(
        styleOf(`[data-scope="${scope}"][data-part="label"]`).gridColumn
      ).toBe('1');
      expect(
        styleOf(`[data-scope="${scope}"][data-part="${control}"]`).gridColumn
      ).toBe('2');
    }
  );

  test('supporting copy and the action row sit under the controls, not the labels', () => {
    render(wideForm('side'));

    expect(
      styleOf('[data-scope="text-field"][data-part="description"]').gridColumn
    ).toBe('2');
    expect(styleOf('[data-scope="form"][data-part="actions"]').gridColumn).toBe(
      '2'
    );
  });

  test('the stacked default declares no grid at all', () => {
    render(wideForm('top'));

    const form = styleOf('[data-scope="form"][data-part="root"]');
    const field = styleOf('[data-scope="text-field"][data-part="root"]');

    expect(form.display).toBe('flex');
    expect(field.display).toBe('flex');
    // Not merely "not grid": a stacked field carries no grid properties, so a
    // host reading the anatomy sees one layout rather than two overlaid.
    expect(field.gridColumn).toBe('');
    expect(
      styleOf('[data-scope="text-field"][data-part="label"]').gridColumn
    ).toBe('');
  });

  test('a field outside any Form still stacks', () => {
    render(<TextField label="Age" />);

    expect(styleOf('[data-scope="text-field"][data-part="root"]').display).toBe(
      'flex'
    );
  });

  test('Checkbox and Switch keep their inline label but still take the control column', () => {
    render(
      <Form labelPosition="side">
        <Checkbox>Email me about deploys</Checkbox>
        <Switch>Require review</Switch>
      </Form>
    );

    // Their *label* ignores `labelPosition`: it is the row, and a side label
    // exists to pull a label out of the stack above a control, which these never
    // had. Their **placement** does not ignore it. This assertion originally
    // pinned `''` — written from the reasoning rather than from looking — and the
    // Studio's settings form showed what that produced: the checkbox row landed
    // in the label column and shared a grid row with the Save button, reading as
    // its caption.
    expect(
      styleOf('[data-scope="checkbox"][data-part="root"]').gridColumn
    ).toBe('2');
    expect(styleOf('[data-scope="switch"][data-part="root"]').gridColumn).toBe(
      '2'
    );

    // And no label of theirs moved into the label column.
    expect(
      document
        .querySelector('[data-scope="checkbox"][data-part="label"]')
        ?.getAttribute('style')
    ).not.toContain('grid-column');
  });

  test('the layout context is still static across a re-render', () => {
    const seen = new Set<unknown>();

    const Probe = () => {
      seen.add(useFieldLayout());
      return null;
    };

    const { rerender } = render(
      <Form labelPosition="side" necessityIndicator="icon">
        <Probe />
      </Form>
    );

    rerender(
      <Form labelPosition="side" necessityIndicator="icon">
        <Probe />
      </Form>
    );

    // The value grew a second key in this item; the memo has to cover both or
    // every field in the form re-renders on any Form render.
    expect(seen.size).toBe(1);
  });
});
