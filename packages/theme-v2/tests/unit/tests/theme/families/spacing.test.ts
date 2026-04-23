/**
 * Spacing family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/spacing.md#validation
 */

import { themeAltFlatToTest, themeFlatToTest } from '../../../helpers/theme';

// ---------------------------------------------------------------------------
// Test bundles — extend when new theme bundles are added
// ---------------------------------------------------------------------------

const bundleEntries: ReadonlyArray<{
  label: string;
  tokens: Record<string, string | number>;
}> = [
  { label: 'default', tokens: themeFlatToTest },
  ...(themeAltFlatToTest
    ? [{ label: 'alternate', tokens: themeAltFlatToTest }]
    : []),
];

// ---------------------------------------------------------------------------
// Shared helpers — token parsing and structural checks
// ---------------------------------------------------------------------------

/** Extracts the effective scale unit from a resolved space value for numeric ordering checks. */
const parseSpaceValue = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  if (str === '0px' || str === '0') return 0;
  const calcMatch = str.match(/calc\((\d+)\s*\*/);
  if (calcMatch) return parseFloat(calcMatch[1]);
  if (str.endsWith('px')) return parseFloat(str);
  return NaN;
};

/** Splits `clamp(a, b, c)` into its three arguments, respecting nested parens. */
const parseClampArgs = (str: string): [string, string, string] | null => {
  const inner = str.trim().match(/^clamp\(([\s\S]+)\)$/)?.[1];
  if (!inner) return null;
  const parts: string[] = [];
  let depth = 0;
  let buf = '';
  for (const ch of inner) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(buf.trim());
      buf = '';
    } else {
      buf += ch;
    }
  }
  parts.push(buf.trim());
  if (parts.length !== 3) return null;
  return [parts[0], parts[1], parts[2]];
};

/** Returns true when the value is a valid core.space.* step alias: `0px` or `calc(N * var(--tt-space-unit))`. */
const isCoreSpaceAlias = (value: string | number): boolean => {
  const str = String(value).trim();
  return str === '0px' || /^calc\(\d+ \* var\(--tt-space-unit\)\)$/.test(str);
};

/** Returns true when the value embeds a direct responsive unit rather than composing from core.space.*. */
const hasDirectResponsiveUnits = (value: string): boolean => {
  return /\b(?:cqi|cqmin|cqmax|cqb|vi|vb|vw|vh|svw|svh|dvw|dvh|lvw|lvh)\b|\d+%/.test(
    value
  );
};

// ---------------------------------------------------------------------------
// Inset step scale — ordering and surface/control relationship
// ---------------------------------------------------------------------------

for (const { label, tokens } of bundleEntries) {
  describe(`Semantic spacing — inset ordering (${label})`, () => {
    test('inset.control: sm < md < lg', () => {
      const sm = parseSpaceValue(tokens['semantic.spacing.inset.control.sm']!);
      const md = parseSpaceValue(tokens['semantic.spacing.inset.control.md']!);
      const lg = parseSpaceValue(tokens['semantic.spacing.inset.control.lg']!);

      expect(sm).not.toBeNaN();
      expect(md).not.toBeNaN();
      expect(lg).not.toBeNaN();

      // Error #1: inset.control.sm > inset.control.md
      expect(sm).toBeLessThan(md);
      // Error #2: inset.control.md > inset.control.lg
      expect(md).toBeLessThan(lg);
    });

    test('inset.surface: sm < md < lg', () => {
      const sm = parseSpaceValue(tokens['semantic.spacing.inset.surface.sm']!);
      const md = parseSpaceValue(tokens['semantic.spacing.inset.surface.md']!);
      const lg = parseSpaceValue(tokens['semantic.spacing.inset.surface.lg']!);

      expect(sm).not.toBeNaN();
      expect(md).not.toBeNaN();
      expect(lg).not.toBeNaN();

      // Error #3: inset.surface.sm > inset.surface.md
      expect(sm).toBeLessThan(md);
      // Error #4: inset.surface.md > inset.surface.lg
      expect(md).toBeLessThan(lg);
    });

    test.each(['sm', 'md', 'lg'] as const)(
      'inset.surface.%s ≥ inset.control.%s',
      (step) => {
        // Error #5: a surface inset step is tighter than the corresponding control inset step
        const surface = parseSpaceValue(
          tokens[`semantic.spacing.inset.surface.${step}`]!
        );
        const control = parseSpaceValue(
          tokens[`semantic.spacing.inset.control.${step}`]!
        );

        expect(surface).not.toBeNaN();
        expect(control).not.toBeNaN();
        expect(surface).toBeGreaterThanOrEqual(control);
      }
    );

    test('adjacent inset.control steps have distinct values', () => {
      // Warning #1: adjacent inset.control.* steps resolve to the same effective value
      const steps = ['sm', 'md', 'lg'] as const;
      const values = steps.map((s) => {
        return parseSpaceValue(tokens[`semantic.spacing.inset.control.${s}`]!);
      });

      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).not.toBe(values[i + 1]);
      }
    });

    test('adjacent inset.surface steps have distinct values', () => {
      // Warning #2: adjacent inset.surface.* steps resolve to the same effective value
      const steps = ['sm', 'md', 'lg'] as const;
      const values = steps.map((s) => {
        return parseSpaceValue(tokens[`semantic.spacing.inset.surface.${s}`]!);
      });

      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).not.toBe(values[i + 1]);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Gap step scale — aliasing, ordering, and inline relationship
// ---------------------------------------------------------------------------

for (const { label, tokens } of bundleEntries) {
  describe(`Semantic spacing — gap ordering (${label})`, () => {
    test.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
      'gap.stack.%s is a core.space.* alias',
      (step) => {
        // Error #6: any gap.stack.* token resolves to anything other than a core.space.* step alias
        const value = tokens[`semantic.spacing.gap.stack.${step}`];

        expect(value).toBeDefined();
        expect(isCoreSpaceAlias(value!)).toBe(true);
      }
    );

    test('gap.stack: xs < sm < md < lg < xl', () => {
      const steps = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      const values = steps.map((s) => {
        return parseSpaceValue(tokens[`semantic.spacing.gap.stack.${s}`]!);
      });

      for (const v of values) expect(v).not.toBeNaN();

      // Error #7: stack gap order breaks
      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).toBeLessThan(values[i + 1]);
      }
    });

    test('gap.inline.xs < gap.inline.sm', () => {
      // Error #8: gap.inline.xs > gap.inline.sm
      const xs = parseSpaceValue(tokens['semantic.spacing.gap.inline.xs']!);
      const sm = parseSpaceValue(tokens['semantic.spacing.gap.inline.sm']!);

      expect(xs).not.toBeNaN();
      expect(sm).not.toBeNaN();
      expect(xs).toBeLessThan(sm);
    });

    test('adjacent gap.stack steps have distinct values', () => {
      // Warning #3: adjacent gap.stack.* steps resolve to the same effective value
      const steps = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
      const values = steps.map((s) => {
        return parseSpaceValue(tokens[`semantic.spacing.gap.stack.${s}`]!);
      });

      for (let i = 0; i < values.length - 1; i++) {
        expect(values[i]).not.toBe(values[i + 1]);
      }
    });

    test('gap.inline.xs has a distinct value from gap.inline.sm', () => {
      // Warning #4: gap.inline.xs resolves to the same effective value as gap.inline.sm
      const xs = parseSpaceValue(tokens['semantic.spacing.gap.inline.xs']!);
      const sm = parseSpaceValue(tokens['semantic.spacing.gap.inline.sm']!);

      expect(xs).not.toBe(sm);
    });
  });
}

// ---------------------------------------------------------------------------
// Semantic token aliasing — every non-gutter / non-separation token must
// reference core steps, not define its own formula
// ---------------------------------------------------------------------------

const MUST_ALIAS_KEYS = [
  'semantic.spacing.inset.control.sm',
  'semantic.spacing.inset.control.md',
  'semantic.spacing.inset.control.lg',
  'semantic.spacing.inset.surface.sm',
  'semantic.spacing.inset.surface.md',
  'semantic.spacing.inset.surface.lg',
  'semantic.spacing.gap.stack.xs',
  'semantic.spacing.gap.stack.sm',
  'semantic.spacing.gap.stack.md',
  'semantic.spacing.gap.stack.lg',
  'semantic.spacing.gap.stack.xl',
  'semantic.spacing.gap.inline.xs',
  'semantic.spacing.gap.inline.sm',
  'semantic.spacing.gap.inline.md',
  'semantic.spacing.gap.inline.lg',
] as const;

for (const { label, tokens } of bundleEntries) {
  describe(`Semantic spacing — aliasing contract (${label})`, () => {
    test.each(MUST_ALIAS_KEYS)('%s is a core.space.* alias', (key) => {
      // Error #16: any semantic spacing token other than gutter.* or separation.interactive.min
      //            defines its own raw formula instead of aliasing core spacing steps
      const value = tokens[key];

      expect(value).toBeDefined();
      expect(isCoreSpaceAlias(value!)).toBe(true);
    });
  });
}

// ---------------------------------------------------------------------------
// Gutter — bounded clamp contract, no direct responsive units, relative ordering
// ---------------------------------------------------------------------------

for (const { label, tokens } of bundleEntries) {
  describe(`Semantic spacing — gutter contracts (${label})`, () => {
    test.each(['page', 'section'] as const)(
      'gutter.%s is a bounded clamp()',
      (context) => {
        // Error #9 (gutter.page) / Error #10 (gutter.section): not a bounded clamp(...) contract
        const value = String(tokens[`semantic.spacing.gutter.${context}`]);

        expect(value).toContain('clamp(');
        expect(parseClampArgs(value)).not.toBeNull();
      }
    );

    test.each(['page', 'section'] as const)(
      'gutter.%s contains no direct responsive units',
      (context) => {
        // Error #11: gutter.* introduces direct responsive logic instead of composing from core.space.*
        const value = String(tokens[`semantic.spacing.gutter.${context}`]);

        expect(hasDirectResponsiveUnits(value)).toBe(false);
      }
    );

    test('gutter.page bounds ≥ gutter.section bounds at min and max', () => {
      // Error #12: gutter.page resolves smaller than gutter.section at any bound
      const pageArgs = parseClampArgs(
        String(tokens['semantic.spacing.gutter.page'])
      );
      const sectionArgs = parseClampArgs(
        String(tokens['semantic.spacing.gutter.section'])
      );

      expect(pageArgs).not.toBeNull();
      expect(sectionArgs).not.toBeNull();

      expect(parseSpaceValue(pageArgs![0])).toBeGreaterThanOrEqual(
        parseSpaceValue(sectionArgs![0])
      );
      expect(parseSpaceValue(pageArgs![2])).toBeGreaterThanOrEqual(
        parseSpaceValue(sectionArgs![2])
      );
    });

    test('gutter.page and gutter.section have distinct effective contracts', () => {
      // Warning #5: gutter.page and gutter.section resolve to the same effective contract
      const pageArgs = parseClampArgs(
        String(tokens['semantic.spacing.gutter.page'])
      );
      const sectionArgs = parseClampArgs(
        String(tokens['semantic.spacing.gutter.section'])
      );

      expect(pageArgs).not.toBeNull();
      expect(sectionArgs).not.toBeNull();
      expect(pageArgs).not.toEqual(sectionArgs);
    });
  });
}

// ---------------------------------------------------------------------------
// Separation — bounded clamp, no direct responsive units, ergonomic floor
// ---------------------------------------------------------------------------

for (const { label, tokens } of bundleEntries) {
  describe(`Semantic spacing — separation.interactive.min (${label})`, () => {
    test('separation.interactive.min is a bounded clamp()', () => {
      // Error #13: separation.interactive.min is not a bounded clamp(...) contract
      const value = String(
        tokens['semantic.spacing.separation.interactive.min']
      );

      expect(value).toContain('clamp(');
      expect(parseClampArgs(value)).not.toBeNull();
    });

    test('separation.interactive.min contains no direct responsive units', () => {
      // Error #14: separation.interactive.min introduces direct responsive logic
      //            instead of composing from core.space.*
      const value = String(
        tokens['semantic.spacing.separation.interactive.min']
      );

      expect(hasDirectResponsiveUnits(value)).toBe(false);
    });

    test('separation.interactive.min floor ≥ 5px', () => {
      // Error #15: separation.interactive.min has a minimum bound below 5px
      const value = String(
        tokens['semantic.spacing.separation.interactive.min']
      );
      const args = parseClampArgs(value);

      expect(args).not.toBeNull();
      const minVal = parseSpaceValue(args![0]);
      expect(minVal).not.toBeNaN();
      expect(minVal).toBeGreaterThanOrEqual(5);
    });

    test('separation.interactive.min is distinct from gap.inline.sm', () => {
      // Warning #6: separation.interactive.min resolves to the same effective value as gap.inline.sm
      const sep = tokens['semantic.spacing.separation.interactive.min'];
      const gapInlineSm = tokens['semantic.spacing.gap.inline.sm'];

      expect(sep).not.toBe(gapInlineSm);
    });
  });
}

// ---------------------------------------------------------------------------
// Not tested: CSS output structure (Error #17, Error #18)
//
// Error #17: generated output does not emit a viewport-safe fallback before
//            container-based overrides.
// Error #18: generated output does not gate container-based overrides behind
//            @supports (width: 1cqi).
//
// Both constraints require inspecting the CSS string produced by
// toCssVars() / getThemeStylesContent() — not observable from resolved flat
// token values alone. Add to a dedicated CSS-output integration test that
// calls getThemeStylesContent() and asserts on the resulting CSS string.
// ---------------------------------------------------------------------------
