/**
 * The field envelope — every field root publishes the same three parts.
 *
 * This is a **class** guard, not a component test, and it exists because the
 * class had already drifted. Measured across the family before the shared
 * envelope parts existed: the necessity marker reached three of the nine roots
 * that accept `isRequired`, `Select` and `RadioGroup` had nowhere to render a
 * message at all (F-009 and its sibling shape), and three files carried a
 * private helper computing the colours the anatomy already computes.
 *
 * A per-component test cannot catch that — each one passes on its own. So the
 * assertions here are driven by a table, and the table is the axis: **every
 * field root whose React Aria root supplies `TextContext` and
 * `FieldErrorContext`**. Two members are deliberately absent and named, with an
 * anti-stale companion test so the exception list has to shrink the day either
 * one changes.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as React from 'react';
import {
  Checkbox,
  CheckboxGroup,
  ComboBox,
  ComboBoxItem,
  Form,
  FormSubmit,
  NumberField,
  Radio,
  RadioGroup,
  SearchField,
  SearchFieldControl,
  SearchFieldLabel,
  Select,
  SelectItem,
  Slider,
  Switch,
  TextArea,
  TextField,
} from 'src/index';

const COPY = {
  label: 'Role',
  description: 'Helper copy.',
  errorMessage: 'Pick one.',
} as const;

/**
 * Each field root, authored in its one-line form with the whole envelope.
 * `isInvalid` is set so the message part is not merely mounted but rendered —
 * React Aria's `FieldError` returns null while the field is valid.
 */
const ROOTS: Array<[scope: string, field: () => React.ReactElement]> = [
  [
    'text-field',
    () => {
      return <TextField {...COPY} isRequired isInvalid />;
    },
  ],
  [
    'text-area',
    () => {
      return <TextArea {...COPY} isRequired isInvalid />;
    },
  ],
  [
    'select',
    () => {
      return (
        <Select {...COPY} isRequired isInvalid>
          <SelectItem id="admin">Admin</SelectItem>
        </Select>
      );
    },
  ],
  [
    'combo-box',
    () => {
      return (
        <ComboBox {...COPY} isRequired isInvalid>
          <ComboBoxItem id="admin">Admin</ComboBoxItem>
        </ComboBox>
      );
    },
  ],
  [
    'number-field',
    () => {
      return <NumberField {...COPY} isRequired isInvalid />;
    },
  ],
  [
    'radio-group',
    () => {
      return (
        <RadioGroup {...COPY} isRequired isInvalid>
          <Radio value="admin">Admin</Radio>
        </RadioGroup>
      );
    },
  ],
  [
    'checkbox-group',
    () => {
      return (
        <CheckboxGroup {...COPY} isRequired isInvalid>
          <Checkbox value="admin">Admin</Checkbox>
        </CheckboxGroup>
      );
    },
  ],
];

const part = (scope: string, name: string) => {
  return document.querySelector<HTMLElement>(
    `[data-scope="${scope}"][data-part="${name}"]`
  );
};

describe.each(ROOTS)('%s', (scope, field) => {
  test('renders label, description and validationMessage', () => {
    render(field());

    expect(part(scope, 'label')).toHaveTextContent(COPY.label);
    expect(part(scope, 'description')).toHaveTextContent(COPY.description);
    expect(part(scope, 'validationMessage')).toHaveTextContent(
      COPY.errorMessage
    );
  });

  test('marks itself required, inside the label and hidden from AT', () => {
    render(field());

    const marker = part(scope, 'label')?.querySelector(
      '[data-part="necessityMarker"]'
    );

    // Inside the label because the marker qualifies those words; `aria-hidden`
    // because the control already carries the native `required` attribute.
    expect(marker).not.toBeNull();
    expect(marker).toHaveAttribute('aria-hidden', 'true');
  });

  test('links its description to the control it describes', () => {
    render(field());

    const description = part(scope, 'description');
    const describedBy = document.querySelector(
      `[aria-describedby~="${description?.id}"]`
    );

    // What `slot="description"` buys, and the only reason the part is a RAC
    // `Text` rather than a plain span: the field points at it.
    expect(description?.id).toBeTruthy();
    expect(describedBy).not.toBeNull();
  });

  test('reads the supporting step, and the label reads the naming step', () => {
    render(field());

    const description = part(scope, 'description');
    const message = part(scope, 'validationMessage');

    // The two supporting parts are one decision — a component that tuned one of
    // them alone is the drift this table exists to catch.
    expect(message?.style.fontSize).toBe(description?.style.fontSize);
    expect(description?.style.fontSize).not.toBe(
      part(scope, 'label')?.style.fontSize
    );
  });
});

describe('the composed authoring form marks required identically', () => {
  test('SearchField, whose label is a slot rather than a prop', () => {
    render(
      <SearchField clearLabel="Clear search" isRequired>
        <SearchFieldLabel>Query</SearchFieldLabel>
        <SearchFieldControl />
      </SearchField>
    );

    // The flag reaches the label through the composite scope, taken from the
    // root's render props — a slot label cannot read the root's prop.
    expect(
      part('search-field', 'label')?.querySelector(
        '[data-part="necessityMarker"]'
      )
    ).not.toBeNull();
  });
});

describe('the members that deliberately have no message part', () => {
  /**
   * Named, with the mechanism that excludes each — not a membership list to be
   * maintained by hand. Both are `E` in `INTERNAL/FORMS.md`.
   *
   * - `Switch`: React Aria's `SwitchProps` **omits** `isRequired`, `isInvalid`,
   *   `validate` and `validationBehavior` outright (read in `Switch.d.ts`), so
   *   there is no validation state to render. `SwitchRenderProps` does expose
   *   `isRequired`, and RAC 1.19 ships a separate `SwitchField` root that owns
   *   it — which is the shape F-033's Switch half has to decide on.
   * - `Slider`: gets no `FieldErrorContext` at all, because a slider always
   *   holds an in-range value — a boundary, not a gap.
   */
  const WITHOUT_MESSAGE: Array<
    [scope: string, field: () => React.ReactElement]
  > = [
    [
      'switch',
      () => {
        return <Switch>Notify me</Switch>;
      },
    ],
    [
      'slider',
      () => {
        return <Slider label="Volume" />;
      },
    ],
  ];

  test.each(WITHOUT_MESSAGE)(
    '%s still has none — remove it here when it gains one',
    (scope, field) => {
      render(field());

      expect(part(scope, 'validationMessage')).toBeNull();
    }
  );
});

describe('a required Select behaves like any other field', () => {
  const RequiredRole = ({
    onInvalid,
  }: {
    onInvalid?: React.FormEventHandler<HTMLFormElement>;
  }) => {
    return (
      <Form onInvalid={onInvalid}>
        <Select label="Role" name="role" isRequired>
          <SelectItem id="admin">Admin</SelectItem>
        </Select>
        <FormSubmit>Invite</FormSubmit>
      </Form>
    );
  };

  test('blocks the submit and reports the platform copy in its message part', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn((e: React.FormEvent) => {
      e.preventDefault();
    });

    render(
      <Form onSubmit={onSubmit}>
        <Select label="Role" name="role" isRequired>
          <SelectItem id="admin">Admin</SelectItem>
        </Select>
        <FormSubmit>Invite</FormSubmit>
      </Form>
    );

    await user.click(screen.getByRole('button', { name: 'Invite' }));

    expect(onSubmit).not.toHaveBeenCalled();
    // No `errorMessage` was supplied, so this is the browser's own localized
    // constraint copy — the part exists to carry it (F-009).
    expect(part('select', 'validationMessage')).toHaveTextContent(/\S/);
  });

  test('returns focus to the trigger, not to the element it submits through', async () => {
    const user = userEvent.setup();

    render(<RequiredRole />);

    await user.click(screen.getByRole('button', { name: 'Invite' }));

    // React Aria submits a Select's value through a visually hidden
    // `<select required>` and forwards its focus to the trigger (read in
    // `HiddenSelect.mjs`) — so the person lands on something they can operate.
    expect(part('select', 'trigger')).toHaveFocus();
  });

  test('reports the hidden select as the invalid target — the one field that does', async () => {
    const user = userEvent.setup();
    const targets: Array<string | null> = [];

    render(
      <RequiredRole
        onInvalid={(e) => {
          const target = e.target as HTMLElement;
          targets.push(target.getAttribute('data-part'));
          expect(target.tagName).toBe('SELECT');
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Invite' }));

    // Every other field reports the element carrying `data-part="control"`
    // (pinned in the focus guard). A Select reports the hidden `<select>`, which
    // carries no part — the limit any form-level error summary has to handle,
    // and the reason this is asserted rather than assumed.
    expect(targets).toEqual([null]);
  });
});
