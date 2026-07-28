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
 * assertions here are driven by tables, and the axis is reproducible rather than
 * remembered. Run it to regenerate the membership:
 *
 * ```sh
 * cd node_modules/react-aria-components/dist/private
 * grep -l TextContext *.mjs | xargs grep -l FieldErrorContext
 * ```
 *
 * In `react-aria-components@1.19.0` that returns eleven roots. Eight of them are
 * ours (`Checkbox.mjs` covers `CheckboxGroup` too, `TextField.mjs` covers our
 * `TextArea`); `ColorField`, `DateField` and `DatePicker` we do not ship — the
 * last is deferred with a readmission criterion in `INTERNAL/FORMS.md` §5.
 *
 * Every one of those eight is accounted for below, in one of three groups, and
 * the point of splitting them is that the reason a member is not in the first
 * group is a *mechanism* and not a preference. `Slider` appears too, in the
 * exception group, although the grep does not return it — which is precisely why
 * it is excluded.
 */
import fs from 'node:fs';
import path from 'node:path';

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

/**
 * The axis, executed rather than remembered.
 *
 * A field root can only host the envelope if React Aria supplies the contexts the
 * parts consume, so membership is a fact about the dependency and not a list we
 * maintain. Reading it here means an upstream change — a context added to
 * `Switch`, a new field root — fails this test and forces the tables below to
 * account for it, instead of the tables quietly describing an older version.
 */
const axisMembers = (): string[] => {
  const dist = path.join(
    path.dirname(require.resolve('react-aria-components/package.json')),
    'dist',
    'private'
  );

  return fs
    .readdirSync(dist)
    .filter((file) => {
      if (!file.endsWith('.mjs')) return false;
      const source = fs.readFileSync(path.join(dist, file), 'utf8');
      return (
        source.includes('TextContext') && source.includes('FieldErrorContext')
      );
    })
    .map((file) => {
      return file.replace(/\.mjs$/, '');
    })
    .sort();
};

describe('the axis this file is driven by', () => {
  test('is exactly the React Aria roots that supply both field contexts', () => {
    // Change this list only together with the tables below. Each name is either
    // covered by a group here or is a root we do not ship — and the ones we do
    // not ship are named, because "we do not ship it" is the reason it is absent.
    expect(axisMembers()).toEqual([
      'Checkbox', // + CheckboxGroup — group 1 and group 3
      'ColorField', // not shipped
      'ComboBox', // group 1
      'DateField', // not shipped
      'DatePicker', // not shipped — FORMS.md §5, with a readmission criterion
      'NumberField', // group 1
      'RadioGroup', // group 1
      'SearchField', // group 2 — label only, no one-line form until item D
      'Select', // group 1
      'Switch', // group 3 — no validation props at all
      'TextField', // + our TextArea — group 1
    ]);
  });
});

const COPY = {
  label: 'Role',
  description: 'Helper copy.',
  errorMessage: 'Pick one.',
} as const;

/**
 * Group 1 — the axis members that carry the whole envelope, authored in their
 * one-line form. `isInvalid` is set so the message part is not merely mounted but
 * rendered: React Aria's `FieldError` returns null while the field is valid.
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

/**
 * Group 2 — on the axis, but only its label is in the envelope.
 *
 * `SearchField` has **no one-line form**: the authoring union item A gave
 * `TextField`/`TextArea` stops there, so props render nothing but the root and
 * the envelope reaches only the slot label. Closing that is item D, where the
 * adornment anatomy lands. Asserted rather than assumed, because "it has no
 * one-line form" is the kind of claim that silently stops being true.
 */
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

/**
 * Group 3 — on the axis, and deliberately without the envelope.
 *
 * `Checkbox` is the third axis member and the one that cannot use these parts at
 * all: its root **is** a `<label>`, so copy placed inside it gets absorbed into
 * the accessible name — measured in A2 as `"Accept termsYou agree to the
 * terms."`, with a name query for the label alone no longer matching. It renders
 * its envelope inline instead, with the name pinned via `aria-labelledby`, and it
 * has its own guard (`checkboxEnvelope.test.tsx`). It shares what it can: the
 * text-part style source and the necessity marker. Named here so the axis has no
 * silent member.
 *
 * The two below have no message part at all, each for a mechanism rather than a
 * preference. Both are item `E` in `INTERNAL/FORMS.md`.
 */
describe('the members that deliberately have no message part', () => {
  /**
   * - `Switch`: React Aria's `SwitchProps` **omits** `isRequired`, `isInvalid`,
   *   `validate` and `validationBehavior` outright (read in `Switch.d.ts`), so
   *   there is no validation state to render — a `Switch` cannot be invalid.
   *   `SwitchRenderProps` does expose `isRequired`, and RAC 1.19 ships a separate
   *   `SwitchField` root that owns it, which is the shape F-033's Switch half has
   *   to decide on.
   * - `Slider`: does not appear in the axis grep at all — it gets no
   *   `FieldErrorContext`, because a slider always holds an in-range value: a
   *   boundary, not a gap.
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
