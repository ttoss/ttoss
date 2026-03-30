/**
 * Spacing family validation tests.
 *
 * Validates spacing tokens against the documented rules:
 * - inset.control ordering: sm < md < lg
 * - inset.surface ordering: sm < md < lg
 * - surface inset ≥ control inset at each step
 * - gap.stack ordering: xs < sm < md < lg < xl
 * - gutter uses bounded clamp() contracts
 * - separation.interactive.min uses bounded clamp()
 *
 * @see REFACTOR.md Gap 4 — Spacing contract validation
 */

import { bundleEntries, resolvedBundles } from '../../helpers';
import { filterTokensByPrefix, getTokenValue } from './testHelpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a value is a clamp() expression.
 */
const isClamp = (value: string | number): boolean => {
  return typeof value === 'string' && value.includes('clamp(');
};

/**
 * Check if a value is a reference to a core.space.* token via var(--tt-space-*).
 */
const isSpaceVarRef = (value: string | number): boolean => {
  return typeof value === 'string' && value.includes('var(--tt-space-');
};

/**
 * Check if a value is a core.space token reference ({core.space.*}).
 */
const isCoreSpaceRef = (value: string | number): boolean => {
  return typeof value === 'string' && /\{core\.space\.\w+\}/.test(value);
};

/**
 * Parse a CSS calc expression to extract the multiplier for comparison.
 * e.g. "calc(4 * var(--tt-space-unit))" → 4
 * Returns the raw px value if not a calc, or NaN if unparseable.
 */
const parseSpaceValue = (value: string | number): number => {
  if (typeof value === 'number') {
    return value;
  }

  const str = String(value).trim();

  // Handle "0px" or "0"
  if (str === '0px' || str === '0') {
    return 0;
  }

  // Handle "calc(N * var(--tt-space-unit))"
  const calcMatch = str.match(/calc\((\d+)\s*\*/);
  if (calcMatch) {
    return parseFloat(calcMatch[1]);
  }

  // Handle px values
  if (str.endsWith('px')) {
    return parseFloat(str);
  }

  return NaN;
};

// ---------------------------------------------------------------------------
// Semantic Spacing — Inset Ordering
// ---------------------------------------------------------------------------

describe('Semantic spacing: inset ordering', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('inset.control: sm < md < lg', () => {
      const sm = parseSpaceValue(
        getTokenValue(base, 'semantic.spacing.inset.control.sm')!
      );
      const md = parseSpaceValue(
        getTokenValue(base, 'semantic.spacing.inset.control.md')!
      );
      const lg = parseSpaceValue(
        getTokenValue(base, 'semantic.spacing.inset.control.lg')!
      );

      expect(sm).not.toBeNaN();
      expect(md).not.toBeNaN();
      expect(lg).not.toBeNaN();

      expect(sm).toBeLessThan(md);
      expect(md).toBeLessThan(lg);
    });

    test('inset.surface: sm < md < lg', () => {
      const sm = parseSpaceValue(
        getTokenValue(base, 'semantic.spacing.inset.surface.sm')!
      );
      const md = parseSpaceValue(
        getTokenValue(base, 'semantic.spacing.inset.surface.md')!
      );
      const lg = parseSpaceValue(
        getTokenValue(base, 'semantic.spacing.inset.surface.lg')!
      );

      expect(sm).not.toBeNaN();
      expect(md).not.toBeNaN();
      expect(lg).not.toBeNaN();

      expect(sm).toBeLessThan(md);
      expect(md).toBeLessThan(lg);
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic Spacing — Surface ≥ Control at Each Step
// ---------------------------------------------------------------------------

describe('Semantic spacing: surface inset ≥ control inset', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test.each(['sm', 'md', 'lg'])('surface.%s ≥ control.%s', (step) => {
      const surfaceVal = parseSpaceValue(
        getTokenValue(base, `semantic.spacing.inset.surface.${step}`)!
      );
      const controlVal = parseSpaceValue(
        getTokenValue(base, `semantic.spacing.inset.control.${step}`)!
      );

      expect(surfaceVal).not.toBeNaN();
      expect(controlVal).not.toBeNaN();
      expect(surfaceVal).toBeGreaterThanOrEqual(controlVal);
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic Spacing — Gap Stack Ordering
// ---------------------------------------------------------------------------

describe('Semantic spacing: gap.stack ordering', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('gap.stack: xs < sm < md < lg < xl', () => {
      const steps = ['xs', 'sm', 'md', 'lg', 'xl'];
      const values = steps.map((step) =>
        parseSpaceValue(
          getTokenValue(base, `semantic.spacing.gap.stack.${step}`)!
        )
      );

      for (const v of values) {
        expect(v).not.toBeNaN();
      }

      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).toBeLessThan(values[i + 1]);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic Spacing — Gutter Clamp Contracts
// ---------------------------------------------------------------------------

describe('Semantic spacing: gutter clamp contracts', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('gutter.page uses clamp() or var() references', () => {
      const value = getTokenValue(base, 'semantic.spacing.gutter.page');
      expect(value).toBeDefined();
      // Resolved value should contain clamp with var references
      const str = String(value);
      expect(
        str.includes('clamp(') || str.includes('var(--tt-space-')
      ).toBe(true);
    });

    test('gutter.section uses clamp() or var() references', () => {
      const value = getTokenValue(base, 'semantic.spacing.gutter.section');
      expect(value).toBeDefined();
      const str = String(value);
      expect(
        str.includes('clamp(') || str.includes('var(--tt-space-')
      ).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic Spacing — Separation Interactive Min
// ---------------------------------------------------------------------------

describe('Semantic spacing: separation.interactive.min', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('separation.interactive.min uses bounded clamp()', () => {
      const value = getTokenValue(
        base,
        'semantic.spacing.separation.interactive.min'
      );
      expect(value).toBeDefined();
      const str = String(value);
      // Must be a clamp expression with a minimum floor
      expect(str).toContain('clamp(');
    });

    test('separation.interactive.min has a floor ≥ 5px', () => {
      const value = String(
        getTokenValue(base, 'semantic.spacing.separation.interactive.min')
      );
      // Extract the minimum value from clamp(min, preferred, max)
      const clampMatch = value.match(/clamp\(([^,]+),/);
      if (clampMatch) {
        const minVal = parseFloat(clampMatch[1]);
        expect(minVal).toBeGreaterThanOrEqual(5);
      }
    });
  });
});
