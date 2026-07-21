/**
 * Unit tests for `focusRingOutline` — the shared keyboard-focus outline
 * helper (CONTRACT.md §3) consumed by every interactive component. Direct
 * coverage matters because `isFocusVisible` is rarely truthy under jsdom, so
 * the component suites only exercise the falsy branch.
 */
import { vars } from '@ttoss/fsl-theme/vars';
import { focusRingOutline } from 'src/tokens/focusRing';

describe('focusRingOutline', () => {
  test('returns the composed ring from focus tokens when focus is visible', () => {
    expect(focusRingOutline(true)).toBe(
      `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
    );
  });

  test('returns "none" when focus is not visible', () => {
    expect(focusRingOutline(false)).toBe('none');
  });

  test('treats undefined (flag omitted) as not focused', () => {
    expect(focusRingOutline(undefined)).toBe('none');
  });

  test('the ring is applied via outline (never border) — no layout shift', () => {
    // The value is a full `outline` shorthand, not a border/width token.
    expect(focusRingOutline(true)).toContain(vars.focus.ring.color);
    expect(focusRingOutline(true)).not.toContain('border');
  });
});
