/**
 * Unit tests for `resolveInteractiveStyle` — the shared state cascade helper
 * consumed by Button, Link, Checkbox, Switch, RadioGroup, and Select.
 */
import { resolveInteractiveStyle } from 'src/tokens/resolveInteractiveStyle';

const states = {
  default: 'd',
  hover: 'h',
  active: 'a',
  disabled: 'x',
  focused: 'f',
  checked: 'c',
  indeterminate: 'i',
  invalid: 'v',
  expanded: 'e',
} as const;

describe('resolveInteractiveStyle', () => {
  test('returns default when no flags are set', () => {
    expect(resolveInteractiveStyle(states, {})).toBe('d');
  });

  test('returns hover when only isHovered is set', () => {
    expect(resolveInteractiveStyle(states, { isHovered: true })).toBe('h');
  });

  test('pressed wins over hovered', () => {
    expect(
      resolveInteractiveStyle(states, { isHovered: true, isPressed: true })
    ).toBe('a');
  });

  test('focused wins over pressed and hovered', () => {
    expect(
      resolveInteractiveStyle(states, {
        isHovered: true,
        isPressed: true,
        isFocusVisible: true,
      })
    ).toBe('f');
  });

  test('disabled has the highest priority', () => {
    expect(
      resolveInteractiveStyle(states, {
        isHovered: true,
        isPressed: true,
        isFocusVisible: true,
        isDisabled: true,
      })
    ).toBe('x');
  });

  test('is strict: returns undefined when the prioritized state is missing', () => {
    // No `focused` key — mimics `action.primary.background` in the base theme.
    const noFocused = { default: 'd', hover: 'h', active: 'a', disabled: 'x' };
    expect(
      resolveInteractiveStyle(noFocused, { isFocusVisible: true })
    ).toBeUndefined();
  });

  test('callers omit flags to skip a level entirely', () => {
    // Button background pattern: isFocusVisible dropped so bg doesn't
    // collapse to the undefined `focused` key.
    const bg = { default: 'd', hover: 'h', active: 'a', disabled: 'x' };
    expect(
      resolveInteractiveStyle(bg, { isHovered: true, isPressed: true })
    ).toBe('a');
  });

  test('returns undefined for an undefined states object', () => {
    expect(
      resolveInteractiveStyle(undefined, { isHovered: true })
    ).toBeUndefined();
  });

  // --- Selection entity flags (isSelected → checked, isIndeterminate → indeterminate) ---

  test('isSelected returns checked state', () => {
    expect(resolveInteractiveStyle(states, { isSelected: true })).toBe('c');
  });

  test('isIndeterminate returns indeterminate state', () => {
    expect(resolveInteractiveStyle(states, { isIndeterminate: true })).toBe(
      'i'
    );
  });

  test('isIndeterminate wins over isSelected', () => {
    expect(
      resolveInteractiveStyle(states, {
        isSelected: true,
        isIndeterminate: true,
      })
    ).toBe('i');
  });

  test('disabled wins over isIndeterminate and isSelected', () => {
    expect(
      resolveInteractiveStyle(states, {
        isDisabled: true,
        isIndeterminate: true,
        isSelected: true,
      })
    ).toBe('x');
  });

  test('isSelected wins over focusVisible, pressed, hovered', () => {
    expect(
      resolveInteractiveStyle(states, {
        isSelected: true,
        isFocusVisible: true,
        isPressed: true,
        isHovered: true,
      })
    ).toBe('c');
  });

  // --- Validation State (isInvalid → invalid) ---
  // FSL §7 + §10.5 parallel: `invalid` is a runtime State (not an authorial
  // Evaluation). It sits below `disabled` because a disabled control cannot
  // surface validation feedback to the user.

  test('isInvalid returns invalid state', () => {
    expect(resolveInteractiveStyle(states, { isInvalid: true })).toBe('v');
  });

  test('disabled wins over isInvalid', () => {
    expect(
      resolveInteractiveStyle(states, { isDisabled: true, isInvalid: true })
    ).toBe('x');
  });

  test('isInvalid wins over isIndeterminate, isSelected, focusVisible, pressed, hovered', () => {
    expect(
      resolveInteractiveStyle(states, {
        isInvalid: true,
        isIndeterminate: true,
        isSelected: true,
        isFocusVisible: true,
        isPressed: true,
        isHovered: true,
      })
    ).toBe('v');
  });

  // --- Disclosure State (isExpanded → expanded) ---
  // FSL §7: `expanded` is a runtime State for the Disclosure entity, surfaced
  // by `disclose.toggle`. It sits above the selection states and below
  // `disabled`/`isInvalid` so a disabled or invalid disclosure cannot be
  // visually reported as expanded chrome.

  test('isExpanded returns expanded state', () => {
    expect(resolveInteractiveStyle(states, { isExpanded: true })).toBe('e');
  });

  test('disabled wins over isExpanded', () => {
    expect(
      resolveInteractiveStyle(states, { isDisabled: true, isExpanded: true })
    ).toBe('x');
  });

  test('isInvalid wins over isExpanded', () => {
    expect(
      resolveInteractiveStyle(states, { isInvalid: true, isExpanded: true })
    ).toBe('v');
  });

  test('isExpanded wins over isIndeterminate, isSelected, focusVisible, pressed, hovered', () => {
    expect(
      resolveInteractiveStyle(states, {
        isExpanded: true,
        isIndeterminate: true,
        isSelected: true,
        isFocusVisible: true,
        isPressed: true,
        isHovered: true,
      })
    ).toBe('e');
  });
});
