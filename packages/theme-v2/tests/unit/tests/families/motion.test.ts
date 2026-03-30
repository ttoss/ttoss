import { createTheme, defaultTheme } from '../../../../src';
import type { ThemeTokensV2 } from '../../../../src/Types';
import { flattenAndResolve } from '../../../../src/roots/helpers';

// ---------------------------------------------------------------------------
// validateMotion
// ---------------------------------------------------------------------------

interface MotionValidationResult {
  errors: string[];
  warnings: string[];
  valid: boolean;
}

const parseDurationMs = (value: string): number | null => {
  const match = value.trim().match(/^(-?[\d.]+)ms$/);
  return match ? parseFloat(match[1]) : null;
};

const ORDERED_DURATION_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['none', 'xs'],
  ['xs', 'sm'],
  ['sm', 'md'],
  ['md', 'lg'],
  ['lg', 'xl'],
] as const;

const validateMotion = (theme: ThemeTokensV2): MotionValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { duration } = theme.core.motion;

  const parsedDurations: Record<string, number | null> = {};
  for (const [key, value] of Object.entries(duration)) {
    parsedDurations[key] = parseDurationMs(value);
  }

  for (const [a, b] of ORDERED_DURATION_PAIRS) {
    const msA = parsedDurations[a];
    const msB = parsedDurations[b];
    if (msA == null || msB == null) continue;
    if (msA > msB) {
      errors.push(
        `Motion duration order violated: "${a}" (${duration[a as keyof typeof duration]}) must not exceed "${b}" (${duration[b as keyof typeof duration]}).`
      );
    } else if (msA === msB) {
      warnings.push(
        `Adjacent motion durations "${a}" and "${b}" resolve to the same value: ${duration[a as keyof typeof duration]}.`
      );
    }
  }

  const resolved = flattenAndResolve(theme);
  const getResolvedDuration = (role: string) =>
    String(resolved[`semantic.motion.${role}.duration`] ?? '');
  const getResolvedEasing = (role: string) =>
    String(resolved[`semantic.motion.${role}.easing`] ?? '');
  const getContract = (role: string) =>
    `${getResolvedDuration(role)}|${getResolvedEasing(role)}`;

  const semanticRoles = [
    'feedback',
    'transition.enter',
    'transition.exit',
    'emphasis',
    'decorative',
  ];
  const isStatic = semanticRoles.every((r) => getResolvedDuration(r) === '0ms');

  if (!isStatic) {
    if (getResolvedEasing('transition.enter') === getResolvedEasing('transition.exit')) {
      warnings.push(
        'motion.transition.enter and motion.transition.exit resolve to the same effective easing contract in a non-static theme.'
      );
    }
    if (getContract('feedback') === getContract('transition.enter')) {
      warnings.push(
        'motion.feedback and motion.transition.enter resolve to the same effective motion contract in a non-static theme.'
      );
    }
    if (getContract('emphasis') === getContract('transition.enter')) {
      warnings.push(
        'motion.emphasis resolves to the same effective motion contract as motion.transition.enter in a non-static theme.'
      );
    }
  }

  return { errors, warnings, valid: errors.length === 0 };
};

// ---------------------------------------------------------------------------
// validateMotion — happy path
// ---------------------------------------------------------------------------

describe('validateMotion — valid default theme', () => {
  test('passes with default theme', () => {
    const result = validateMotion(defaultTheme);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  test('valid is true when errors array is empty', () => {
    const result = validateMotion(defaultTheme);
    expect(result.valid).toBe(result.errors.length === 0);
  });

  test('default theme has none < xs < sm < md < lg < xl', () => {
    const { duration } = defaultTheme.core.motion;
    expect(duration.none).toBe('0ms');
    expect(duration.xs).toBe('50ms');
    expect(duration.sm).toBe('100ms');
    expect(duration.md).toBe('200ms');
    expect(duration.lg).toBe('300ms');
    expect(duration.xl).toBe('500ms');
  });
});

// ---------------------------------------------------------------------------
// Errors — ordering violations
// ---------------------------------------------------------------------------

describe('validateMotion — errors', () => {
  test('none > xs is an order violation', () => {
    const theme = createTheme({
      overrides: {
        core: { motion: { duration: { none: '100ms', xs: '50ms' } } },
      },
    });
    const result = validateMotion(theme);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('"none"'));
    expect(result.errors).toContainEqual(expect.stringContaining('"xs"'));
  });

  test('xs > sm is an order violation', () => {
    const theme = createTheme({
      overrides: {
        core: { motion: { duration: { xs: '200ms', sm: '100ms' } } },
      },
    });
    const result = validateMotion(theme);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('"xs"'));
    expect(result.errors).toContainEqual(expect.stringContaining('"sm"'));
  });

  test('lg > xl is an order violation', () => {
    const theme = createTheme({
      overrides: {
        core: { motion: { duration: { lg: '600ms', xl: '500ms' } } },
      },
    });
    const result = validateMotion(theme);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(expect.stringContaining('"lg"'));
    expect(result.errors).toContainEqual(expect.stringContaining('"xl"'));
  });

  test('multiple ordering errors are all reported', () => {
    const theme = createTheme({
      overrides: {
        core: {
          motion: {
            duration: { none: '100ms', xs: '50ms', sm: '300ms', md: '200ms' },
          },
        },
      },
    });
    const result = validateMotion(theme);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Warnings — adjacent duplicates
// ---------------------------------------------------------------------------

describe('validateMotion — warnings: adjacent duplicates', () => {
  test('none === xs produces warning', () => {
    const theme = createTheme({
      overrides: {
        core: { motion: { duration: { none: '50ms', xs: '50ms' } } },
      },
    });
    const result = validateMotion(theme);
    expect(result.valid).toBe(true); // not an error
    expect(result.warnings).toContainEqual(expect.stringContaining('"none"'));
    expect(result.warnings).toContainEqual(expect.stringContaining('"xs"'));
  });

  test('sm === md produces warning', () => {
    const theme = createTheme({
      overrides: {
        core: { motion: { duration: { sm: '200ms', md: '200ms' } } },
      },
    });
    const result = validateMotion(theme);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContainEqual(expect.stringContaining('"sm"'));
  });
});

// ---------------------------------------------------------------------------
// Non-ms duration values — ordering check is skipped
// ---------------------------------------------------------------------------

describe('validateMotion — non-ms duration values', () => {
  test('non-ms value for "none" skips the none→xs ordering check', () => {
    const theme = createTheme({
      overrides: {
        // 'inherit' is not a valid ms string — parseDurationMs returns null
        core: { motion: { duration: { none: 'inherit' } } },
      },
    });
    const result = validateMotion(theme);
    // No error because the pair check is skipped when msA is null
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('non-ms value for "xl" skips the lg→xl ordering check', () => {
    const theme = createTheme({
      overrides: {
        core: { motion: { duration: { xl: 'auto' } } },
      },
    });
    const result = validateMotion(theme);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Warnings — semantic contract collapse (non-static theme)
// ---------------------------------------------------------------------------

describe('validateMotion — warnings: semantic contracts', () => {
  test('transition.enter and transition.exit same easing produces warning', () => {
    const theme = createTheme({
      overrides: {
        semantic: {
          motion: {
            transition: {
              enter: {
                duration: '{core.motion.duration.md}',
                easing: '{core.motion.easing.standard}', // same as exit
              },
              exit: {
                duration: '{core.motion.duration.sm}',
                easing: '{core.motion.easing.standard}', // same as enter
              },
            },
          },
        },
      },
    });
    const result = validateMotion(theme);
    expect(result.warnings).toContainEqual(
      expect.stringContaining('motion.transition.enter')
    );
    expect(result.warnings).toContainEqual(
      expect.stringContaining('motion.transition.exit')
    );
  });

  test('feedback === transition.enter contract produces warning', () => {
    const theme = createTheme({
      overrides: {
        semantic: {
          motion: {
            feedback: {
              duration: '{core.motion.duration.md}',
              easing: '{core.motion.easing.enter}',
            },
          },
        },
      },
    });
    const result = validateMotion(theme);
    expect(result.warnings).toContainEqual(
      expect.stringContaining('motion.feedback')
    );
  });

  test('emphasis === transition.enter contract produces warning', () => {
    const theme = createTheme({
      overrides: {
        semantic: {
          motion: {
            emphasis: {
              duration: '{core.motion.duration.md}',
              easing: '{core.motion.easing.enter}',
            },
          },
        },
      },
    });
    const result = validateMotion(theme);
    expect(result.warnings).toContainEqual(
      expect.stringContaining('motion.emphasis')
    );
  });
});

// ---------------------------------------------------------------------------
// Static theme — no semantic warnings
// ---------------------------------------------------------------------------

describe('validateMotion — static theme profile', () => {
  test('static theme produces no errors and no semantic warnings', () => {
    const staticTheme = createTheme({
      overrides: {
        semantic: {
          motion: {
            feedback: {
              duration: '{core.motion.duration.none}',
              easing: '{core.motion.easing.standard}',
            },
            transition: {
              enter: {
                duration: '{core.motion.duration.none}',
                easing: '{core.motion.easing.enter}',
              },
              exit: {
                duration: '{core.motion.duration.none}',
                easing: '{core.motion.easing.exit}',
              },
            },
            emphasis: {
              duration: '{core.motion.duration.none}',
              easing: '{core.motion.easing.standard}',
            },
            decorative: {
              duration: '{core.motion.duration.none}',
              easing: '{core.motion.easing.linear}',
            },
          },
        },
      },
    });
    const result = validateMotion(staticTheme);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    // No semantic contract warnings for static themes
    expect(
      result.warnings.some((w) => {
        return w.includes('non-static theme');
      })
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// All built-in themes pass validation
// ---------------------------------------------------------------------------

describe('validateMotion — built-in themes', () => {
  const { themes } = require('../../../../src');
  const themeNames = Object.keys(themes) as string[];

  test.each(themeNames)('themes.%s passes validateMotion', (name) => {
    const result = validateMotion(themes[name]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
