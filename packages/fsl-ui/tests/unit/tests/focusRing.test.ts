/**
 * Unit tests for `focusRingOutline` — the shared keyboard-focus outline
 * helper (CONTRACT.md §3) consumed by every interactive component. Direct
 * coverage matters because `isFocusVisible` is rarely truthy under jsdom, so
 * the component suites only exercise the falsy branch.
 */
import { vars } from '@ttoss/fsl-theme/vars';
import {
  FOCUS_RING_INSET,
  FOCUS_RING_OFFSET,
  focusRingOutline,
} from 'src/tokens/focusRing';

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

  test("the gap is the theme's, not the component's (F-020)", () => {
    // It shipped as the literal `2px`, which meant no theme could retune the
    // gap while the reference system treats it as a first-class token beside
    // the ring's thickness. Asserting the token — not a pixel value — is the
    // point: a theme that changes it must move the components with it.
    expect(FOCUS_RING_OFFSET).toBe(vars.focus.ring.offset);
    expect(FOCUS_RING_OFFSET).not.toMatch(/^\d/);
  });

  test('the inset is still derived from the ring width, not from the gap', () => {
    // Two different guarantees: the gap is a theme decision, the inset is
    // arithmetic (a ring needs `offset + width` of room, so at `-width` it
    // needs none). Tying the inset to the new token would break that.
    expect(FOCUS_RING_INSET).toContain(vars.focus.ring.width);
    expect(FOCUS_RING_INSET).not.toContain(vars.focus.ring.offset);
  });
});
