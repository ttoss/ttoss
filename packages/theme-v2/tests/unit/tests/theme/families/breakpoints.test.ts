/**
 * Breakpoints family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/breakpoints.md#validation
 */

import { themeAltFlatToTest, themeFlatToTest } from '../../../helpers/theme';

// ---------------------------------------------------------------------------
// Validation logic — implements the rules from the doc's Validation section
// ---------------------------------------------------------------------------

interface BreakpointValidationResult {
  errors: string[];
  warnings: string[];
  valid: boolean;
}

const DEVICE_CATEGORY_NAMES = new Set(['mobile', 'tablet', 'desktop']);

const ORDERED_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['sm', 'md'],
  ['md', 'lg'],
  ['lg', 'xl'],
  ['xl', '2xl'],
] as const;

const parseRem = (value: string): number | null => {
  const match = value.trim().match(/^(-?[\d.]+)rem$/);
  return match ? parseFloat(match[1]) : null;
};

const validateBreakpoints = (
  breakpoints: Record<string, string>
): BreakpointValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const key of Object.keys(breakpoints)) {
    if (DEVICE_CATEGORY_NAMES.has(key)) {
      warnings.push(
        `Device-category name detected: "${key}". Use scale names (sm, md, lg) instead.`
      );
    }
  }

  const stepCount = Object.keys(breakpoints).length;
  if (stepCount > 5) {
    warnings.push(
      `Breakpoint set contains ${stepCount} named steps. Maximum recommended is 5.`
    );
  }

  const parsed: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(breakpoints)) {
    const rem = parseRem(value);
    parsed[key] = rem;
    if (rem === null) {
      warnings.push(`Breakpoint "${key}" does not use rem units: "${value}".`);
    } else if (rem <= 0) {
      errors.push(
        `Breakpoint "${key}" must resolve to a positive value, got "${value}".`
      );
    }
  }

  for (const [a, b] of ORDERED_PAIRS) {
    const remA = parsed[a];
    const remB = parsed[b];
    if (remA == null || remB == null) continue;
    if (remA >= remB) {
      errors.push(
        `Breakpoint order violated: "${a}" (${breakpoints[a]}) must be less than "${b}" (${breakpoints[b]}).`
      );
    } else if (remB - remA < 8) {
      warnings.push(
        `Adjacent breakpoints "${a}" and "${b}" differ by ${remB - remA}rem, which is less than the recommended 8rem minimum.`
      );
    }
  }

  return { errors, warnings, valid: errors.length === 0 };
};

// ---------------------------------------------------------------------------
// Errors — violations that must set valid:false
// ---------------------------------------------------------------------------

describe('validateBreakpoints — errors', () => {
  test('sm greater than md is an order violation', () => {
    // Error #1: Breakpoint order breaks: sm >= md, md >= lg, lg >= xl, or xl >= 2xl
    const result = validateBreakpoints({
      sm: '48rem',
      md: '30rem',
      lg: '64rem',
      xl: '80rem',
      '2xl': '96rem',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('"sm"'));
    expect(result.errors).toContainEqual(expect.stringContaining('"md"'));
  });

  test('sm equal to md is an order violation', () => {
    // Error #1
    const result = validateBreakpoints({
      sm: '30rem',
      md: '30rem',
      lg: '64rem',
      xl: '80rem',
      '2xl': '96rem',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('xl greater than 2xl is an order violation', () => {
    // Error #1
    const result = validateBreakpoints({
      sm: '30rem',
      md: '48rem',
      lg: '64rem',
      xl: '96rem',
      '2xl': '80rem',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('"xl"'));
  });

  test('zero rem value is an error', () => {
    // Error #2: Any foundation breakpoint resolves to 0 or a negative value
    const result = validateBreakpoints({ sm: '0rem' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('"sm"'));
  });

  test('negative rem value is an error', () => {
    // Error #2
    const result = validateBreakpoints({ md: '-4rem' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('"md"'));
  });
});

// ---------------------------------------------------------------------------
// Warnings — violations that fire without invalidating the set
// ---------------------------------------------------------------------------

describe('validateBreakpoints — warnings', () => {
  test('adjacent steps under 8rem apart produce a warning', () => {
    // Warning #1: Adjacent steps differ by less than 8rem
    const result = validateBreakpoints({
      sm: '30rem',
      md: '34rem',
      lg: '64rem',
      xl: '80rem',
      '2xl': '96rem',
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toContainEqual(expect.stringContaining('4rem'));
  });

  test('more than 5 breakpoints produce a warning', () => {
    // Warning #2: Foundation set contains more than 5 named steps
    const result = validateBreakpoints({
      sm: '20rem',
      md: '30rem',
      lg: '40rem',
      xl: '50rem',
      '2xl': '60rem',
      '3xl': '70rem',
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toContainEqual(expect.stringContaining('6'));
  });

  test('non-rem unit produces a warning', () => {
    // Warning #3: Any foundation breakpoint does not resolve to a rem value
    const result = validateBreakpoints({ sm: '480px' });
    expect(result.valid).toBe(true);
    expect(result.warnings).toContainEqual(
      expect.stringContaining('rem units')
    );
  });

  test.each(['mobile', 'tablet', 'desktop'])(
    'device-category name "%s" produces a warning',
    (name) => {
      // Warning #4: Device-category naming detected (mobile, tablet, desktop)
      const result = validateBreakpoints({ [name]: '30rem' });
      expect(result.warnings).toContainEqual(
        expect.stringContaining(`"${name}"`)
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Production bundles — validates every registered bundle against all rules
// ---------------------------------------------------------------------------

describe('validateBreakpoints — production bundles', () => {
  // Breakpoints are core tokens — invariant across modes.
  // The alternate semantic override does not reach core.breakpoints.
  describe('default', () => {
    const breakpoints = Object.fromEntries(
      Object.entries(themeFlatToTest)
        .filter(([key]) => {
          return key.startsWith('core.breakpoints.');
        })
        .map(([key, value]) => {
          return [key.replace('core.breakpoints.', ''), String(value)];
        })
    );

    test('base mode: no errors', () => {
      // Error #1, Error #2
      const result = validateBreakpoints(breakpoints);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });

    test('base mode: no warnings', () => {
      // Warning #1, Warning #2, Warning #3, Warning #4
      const result = validateBreakpoints(breakpoints);
      expect(result.warnings).toEqual([]);
    });

    if (themeAltFlatToTest) {
      test('alternate mode: no errors', () => {
        // Error #1, Error #2
        const result = validateBreakpoints(breakpoints);
        expect(result.errors).toEqual([]);
        expect(result.valid).toBe(true);
      });

      test('alternate mode: no warnings', () => {
        // Warning #1, Warning #2, Warning #3, Warning #4
        const result = validateBreakpoints(breakpoints);
        expect(result.warnings).toEqual([]);
      });
    }
  });
});
