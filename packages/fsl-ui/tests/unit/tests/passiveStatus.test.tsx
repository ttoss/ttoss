/**
 * `src/tokens/passiveStatus.ts` — the module's own contract (ADR-043).
 *
 * Tested directly rather than only through `InlineAlert`, for the reason
 * F-056 gave when it extracted `disclosureAnatomy.ts`: a shared source's
 * guarantees are the module's, and a component test only ever exercises the
 * path that component happens to take. `resolveValenceInk`'s bounds are the
 * interesting half, and every edge here has a case naming why it is closed —
 * the shape `consequenceInk`'s bounds suite established.
 */
import { vars } from '@ttoss/fsl-theme/vars';
import { ICON_INTENTS } from 'src/index';
import { resolveValenceInk, VALENCE_GLYPH } from 'src/tokens/passiveStatus';

const GROUND_INK = '#groundInk';

describe('VALENCE_GLYPH', () => {
  test('every intent it names is in the registry', () => {
    // The registry "grows slowly and shrinks never" (icon-system.md). A map
    // naming an unregistered intent would fail at render, in the browser only.
    for (const intent of Object.values(VALENCE_GLYPH)) {
      if (intent === undefined) continue;
      expect(ICON_INTENTS).toContain(intent);
    }
  });

  test('primary is glyph-less — it claims no outcome', () => {
    expect(VALENCE_GLYPH.primary).toBeUndefined();
  });

  test('every other evaluation carries a glyph', () => {
    for (const evaluation of [
      'accent',
      'positive',
      'caution',
      'negative',
    ] as const) {
      expect(VALENCE_GLYPH[evaluation]).toBeDefined();
    }
  });

  test('caution and negative share the triangle, by decision', () => {
    // Not an oversight: 1.4.1 asks that colour not be the *sole* carrier, which
    // the shared triangle plus the caller's copy satisfies, and splitting two
    // attention levels has no consumer yet. Asserted so that splitting them is
    // a deliberate edit to this line rather than a silent drift.
    expect(VALENCE_GLYPH.caution).toBe(VALENCE_GLYPH.negative);
  });

  test('the three claims that must never collapse stay distinct', () => {
    // On a neutral ground the glyph's SHAPE is the primary carrier, so success,
    // information and alarm must be three pictures. `status.success` ≠
    // `status.alert` is also the icon-system opposition rule.
    const distinct = new Set([
      VALENCE_GLYPH.positive,
      VALENCE_GLYPH.accent,
      VALENCE_GLYPH.negative,
    ]);
    expect(distinct.size).toBe(3);
  });
});

describe('resolveValenceInk — the valence rungs take their own ink', () => {
  test.each(['positive', 'caution', 'negative'] as const)(
    '%s resolves the cross-cutting valence ink',
    (evaluation) => {
      expect(resolveValenceInk({ evaluation, groundInk: GROUND_INK })).toBe(
        vars.valence[evaluation].ink
      );
    }
  );

  test('it reads the cross-cutting family, not a `{ux}` valence text', () => {
    // The point of the address: `feedback.negative.text` is the label ON the
    // filled red (near-white) — occupied, not missing (fsl-theme ADR-029). A
    // mark reading it on a neutral ground would be invisible.
    expect(
      resolveValenceInk({ evaluation: 'negative', groundInk: GROUND_INK })
    ).not.toBe(vars.colors.feedback.negative.text?.default);
  });
});

describe('resolveValenceInk — the bounds', () => {
  test.each(['primary', 'accent'] as const)(
    '%s yields to the ground ink — emphasis carries no outcome',
    (evaluation) => {
      // `colors.md` § Role Coverage: `role` is a discriminated union, and these
      // two are the Emphasis class. There is no outcome for a valence ink to
      // state. `accent` is the live case — fsl-theme ADR-029 records that
      // fsl-ui's taxonomy comment calls it "the informative valence" while the
      // family doc classes it Emphasis, and model.md §11 gives the family doc
      // precedence. If that is ever settled the other way, this is the one
      // function that changes.
      expect(resolveValenceInk({ evaluation, groundInk: GROUND_INK })).toBe(
        GROUND_INK
      );
    }
  );

  test('an absent ground ink is passed through, not defaulted', () => {
    // The module never invents a colour: a caller with no ground ink has a
    // defect in its own token reads, and masking it here would hide it.
    expect(
      resolveValenceInk({ evaluation: 'primary', groundInk: undefined })
    ).toBeUndefined();
  });

  test('the ground ink is a parameter, so the module names no `{ux}`', () => {
    // The component owns its colour family; this module embodies no entity and
    // must not reach into `feedback.*` to find a fallback. Two different grounds
    // therefore get two different answers from the same call.
    expect(resolveValenceInk({ evaluation: 'accent', groundInk: '#aaa' })).toBe(
      '#aaa'
    );
    expect(resolveValenceInk({ evaluation: 'accent', groundInk: '#bbb' })).toBe(
      '#bbb'
    );
  });
});
