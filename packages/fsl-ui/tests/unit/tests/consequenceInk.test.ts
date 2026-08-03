/**
 * `resolveConsequenceInk` — CONTRACT §3.3, the F-029 rule.
 *
 * The assertions worth having are the **bounds**, not the happy path. The rule
 * only holds because it is scoped: one rung, one axis, one dimension, and a
 * measured set of states it hands back at. Every one of those edges is a place
 * where a well-meaning widening would put unreadable red on a dark fill, so
 * each gets its own case naming why it is closed.
 */
import { vars } from '@ttoss/fsl-theme/vars';
import { EVALUATIONS } from 'src/semantics/taxonomy';
import { resolveConsequenceInk } from 'src/tokens/consequenceInk';

const HOST_INK = 'host-ink';
const DESTRUCTIVE_INK = vars.colors.informational.negative.text!.default!;

const resolve = (
  overrides: Partial<Parameters<typeof resolveConsequenceInk>[0]> = {}
) => {
  return resolveConsequenceInk({
    consequence: 'destructive',
    evaluation: 'muted',
    flags: {},
    ink: HOST_INK,
    ...overrides,
  });
};

describe('resolveConsequenceInk', () => {
  test('tints a quiet destructive part at rest', () => {
    expect(resolve()).toBe(DESTRUCTIVE_INK);
  });

  test('tints it on hover — the quiet rung still barely paints there', () => {
    expect(resolve({ flags: { isHovered: true } })).toBe(DESTRUCTIVE_INK);
  });

  test('holds through focus: the ring floats off the control, the fill is unchanged', () => {
    expect(resolve({ flags: { isFocusVisible: true } })).toBe(DESTRUCTIVE_INK);
  });

  // --- Bound 1: the axis. `consequence`, never `evaluation`. ---

  test.each(['neutral', 'committing'] as const)(
    'leaves a %s consequence alone',
    (consequence) => {
      expect(resolve({ consequence })).toBe(HOST_INK);
    }
  );

  test('leaves an undeclared consequence alone', () => {
    expect(resolve({ consequence: undefined })).toBe(HOST_INK);
  });

  // --- Bound 2: the rung. Only the one that paints no fill. ---

  test.each(
    EVALUATIONS.filter((e) => {
      return e !== 'muted';
    })
  )(
    'leaves the %s rung alone — it paints a fill and the fill is the voice',
    (evaluation) => {
      expect(resolve({ evaluation })).toBe(HOST_INK);
    }
  );

  // --- Bound 3: the states it yields at (TINT_YIELDS_TO). ---

  test('yields when disabled — unavailability outranks valence', () => {
    expect(resolve({ flags: { isDisabled: true } })).toBe(HOST_INK);
  });

  test('yields at the press: the engaged fill measures 2.65:1 against this ink', () => {
    expect(resolve({ flags: { isPressed: true } })).toBe(HOST_INK);
  });

  test('yields while expanded — the same engaged fill, held open', () => {
    expect(resolve({ flags: { isExpanded: true } })).toBe(HOST_INK);
  });

  test('yields on the cascade winner, not on any flag present', () => {
    // `isDisabled` outranks `isHovered`, so this is the disabled state and the
    // tint is gone — reading the flags independently would have kept it.
    expect(resolve({ flags: { isDisabled: true, isHovered: true } })).toBe(
      HOST_INK
    );
  });

  // --- The host's ink is passed through, never invented. ---

  test('returns the host ink unchanged when the rule does not apply', () => {
    expect(resolve({ consequence: 'neutral', ink: undefined })).toBeUndefined();
  });
});
