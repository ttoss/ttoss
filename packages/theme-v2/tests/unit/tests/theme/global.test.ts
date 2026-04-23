/**
 * Global validation tests.
 *
 * Validates structural integrity and semantic contract invariants that must
 * hold across all token families and bundles.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/validation.md#global-validation
 */

import { flattenObject, isTokenRef } from '../../../../src/roots/helpers';
import {
  themeAltFlatToTest,
  themeFlatToTest,
  themeToTest,
} from '../../helpers/theme';

// ---------------------------------------------------------------------------
// Bundle fixtures — add entries here when new bundles are introduced
// ---------------------------------------------------------------------------

const bundleEntries = [{ label: 'default', source: themeToTest }];

const resolvedModes = [
  { mode: 'base', tokens: themeFlatToTest },
  ...(themeAltFlatToTest !== undefined
    ? [{ mode: 'alt', tokens: themeAltFlatToTest }]
    : []),
];

// ---------------------------------------------------------------------------
// Resolution integrity — resolved graph has no dangling refs
// (successful resolution also proves no circular refs — cycles would hang)
// ---------------------------------------------------------------------------

describe.each(resolvedModes)(
  'Structural: ref resolution — $mode mode',
  ({ tokens }) => {
    // Error #1: resolvable references — a resolved token still contains a {ref} string;
    // also proves no circular references since resolution completed successfully
    test('no resolved token contains an unresolved ref', () => {
      const unresolved = Object.entries(tokens).filter(([, v]) => {
        return isTokenRef(v);
      });
      expect(unresolved).toEqual([]);
    });
  }
);

// ---------------------------------------------------------------------------
// Core layer purity — core tokens must be raw values in source, never refs
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Semantic contract: core tokens are value-only — $label',
  ({ source: { base } }) => {
    // Error #2: core tokens remain value-only — a core token contains a {ref} string,
    // which breaks the two-layer architecture where core is the raw-value foundation
    // Tested against base source only — alternates provide semantic overrides, not core overrides
    test('no core token is a ref in the source', () => {
      const coreFlat = flattenObject(
        base.core as unknown as Record<string, unknown>,
        'core'
      );
      const coreWithRefs = Object.entries(coreFlat).filter(([, v]) => {
        return typeof v === 'string' && isTokenRef(v);
      });
      expect(coreWithRefs).toEqual([]);
    });
  }
);

// ---------------------------------------------------------------------------
// Semantic layer — tokens must reference core (meaning-first), not embed raw values
//
// Not testable from resolved tokens at this layer:
//   - Unique token names: enforced by the object key model — duplicates cannot exist
//   - Explicit deprecation metadata: requires source token format with deprecation fields
//   - Semantic meaning not changed silently: requires a diff between versions
//   - No parallel vocabulary: requires semantic judgment — not automatable
//   - Naming expresses meaning not appearance: requires naming review
// ---------------------------------------------------------------------------

describe.each(bundleEntries)(
  'Semantic contract: semantic tokens are refs — $label',
  ({ source: { base } }) => {
    // Error #3: semantic tokens remain meaning-first — a semantic token holds a raw value
    // in source instead of a token ref, bypassing the symbolic indirection layer
    // Documented raw exceptions:
    //   - sizing.hit, sizing.measure: dynamic/viewport values not expressible as core refs
    //   - var() and clamp() expressions: CSS-layer constructs resolved at render time
    // Tested against base source only — alternates only overlay semantic tokens
    test('all semantic tokens are refs or documented exceptions', () => {
      const semanticFlat = flattenObject(
        base.semantic as unknown as Record<string, unknown>,
        'semantic'
      );
      for (const [path, value] of Object.entries(semanticFlat)) {
        if (typeof value !== 'string') continue;
        const isRef = isTokenRef(value);
        const isRawSizing =
          path.includes('sizing.hit') || path.includes('sizing.measure');
        const isVarExpr = value.includes('var(') || value.includes('clamp(');
        if (!isRef && !isRawSizing && !isVarExpr) {
          throw new Error(
            `Semantic token "${path}" must be a token ref, a raw sizing/viewport exception, ` +
              `or a CSS function expression — found raw value: "${value}"`
          );
        }
      }
    });
  }
);

// ---------------------------------------------------------------------------
// Bundle structure — alternate mode must not carry a core layer override
// ---------------------------------------------------------------------------

describe('Semantic contract: alternate is semantic-only', () => {
  // Error #4: alternate mode bundle contains a "core" key — core tokens must remain
  // invariant across modes; only the semantic layer may differ per mode
  test('default bundle alternate does not carry a core layer', () => {
    if (!themeToTest.alternate) return;
    expect(themeToTest.alternate.semantic).toBeDefined();
    expect('core' in themeToTest.alternate).toBe(false);
  });
});
