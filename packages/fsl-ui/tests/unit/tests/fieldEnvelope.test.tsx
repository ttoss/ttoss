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
 * it is excluded. (`Switch.mjs` is on the axis through the `SwitchField` root it
 * ships beside the deprecated plain `Switch`; forms item E moved our component
 * onto that root, which is what moved it from group 3 to group 1.)
 */
import fs from 'node:fs';
import path from 'node:path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vars } from '@ttoss/fsl-theme/vars';
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
      'SearchField', // group 1 (and group 2, which keeps the slot form)
      'Select', // group 1
      'Switch', // group 1 — via RAC's SwitchField root (forms item E)
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
  [
    // Joined group 1 in forms item D. It was in group 2 below — "on the axis,
    // but only its label is in the envelope" — because props rendered nothing
    // but the root. That comment warned the claim would silently stop being
    // true; moving the entry is what keeps it from doing so.
    'search-field',
    () => {
      return (
        <SearchField {...COPY} clearLabel="Clear search" isRequired isInvalid />
      );
    },
  ],
  [
    // Joined group 1 in forms item E, rebuilt on RAC's `SwitchField` +
    // `SwitchButton` (plain `Switch` is deprecated upstream). Its label is
    // its children rather than a `label` prop — the row IS the label — so
    // the entry adapts the copy; everything else is the shared envelope.
    'switch',
    () => {
      return (
        <Switch
          description={COPY.description}
          errorMessage={COPY.errorMessage}
          isRequired
          isInvalid
        >
          {COPY.label}
        </Switch>
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
 * Group 2 — the slot form, which every member keeps once it has the prop form.
 *
 * This group used to exist because `SearchField` had **no one-line form at all**:
 * the authoring union item A gave `TextField`/`TextArea` stopped there, so props
 * rendered nothing but the root. Item D closed that, and `SearchField` is in
 * group 1 above now.
 *
 * What is left here is worth keeping rather than deleting: the composed form has
 * a mechanism the one-line form does not, and it is the reason the composite
 * carries a scope at all. A slot label cannot read the root's `isRequired` prop —
 * React Aria tells a label nothing about its field — so the flag travels through
 * the composite scope, taken from the root's render props. Group 1's assertion
 * passes through a different path and would not catch that one breaking.
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
 * `Slider` below has no message part at all, for a mechanism rather than a
 * preference.
 */
describe('the members that deliberately have no message part', () => {
  /**
   * - `Slider`: does not appear in the axis grep at all — it gets no
   *   `FieldErrorContext`, because a slider always holds an in-range value: a
   *   boundary, not a gap.
   *
   * `Switch` stood here until forms item E, excluded because plain
   * `SwitchProps` omits validation outright. RAC 1.19 deprecates that root and
   * ships `SwitchField`, which owns the validation props and supplies both
   * contexts — so the component moved onto it and into group 1, exactly the
   * removal this table's test name asks for.
   */
  const WITHOUT_MESSAGE: Array<
    [scope: string, field: () => React.ReactElement]
  > = [
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

/**
 * The validation language — which role each part of an invalid field reads.
 *
 * FSL Lexicon §10.15 splits one thing that looks like two: a control becomes
 * `invalid` from the user's data, so it keeps its authored role and flips that
 * role's `invalid` State; the *adjacent display part reporting the outcome* is
 * what lawfully carries `negative` valence. Both halves are asserted here
 * because the family shipped with only the first, and the second silently
 * resolved the control's readable-value ink — which made a failed field's
 * message byte-identical to the label above it.
 */
describe('an invalid field speaks valence on the message, not on the value', () => {
  test.each(ROOTS)('%s reads the negative role on its message', (scope) => {
    render(
      ROOTS.find(([name]) => {
        return name === scope;
      })![1]()
    );

    const message = part(scope, 'validationMessage');

    // The role, not the control's `invalid` State: the message is negative
    // about a `primary`, `secondary` or `muted` field alike, so it cannot be
    // derived from the colours the control was given.
    //
    // Token identity is the whole assertion available here, and deliberately so.
    // The defect being closed was that the message and the label *resolved* to
    // the same colour — `rgb(22,22,22)` in light, `rgb(255,255,255)` in dark,
    // measured on the `Invalid` story at 1280px — but jsdom computes no custom
    // properties, so both are `var(…)` strings that differ by name whether or
    // not they differ by value. A test comparing the two would have passed with
    // the defect present; it was written, seen to pass under injection, and
    // deleted. The resolved-colour half belongs to the browser check.
    expect(message?.style.color).toBe(vars.colors.input.negative.text?.default);
  });

  test('the value itself stays readable rather than turning red', () => {
    render(<TextField {...COPY} isInvalid />);

    // The other half of §10.15, and deliberate in the theme: the control's
    // `invalid` ink is its normal reading ink, because a value the user must
    // re-read is not the place to spend the signal.
    expect(part('text-field', 'control')?.style.color).toBe(
      vars.colors.input.primary.text?.invalid
    );
  });
});

/**
 * Hover while invalid — the owner's ruling, made executable.
 *
 * Ruled 2026-07-29: **hover does not apply while invalid.** The cascade already
 * ordered `isInvalid` above `isHovered`, so this passed the day it was written;
 * it is here because nothing failed if that ordering moved, and the ruling is
 * now a product decision rather than an implementation detail. `STATE_PRIORITY`
 * is the mechanism, and `resolveInteractiveStyle.test.ts` guards the order in
 * isolation — this guards it through a real field, which is where a call site
 * that forgets to pass `isInvalid` would otherwise let hover win.
 */
describe('hover does not apply while invalid', () => {
  test('an invalid field keeps its invalid border and fill under the pointer', async () => {
    const user = userEvent.setup();
    render(<TextField {...COPY} isInvalid />);

    const control = part('text-field', 'control')!;
    await user.hover(control);

    expect(control.style.borderColor).toBe(
      vars.colors.input.primary.border?.invalid
    );
    expect(control.style.backgroundColor).toBe(
      vars.colors.input.primary.background?.invalid
    );
  });

  test('the same field does respond to the pointer while valid', async () => {
    const user = userEvent.setup();
    render(<TextField {...COPY} />);

    const control = part('text-field', 'control')!;
    await user.hover(control);

    // The counterpart that makes the assertion above mean something: without
    // it, a field that never reacted to hover at all would pass too.
    expect(control.style.backgroundColor).toBe(
      vars.colors.input.primary.background?.hover
    );
  });
});
