// ---------------------------------------------------------------------------
// validateBreakpoints
// ---------------------------------------------------------------------------

interface BreakpointValidationResult {
  errors: string[];
  warnings: string[];
  valid: boolean;
}

const parseRem = (value: string): number | null => {
  const match = value.trim().match(/^(-?[\d.]+)rem$/);
  return match ? parseFloat(match[1]) : null;
};

const DEVICE_CATEGORY_NAMES = new Set(['mobile', 'tablet', 'desktop']);

const ORDERED_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['sm', 'md'],
  ['md', 'lg'],
  ['lg', 'xl'],
  ['xl', '2xl'],
] as const;

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
// validateBreakpoints — happy path
// ---------------------------------------------------------------------------

describe('validateBreakpoints — valid foundation set', () => {
  test('passes with default foundation breakpoints', () => {
    const result = validateBreakpoints({
      sm: '30rem',
      md: '48rem',
      lg: '64rem',
      xl: '80rem',
      '2xl': '96rem',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test('valid is true when errors array is empty', () => {
    const result = validateBreakpoints({ sm: '30rem', md: '48rem' });
    expect(result.valid).toBe(result.errors.length === 0);
  });

  test('accepts decimal rem values', () => {
    const result = validateBreakpoints({ sm: '30.5rem', md: '48.5rem' });
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

describe('validateBreakpoints — errors', () => {
  test('sm >= md is an order violation', () => {
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

  test('equal adjacent values count as order violation', () => {
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

  test('xl >= 2xl is an order violation', () => {
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
    const result = validateBreakpoints({ sm: '0rem' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('"sm"'));
  });

  test('negative rem value is an error', () => {
    const result = validateBreakpoints({ md: '-4rem' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('"md"'));
  });

  test('multiple errors are all reported', () => {
    const result = validateBreakpoints({
      sm: '0rem',
      md: '0rem',
    });
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Warnings
// ---------------------------------------------------------------------------

describe('validateBreakpoints — warnings', () => {
  test('non-rem unit produces warning', () => {
    const result = validateBreakpoints({ sm: '480px' });
    expect(result.valid).toBe(true); // not an error
    expect(result.warnings).toContainEqual(
      expect.stringContaining('rem units')
    );
  });

  test('more than 5 steps produces warning', () => {
    const result = validateBreakpoints({
      sm: '20rem',
      md: '30rem',
      lg: '40rem',
      xl: '50rem',
      '2xl': '60rem',
      '3xl': '70rem',
    });
    expect(result.warnings).toContainEqual(expect.stringContaining('6'));
  });

  test('adjacent steps under 8rem apart produce warning', () => {
    const result = validateBreakpoints({
      sm: '30rem',
      md: '34rem', // 4rem gap — under minimum
      lg: '64rem',
      xl: '80rem',
      '2xl': '96rem',
    });
    expect(result.warnings).toContainEqual(
      expect.stringContaining('4rem')
    );
  });

  test.each(['mobile', 'tablet', 'desktop'])(
    'device-category name "%s" produces warning',
    (name) => {
      const result = validateBreakpoints({ [name]: '30rem' });
      expect(result.warnings).toContainEqual(
        expect.stringContaining(`"${name}"`)
      );
    }
  );

  test('non-rem value skips ordering check for that pair', () => {
    // 'sm' is not rem — ordering check for sm↔md pair is skipped
    const result = validateBreakpoints({ sm: '480px', md: '48rem' });
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toContainEqual(
      expect.stringContaining('rem units')
    );
  });
});

// ---------------------------------------------------------------------------
// Partial / application-level sets
// ---------------------------------------------------------------------------

describe('validateBreakpoints — partial sets', () => {
  test('subset with valid pair passes', () => {
    const result = validateBreakpoints({ sm: '30rem', md: '48rem' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('unknown key names skip ordered-pair checks entirely', () => {
    // 'narrow' and 'wide' are not in ORDERED_PAIRS — no order errors
    const result = validateBreakpoints({ narrow: '30rem', wide: '80rem' });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('empty set is valid', () => {
    const result = validateBreakpoints({});
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
