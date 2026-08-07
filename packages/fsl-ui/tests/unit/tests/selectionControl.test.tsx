/**
 * The selection-mark cascade and label ink (E2 consolidation, C-06/C-07) —
 * pinned from both sides, like `rail.test.tsx`: the shared source resolves
 * the documented order, and the components paint what it resolves.
 *
 * Three files each carried the same state cascade and the same label-ink
 * precedence, agreeing only by discipline. Now `selectionControl` states each
 * once; these tests pin the two rulings a refactor could silently reverse:
 * the ink's invalid-beats-disabled order (the *inverse* of the canonical
 * `STATE_PRIORITY` cascade), and the mark's background/border split (the fill
 * never reacts to focus, the edge never reacts to hover/press).
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import { Checkbox, Radio, RadioGroup, Switch } from 'src/index';
import { focusRingOutline } from 'src/tokens/focusRing';
import {
  buildSelectionMarkStyle,
  buildSelectionOptionRowStyle,
  resolveSelectionLabelInk,
  type SelectionColors,
  type SelectionMarkFlags,
} from 'src/tokens/selectionControl';

// Distinct sentinel per state, so an assertion names the state the cascade
// landed on instead of comparing two colours that may coincide in a theme.
const STATES = {
  default: 'DEFAULT',
  hover: 'HOVER',
  active: 'ACTIVE',
  disabled: 'DISABLED',
  focused: 'FOCUSED',
  checked: 'CHECKED',
  indeterminate: 'INDETERMINATE',
  invalid: 'INVALID',
};

const FAKE: SelectionColors = {
  background: { ...STATES },
  border: { ...STATES },
};

const markOf = (
  flags: SelectionMarkFlags,
  selectedBorderWidth?: string
): React.CSSProperties => {
  return buildSelectionMarkStyle({
    base: {},
    colors: FAKE,
    flags,
    selectedBorderWidth,
  });
};

const partOf = (scope: string, part: string): HTMLElement => {
  const el = document.querySelector<HTMLElement>(
    `[data-scope="${scope}"][data-part="${part}"]`
  );
  if (!el) {
    throw new Error(`no ${part} rendered for ${scope}`);
  }
  return el;
};

describe('the mark cascade resolves the documented order', () => {
  test('background: disabled ▸ invalid ▸ indeterminate ▸ checked ▸ active ▸ hover ▸ default', () => {
    const all = {
      isDisabled: true,
      isInvalid: true,
      isIndeterminate: true,
      isSelected: true,
      isPressed: true,
      isHovered: true,
    };

    expect(markOf(all).backgroundColor).toBe('DISABLED');
    expect(markOf({ ...all, isDisabled: false }).backgroundColor).toBe(
      'INVALID'
    );
    expect(
      markOf({ ...all, isDisabled: false, isInvalid: false }).backgroundColor
    ).toBe('INDETERMINATE');
    expect(
      markOf({ isSelected: true, isPressed: true, isHovered: true })
        .backgroundColor
    ).toBe('CHECKED');
    expect(markOf({ isPressed: true, isHovered: true }).backgroundColor).toBe(
      'ACTIVE'
    );
    expect(markOf({ isHovered: true }).backgroundColor).toBe('HOVER');
    expect(markOf({}).backgroundColor).toBe('DEFAULT');
  });

  // The split is the ruling, not an omission: the ring carries focus, so a
  // focused fill would fight it; a border with a focus colour must not also
  // react to hover/press. "Completing" either cascade changes rendered state.
  test('focus never reaches the fill; hover/press never reach the edge', () => {
    const style = markOf({
      isFocusVisible: true,
      isPressed: true,
      isHovered: true,
    });

    expect(style.backgroundColor).toBe('ACTIVE');
    expect(style.borderColor).toBe('FOCUSED');
    expect(style.outline).toBe(focusRingOutline(true));
    expect(markOf({}).outline).toBe(focusRingOutline(undefined));
  });

  test('the border widens only for a mark that asks for it', () => {
    const selected = vars.border.outline.selected.width;

    expect(markOf({ isSelected: true }, selected).borderWidth).toBe(selected);
    expect(markOf({ isIndeterminate: true }, selected).borderWidth).toBe(
      selected
    );
    expect(markOf({}, selected).borderWidth).toBe(
      vars.border.outline.control.width
    );
    // No `selectedBorderWidth`: whatever the base declares stands — the
    // track's shape, whose border never moves.
    expect(
      buildSelectionMarkStyle({
        base: { borderWidth: '1px' },
        colors: FAKE,
        flags: { isSelected: true },
      }).borderWidth
    ).toBe('1px');
  });

  test('all three marks paint the shared resolution when checked', () => {
    render(
      <>
        <Checkbox defaultSelected>Accept</Checkbox>
        <RadioGroup label="Size" defaultValue="a">
          <Radio value="a">A</Radio>
        </RadioGroup>
        <Switch defaultSelected>Enable</Switch>
      </>
    );

    const checkedFill = vars.colors.input.primary.background?.checked;
    expect(partOf('checkbox', 'selectionControl').style.backgroundColor).toBe(
      checkedFill
    );
    expect(partOf('radio', 'selectionControl').style.backgroundColor).toBe(
      checkedFill
    );
    expect(partOf('switch', 'control').style.backgroundColor).toBe(checkedFill);

    // The boxed marks thicken their border when checked; the track does not.
    expect(partOf('checkbox', 'selectionControl').style.borderWidth).toBe(
      vars.border.outline.selected.width
    );
    expect(partOf('radio', 'selectionControl').style.borderWidth).toBe(
      vars.border.outline.selected.width
    );
    expect(partOf('switch', 'control').style.borderWidth).toBe(
      vars.border.outline.control.width
    );
  });
});

describe('the label ink inverts the canonical cascade: invalid beats disabled beats default', () => {
  const INK = { default: 'DEFAULT', disabled: 'DISABLED', invalid: 'INVALID' };

  test('precedence at the source', () => {
    expect(
      resolveSelectionLabelInk({ text: INK, isInvalid: true, isDisabled: true })
    ).toBe('INVALID');
    expect(resolveSelectionLabelInk({ text: INK, isDisabled: true })).toBe(
      'DISABLED'
    );
    expect(resolveSelectionLabelInk({ text: INK })).toBe('DEFAULT');
  });

  test('a theme may omit the ink dimension — degrade to undefined, never throw', () => {
    expect(
      resolveSelectionLabelInk({ text: undefined, isInvalid: true })
    ).toBeUndefined();
    expect(
      resolveSelectionLabelInk({ text: undefined, isDisabled: true })
    ).toBeUndefined();
    expect(resolveSelectionLabelInk({ text: undefined })).toBeUndefined();
  });

  test('every label paints invalid ink even while disabled (rendered)', () => {
    render(
      <>
        <Checkbox isDisabled isInvalid>
          Accept
        </Checkbox>
        <RadioGroup label="Size" isInvalid defaultValue="a">
          <Radio value="a" isDisabled>
            A
          </Radio>
        </RadioGroup>
        <Switch isDisabled isInvalid>
          Enable
        </Switch>
      </>
    );

    const invalidInk = vars.colors.input.primary.text?.invalid;
    expect(partOf('checkbox', 'label').style.color).toBe(invalidInk);
    expect(partOf('radio', 'label').style.color).toBe(invalidInk);
    expect(partOf('switch', 'label').style.color).toBe(invalidInk);
  });
});

describe('the option row is one silhouette across its hosts', () => {
  test('disabled dims and re-cursors the whole row', () => {
    const resting = buildSelectionOptionRowStyle({});
    expect(resting.cursor).toBe('pointer');
    expect(resting.opacity).toBeUndefined();

    const disabled = buildSelectionOptionRowStyle({ isDisabled: true });
    expect(disabled.cursor).toBe('not-allowed');
    expect(disabled.opacity).toBe(vars.opacity.disabled);
  });

  test('supportGrid is the two-column variant; the plain row stays inline-flex', () => {
    const grid = buildSelectionOptionRowStyle({ supportGrid: true });
    expect(grid.display).toBe('grid');
    expect(grid.gridTemplateColumns).toBe('auto 1fr');
    expect(grid.alignItems).toBe('start');

    const row = buildSelectionOptionRowStyle({});
    expect(row.display).toBe('inline-flex');
    expect(row.gridTemplateColumns).toBeUndefined();
    expect(row.alignItems).toBe('center');
  });

  test('all three hosts render the shared row (rendered)', () => {
    render(
      <>
        <Checkbox>Accept</Checkbox>
        <RadioGroup label="Size" defaultValue="a">
          <Radio value="a">A</Radio>
        </RadioGroup>
        <Switch>Enable</Switch>
      </>
    );

    for (const row of [
      partOf('checkbox', 'root'),
      partOf('radio', 'root'),
      partOf('switch', 'button'),
    ]) {
      expect(row.style.minHeight).toBe(vars.sizing.hit);
      expect(row.style.gap).toBe(vars.spacing.gap.inline.sm);
      expect(row.style.cursor).toBe('pointer');
    }
  });
});
