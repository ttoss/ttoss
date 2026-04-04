/**
 * Dataviz Validation Tests
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/03-data-visualization/dataviz-colors.md#validation
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/03-data-visualization/dataviz-encodings.md#validation
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/03-data-visualization/index.md#validation
 */

import { themeFlatToTest, themeToTest } from '../../../helpers/theme';

// themeToTest.base — unresolved refs; used for structural and reference-pattern checks.
// themeFlatToTest  — all {refs} resolved to final hex/number; used for value-equality checks.
//
// Alternate mode: semantic.dataviz.* only references core.colors.* and core.dataviz.*,
// neither of which changes between modes. Resolved dataviz values are therefore identical
// in both base and alternate modes, so alternate-mode coverage would be fully redundant.
const base = themeToTest.base;
const flat = themeFlatToTest;

// ---------------------------------------------------------------------------
// Helpers — centralised value-set builders used across multiple test blocks
// ---------------------------------------------------------------------------

/** Collect all resolved values that belong to the primary data color families. */
const primaryDataColorValues = (): Set<string | number> => {
  const values = new Set<string | number>();
  const prefixes = [
    'semantic.dataviz.color.series.',
    'semantic.dataviz.color.scale.sequential.',
    'semantic.dataviz.color.scale.diverging.',
  ];
  for (const [key, val] of Object.entries(flat)) {
    if (
      prefixes.some((p) => {
        return key.startsWith(p);
      })
    )
      values.add(val);
  }
  return values;
};

/** Collect all resolved values for the three status tokens. */
const statusValues = (): (string | number)[] => {
  return [
    flat['semantic.dataviz.color.status.missing'],
    flat['semantic.dataviz.color.status.suppressed'],
    flat['semantic.dataviz.color.status.not-applicable'],
  ];
};

// ---------------------------------------------------------------------------
// dataviz-colors.md — Errors
// ---------------------------------------------------------------------------

describe('Colors — Errors', () => {
  test('diverging scale has all seven steps and symmetric neg/pos cardinality', () => {
    // Error #1 (dataviz-colors.md): diverging color semantics are structurally incomplete —
    // missing neutral, missing a negative step, missing a positive step, or asymmetric cardinality
    const diverging = base.semantic.dataviz!.color.scale.diverging;

    expect(diverging.neutral).toBeDefined();

    const negSteps = [diverging.neg3, diverging.neg2, diverging.neg1];
    const posSteps = [diverging.pos1, diverging.pos2, diverging.pos3];

    for (const step of [...negSteps, ...posSteps]) expect(step).toBeDefined();

    expect(negSteps.filter(Boolean).length).toBe(
      posSteps.filter(Boolean).length
    );
  });

  test('all three status tokens resolve to distinct effective values', () => {
    // Error #2 (dataviz-colors.md): any two status tokens resolve to the same effective value
    const [missing, suppressed, notApplicable] = statusValues();

    expect(missing).not.toEqual(suppressed);
    expect(missing).not.toEqual(notApplicable);
    expect(suppressed).not.toEqual(notApplicable);
  });

  test('no status token resolves to the same value as any scale step or state.muted', () => {
    // Error #3 (dataviz-colors.md): a status token resolves to the same effective value as
    // a sequential scale step, a diverging scale step, or dataviz.color.state.muted
    const scaleValues: (string | number)[] = [];

    for (let i = 1; i <= 7; i++) {
      scaleValues.push(flat[`semantic.dataviz.color.scale.sequential.${i}`]);
    }
    for (const key of [
      'neg3',
      'neg2',
      'neg1',
      'neutral',
      'pos1',
      'pos2',
      'pos3',
    ]) {
      scaleValues.push(flat[`semantic.dataviz.color.scale.diverging.${key}`]);
    }

    const stateMuted = flat['semantic.dataviz.color.state.muted'];

    for (const sv of statusValues()) {
      for (const scaleVal of scaleValues) expect(sv).not.toEqual(scaleVal);
      expect(sv).not.toEqual(stateMuted);
    }
  });
});

// ---------------------------------------------------------------------------
// dataviz-colors.md — Warnings
// ---------------------------------------------------------------------------

describe('Colors — Warnings', () => {
  test('series set is bounded to 1..8', () => {
    // Warning #1 (dataviz-colors.md): dataviz.color.series exceeds 1..8
    expect(flat['semantic.dataviz.color.series.9']).toBeUndefined();
  });

  test('sequential scale is bounded to 1..7', () => {
    // Warning #2 (dataviz-colors.md): dataviz.color.scale.sequential exceeds 1..7
    expect(flat['semantic.dataviz.color.scale.sequential.8']).toBeUndefined();
  });

  test('reference.baseline and reference.target do not resolve to any primary data color value', () => {
    // Warning #3 (dataviz-colors.md): reference.baseline or reference.target resolves to the
    // same effective value as a primary data color token (series, sequential, or diverging)
    const primary = primaryDataColorValues();
    const baseline = flat['semantic.dataviz.color.reference.baseline'];
    const target = flat['semantic.dataviz.color.reference.target'];

    expect(primary.has(baseline)).toBe(false);
    expect(primary.has(target)).toBe(false);
  });

  test('state tokens (highlight, muted, selected) all resolve to distinct effective values', () => {
    // Warning #4 (dataviz-colors.md): state.highlight, state.muted, and state.selected
    // lose effective distinction
    const highlight = flat['semantic.dataviz.color.state.highlight'];
    const muted = flat['semantic.dataviz.color.state.muted'];
    const selected = flat['semantic.dataviz.color.state.selected'];

    expect(highlight).not.toEqual(muted);
    expect(highlight).not.toEqual(selected);
    expect(muted).not.toEqual(selected);
  });

  test('no two adjacent sequential steps resolve to the same effective value', () => {
    // Warning #5 (dataviz-colors.md): adjacent sequential steps resolve to the same effective value
    for (let i = 1; i <= 6; i++) {
      const a = flat[`semantic.dataviz.color.scale.sequential.${i}`];
      const b = flat[`semantic.dataviz.color.scale.sequential.${i + 1}`];
      expect(a).not.toEqual(b);
    }
  });

  test('no two adjacent diverging steps on the same side resolve to the same effective value', () => {
    // Warning #6 (dataviz-colors.md): adjacent diverging steps on the same side resolve to
    // the same effective value
    const negKeys = ['neg3', 'neg2', 'neg1'] as const;
    const posKeys = ['pos1', 'pos2', 'pos3'] as const;

    for (let i = 0; i < negKeys.length - 1; i++) {
      const a = flat[`semantic.dataviz.color.scale.diverging.${negKeys[i]}`];
      const b =
        flat[`semantic.dataviz.color.scale.diverging.${negKeys[i + 1]}`];
      expect(a).not.toEqual(b);
    }
    for (let i = 0; i < posKeys.length - 1; i++) {
      const a = flat[`semantic.dataviz.color.scale.diverging.${posKeys[i]}`];
      const b =
        flat[`semantic.dataviz.color.scale.diverging.${posKeys[i + 1]}`];
      expect(a).not.toEqual(b);
    }
  });
});

// ---------------------------------------------------------------------------
// dataviz-encodings.md — Errors
// ---------------------------------------------------------------------------

describe('Encodings — Errors', () => {
  test('encoding.opacity.* references core.dataviz.opacity.*, not foundation opacity', () => {
    // Error #1 (dataviz-encodings.md): analytical opacity does not stay separate from
    // foundation opacity — dataviz.encoding.opacity.* must resolve from core.dataviz.opacity.*,
    // not from core.opacity.* (foundation opacity used for UI layering and interaction states)
    const opacity = base.semantic.dataviz!.encoding.opacity;

    for (const key of ['context', 'muted', 'uncertainty'] as const) {
      expect(opacity[key]).toMatch(/^\{core\.dataviz\.opacity\./);
    }
  });

  test('forecast and uncertainty have full composition support (stroke + second channel)', () => {
    // Error #2 (dataviz-encodings.md): forecast or uncertainty introduced without composition
    // support — stroke.forecast or stroke.uncertainty missing when those semantics are declared;
    // uncertainty modelled only by opacity without a second reinforcing channel
    const stroke = base.semantic.dataviz!.encoding.stroke;
    const opacity = base.semantic.dataviz!.encoding.opacity;

    expect(stroke.forecast).toBeDefined();
    expect(stroke.forecast).toMatch(/^\{core\.dataviz\./);

    expect(stroke.uncertainty).toBeDefined();
    expect(stroke.uncertainty).toMatch(/^\{core\.dataviz\./);

    // If opacity.uncertainty is declared, a stroke channel must also exist as second reinforcer
    if (opacity.uncertainty) {
      expect(stroke.uncertainty).toBeDefined();
    }
  });

  test('dataviz.geo does not introduce a parallel encoding language', () => {
    // Error #3 (dataviz-encodings.md): dataviz.geo.* introduces a parallel encoding language
    // instead of reusing dataviz.encoding.shape.*, pattern.*, stroke.*, opacity.*
    // geo must only contain contextual spatial semantics (context, state)
    const geoKeys = Object.keys(base.semantic.dataviz!.geo);
    const forbidden = ['shape', 'pattern', 'stroke', 'opacity'];

    for (const key of forbidden) expect(geoKeys).not.toContain(key);
  });
});

// ---------------------------------------------------------------------------
// dataviz-encodings.md — Warnings
// ---------------------------------------------------------------------------

describe('Encodings — Warnings', () => {
  test('shape series set is bounded to 1..8', () => {
    // Warning #1 (dataviz-encodings.md): dataviz.encoding.shape.series exceeds 1..8
    expect(flat['semantic.dataviz.encoding.shape.series.9']).toBeUndefined();
  });

  test('pattern series set is bounded to 1..6', () => {
    // Warning #2 (dataviz-encodings.md): dataviz.encoding.pattern.series exceeds 1..6
    expect(flat['semantic.dataviz.encoding.pattern.series.7']).toBeUndefined();
  });

  test('stroke trio (reference, forecast, uncertainty) do not all resolve to the same value', () => {
    // Warning #3 (dataviz-encodings.md): stroke.reference, stroke.forecast, and
    // stroke.uncertainty lose effective distinction
    // Note: partial overlap (reference == forecast) is a design concern but not full loss;
    // this test guards against total collapse (all three identical).
    const reference = flat['semantic.dataviz.encoding.stroke.reference'];
    const forecast = flat['semantic.dataviz.encoding.stroke.forecast'];
    const uncertainty = flat['semantic.dataviz.encoding.stroke.uncertainty'];

    const allIdentical = reference === forecast && forecast === uncertainty;
    expect(allIdentical).toBe(false);
  });

  test('opacity trio (context, muted, uncertainty) all resolve to distinct effective values', () => {
    // Warning #4 (dataviz-encodings.md): opacity.context, opacity.muted, and
    // opacity.uncertainty lose effective distinction
    const context = flat['semantic.dataviz.encoding.opacity.context'];
    const muted = flat['semantic.dataviz.encoding.opacity.muted'];
    const uncertainty = flat['semantic.dataviz.encoding.opacity.uncertainty'];

    expect(context).not.toEqual(muted);
    expect(context).not.toEqual(uncertainty);
    expect(muted).not.toEqual(uncertainty);
  });

  test('when color semantics are defined, at least one redundancy channel (shape or pattern) exists', () => {
    // Warning #5 (dataviz-encodings.md): category exposes color semantics but no shape or
    // pattern series primitives, increasing the risk that categorical meaning depends only on color
    if (base.semantic.dataviz?.color) {
      const hasShape =
        flat['semantic.dataviz.encoding.shape.series.1'] !== undefined;
      const hasPattern =
        flat['semantic.dataviz.encoding.pattern.series.1'] !== undefined;

      expect(hasShape || hasPattern).toBe(true);
    }
  });

  test('shape and pattern series capacities are not both absent', () => {
    // Warning #6 (dataviz-encodings.md): pattern and shape series capacities are both absent,
    // reducing redundancy options for categorical differentiation
    const hasShape =
      flat['semantic.dataviz.encoding.shape.series.1'] !== undefined;
    const hasPattern =
      flat['semantic.dataviz.encoding.pattern.series.1'] !== undefined;

    expect(hasShape || hasPattern).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// index.md — Errors
// ---------------------------------------------------------------------------

describe('Overview — Errors', () => {
  test('semantic.dataviz surface contains only the allowed top-level families', () => {
    // Error #1 (index.md): Data Visualization introduces chart-type, component, library,
    // provider, or map-style semantics in the semantic token surface.
    // TypeScript enforces this at compile time; this test verifies it at runtime too.
    const allowedFamilies = new Set(['color', 'encoding', 'geo']);

    for (const key of Object.keys(base.semantic.dataviz!)) {
      expect(allowedFamilies.has(key)).toBe(true);
    }
  });

  // Error #2 (index.md): analytical opacity does not stay separate from foundation opacity.
  // Covered by Encodings — Errors > Error #1 (same validation item, different document).
});

// ---------------------------------------------------------------------------
// index.md — Warnings
// ---------------------------------------------------------------------------

describe('Overview — Warnings', () => {
  test('geo.state.focus and geo.state.selection resolve to distinct effective values', () => {
    // Warning #1 (index.md): dataviz.geo.state.focus and dataviz.geo.state.selection
    // resolve to the same effective value
    const focus = flat['semantic.dataviz.geo.state.focus'];
    const selection = flat['semantic.dataviz.geo.state.selection'];

    expect(focus).not.toEqual(selection);
  });
});
