/**
 * Global validation tests.
 *
 * Validates structural integrity and semantic contract invariants that must
 * hold across all token families and bundles.
 *
 * @see /docs/website/docs/design/design-system/design-tokens/validation.md#global-validation
 */

import { toFlatTokens } from '../../../../src/css';
import { flattenObject, isTokenRef } from '../../../../src/roots/helpers';
import { TOKEN_PATH_REGISTRY } from '../../../../src/roots/tokenRegistry';
import { bruttal } from '../../../../src/themes/bruttal';
import {
  themeAltFlatToTest,
  themeFlatToTest,
  themeToTest,
} from '../../fixtures/theme';
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
    //
    // TWO shapes are lawful and there is no third (ADR-023):
    //   - a token ref — the rule (model.md §2)
    //   - a CSS function expression (clamp/rgba/var/…) — a *composition*, which
    //     is the only thing a single `{token.path}` genuinely cannot express, so
    //     it is what §8's necessity test is for; each one is registered there
    //
    // A BARE CONSTANT is never lawful, and this list of exceptions used to hold
    // three of them. `spacing.inset.control` carried a literal `6px` under a
    // §8 entry reading "a constant cannot be a TokenRef because every
    // core.spacing step is fluid" — which describes a MISSING CORE STEP, not a
    // technical impossibility, and the necessity test it was granted under is
    // therefore circular: a constant is always expressible as a ref the moment
    // core holds it, and core is the layer whose job is raw values (§1). The
    // fix put the value in `core.spacing.fixed.*` and left this guard with
    // nothing to exempt — the `sizing.hit`/`sizing.measure` entries beside it
    // had already gone stale (both are refs or compositions today), so the
    // whole escape hatch was dead the moment the real offender moved.
    //
    // Tested against base source only — alternates only overlay semantic tokens
    test('all semantic tokens are refs or compositions — never bare constants', () => {
      const semanticFlat = flattenObject(
        base.semantic as unknown as Record<string, unknown>,
        'semantic'
      );
      for (const [path, value] of Object.entries(semanticFlat)) {
        if (typeof value !== 'string') continue;
        const isRef = isTokenRef(value);
        // CSS function expressions (clamp, var, rgba, rgb, hsl, hsla, color,
        // calc, min, max) are valid containers for embedded refs — they are
        // resolved at render time by the CSS layer.
        const isCssFnExpr = /^[a-z-]+\(.*\)$/i.test(value.trim());
        if (!isRef && !isCssFnExpr) {
          throw new Error(
            `Semantic token "${path}" holds the bare constant "${value}".\n` +
              `A semantic token is a ref or a composition (model.md §2/§8) — a constant ` +
              `belongs in core, which is the layer that holds values (§1). Add the step ` +
              `to core (see \`core.spacing.fixed.*\` for the precedent) and reference it. ` +
              `"Core has no step for this value" is a missing core token, never a ` +
              `RawValue necessity (ADR-023).`
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

  // model.md § Modes: "semantic token names do not change; semantic token
  // references may point to different core tokens" — a mode REMAPS what the
  // base declares, it never adds a leaf of its own. The failure mode is
  // silent and one-sided: `vars` mirrors the base shape, so an alt-only leaf
  // emits a CSS custom property no component can ever reference — the value
  // ships, nothing reads it, and the contrast suite audits a pair the
  // renderer does not produce. F-043's first fix did exactly this
  // (`action.secondary.text.active` declared only in the dark alternate) and
  // looked green everywhere except the actual screen.
  test.each([
    ['default', themeToTest],
    ['bruttal', bruttal],
  ])(
    '%s: the alternate only remaps leaves the base declares',
    (_label, bundle) => {
      if (!bundle.alternate) return;
      const base = toFlatTokens(bundle.base);
      const altOnly = Object.keys(
        flattenObject({ semantic: bundle.alternate.semantic })
      ).filter((path) => {
        return !(path in base);
      });
      expect(altOnly).toEqual([]);
    }
  );
});

// ---------------------------------------------------------------------------
// Token registry completeness — every flat token path must match a registry prefix
//
// The registry drives both CSS var and DTCG output. A missing prefix means a
// token exists in the theme but is silently dropped from generated artifacts.
// ---------------------------------------------------------------------------

describe('Structural: token registry covers every token path', () => {
  // Resolve which flat path keys belong to a known registry prefix.
  const hasRegistryMatch = (path: string) => {
    return TOKEN_PATH_REGISTRY.some((entry) => {
      return path.startsWith(entry.path);
    });
  };

  test.each(resolvedModes)(
    '$mode mode: every token path matches a TOKEN_PATH_REGISTRY prefix',
    ({ tokens }) => {
      const unmatched = Object.keys(tokens).filter((path) => {
        return !hasRegistryMatch(path);
      });
      expect(unmatched).toEqual([]);
    }
  );
});
