import {
  extractRefPath,
  flattenObject,
  isTokenRef,
  toChakraRef,
  toCssVarName,
  toCssVarRef,
  wrapAndTransformRefs,
  wrapValues,
} from '../../../src/adapters/helpers';

// ---------------------------------------------------------------------------
// Token reference detection
// ---------------------------------------------------------------------------

describe('isTokenRef', () => {
  test('recognizes valid token refs', () => {
    expect(isTokenRef('{core.colors.brand.main}')).toBe(true);
    expect(isTokenRef('{semantic.spacing.gap.stack.xs}')).toBe(true);
  });

  test('rejects non-refs', () => {
    expect(isTokenRef('#FF0000')).toBe(false);
    expect(isTokenRef('8px')).toBe(false);
    expect(isTokenRef(42)).toBe(false);
    expect(isTokenRef(null)).toBe(false);
    expect(isTokenRef(undefined)).toBe(false);
    expect(isTokenRef('')).toBe(false);
    expect(isTokenRef('{}')).toBe(false);
  });
});

describe('extractRefPath', () => {
  test('strips braces from ref', () => {
    expect(extractRefPath('{core.colors.brand.main}')).toBe(
      'core.colors.brand.main'
    );
  });
});

// ---------------------------------------------------------------------------
// Chakra reference transformation
// ---------------------------------------------------------------------------

describe('toChakraRef', () => {
  test('transforms core.colors ref', () => {
    expect(toChakraRef('{core.colors.brand.accent}')).toBe(
      '{colors.brand.accent}'
    );
  });

  test('transforms core.font.family ref', () => {
    expect(toChakraRef('{core.font.family.sans}')).toBe('{fonts.sans}');
  });

  test('transforms core.font.weight ref', () => {
    expect(toChakraRef('{core.font.weight.bold}')).toBe('{fontWeights.bold}');
  });

  test('transforms core.font.leading ref', () => {
    expect(toChakraRef('{core.font.leading.tight}')).toBe(
      '{lineHeights.tight}'
    );
  });

  test('transforms core.font.tracking ref', () => {
    expect(toChakraRef('{core.font.tracking.normal}')).toBe(
      '{letterSpacings.normal}'
    );
  });

  test('transforms core.elevation.level ref', () => {
    expect(toChakraRef('{core.elevation.level.3}')).toBe('{shadows.3}');
  });

  test('transforms core.type.ramp ref', () => {
    expect(toChakraRef('{core.type.ramp.display.5}')).toBe(
      '{fontSizes.display.5}'
    );
  });

  test('transforms core.space ref', () => {
    expect(toChakraRef('{core.space.2}')).toBe('{spacing.2}');
  });

  test('transforms core.radii ref', () => {
    expect(toChakraRef('{core.radii.md}')).toBe('{radii.md}');
  });

  test('transforms core.borders.width ref', () => {
    expect(toChakraRef('{core.borders.width.hairline}')).toBe(
      '{borderWidths.hairline}'
    );
  });

  test('transforms core.borders.style ref', () => {
    expect(toChakraRef('{core.borders.style.solid}')).toBe(
      '{borderStyles.solid}'
    );
  });

  test('transforms core.motion.duration ref', () => {
    expect(toChakraRef('{core.motion.duration.xs}')).toBe('{durations.xs}');
  });

  test('transforms core.motion.easing ref', () => {
    expect(toChakraRef('{core.motion.easing.standard}')).toBe(
      '{easings.standard}'
    );
  });

  test('transforms core.opacity ref', () => {
    expect(toChakraRef('{core.opacity.50}')).toBe('{opacity.50}');
  });

  test('transforms core.zIndex ref', () => {
    expect(toChakraRef('{core.zIndex.modal}')).toBe('{zIndex.modal}');
  });

  test('transforms semantic self-references', () => {
    expect(toChakraRef('{semantic.spacing.gap.stack.xs}')).toBe(
      '{spacing.gap.stack.xs}'
    );
  });

  test('returns ref as-is when no prefix matches', () => {
    expect(toChakraRef('{unknown.path}')).toBe('{unknown.path}');
  });
});

// ---------------------------------------------------------------------------
// Tailwind CSS variable names
// ---------------------------------------------------------------------------

describe('toCssVarName', () => {
  test('converts core color paths', () => {
    expect(toCssVarName('core.colors.brand.main')).toBe(
      '--tt-color-brand-main'
    );
  });

  test('converts core space paths', () => {
    expect(toCssVarName('core.space.2')).toBe('--tt-space-2');
  });

  test('converts core radii paths', () => {
    expect(toCssVarName('core.radii.md')).toBe('--tt-radii-md');
  });

  test('converts core shadow paths', () => {
    expect(toCssVarName('core.elevation.level.3')).toBe('--tt-shadow-3');
  });

  test('converts core font paths', () => {
    expect(toCssVarName('core.font.family.sans')).toBe('--tt-font-sans');
  });

  test('converts semantic color paths', () => {
    expect(
      toCssVarName('semantic.colors.action.primary.background.default')
    ).toBe('--tt-action-primary-background-default');
  });

  test('converts semantic elevation paths', () => {
    expect(toCssVarName('semantic.elevation.flat')).toBe('--tt-elevation-flat');
  });

  test('converts semantic radii paths (scoped to avoid collision)', () => {
    expect(toCssVarName('semantic.radii.surface')).toBe(
      '--tt-radii-semantic-surface'
    );
  });

  test('falls back to full path for unknown prefixes', () => {
    expect(toCssVarName('unknown.foo.bar')).toBe('--tt-unknown-foo-bar');
  });
});

describe('toCssVarRef', () => {
  test('converts token ref to var() reference', () => {
    expect(toCssVarRef('{core.colors.brand.accent}')).toBe(
      'var(--tt-color-brand-accent)'
    );
  });

  test('converts semantic ref to var() reference', () => {
    expect(toCssVarRef('{core.radii.md}')).toBe('var(--tt-radii-md)');
  });
});

// ---------------------------------------------------------------------------
// Object utilities
// ---------------------------------------------------------------------------

describe('flattenObject', () => {
  test('flattens nested object with dot separator', () => {
    const input = { a: { b: { c: 'value' } }, d: 42 };
    expect(flattenObject(input)).toEqual({ 'a.b.c': 'value', d: 42 });
  });

  test('handles single-level object', () => {
    expect(flattenObject({ x: 'y' })).toEqual({ x: 'y' });
  });

  test('uses prefix', () => {
    expect(flattenObject({ x: 'y' }, 'p')).toEqual({ 'p.x': 'y' });
  });

  test('skips non-string/number values', () => {
    const input = { a: 'ok', b: null, c: undefined, d: [1, 2] };
    expect(flattenObject(input as Record<string, unknown>)).toEqual({
      a: 'ok',
    });
  });
});

describe('wrapValues', () => {
  test('wraps leaf values with { value }', () => {
    const input = { a: 'x', b: { c: 42 } };
    expect(wrapValues(input)).toEqual({
      a: { value: 'x' },
      b: { c: { value: 42 } },
    });
  });
});

describe('wrapAndTransformRefs', () => {
  test('wraps non-ref values normally', () => {
    const input = { a: '8px' };
    expect(wrapAndTransformRefs(input)).toEqual({
      a: { value: '8px' },
    });
  });

  test('transforms token refs and wraps', () => {
    const input = { x: '{core.colors.brand.main}' };
    expect(wrapAndTransformRefs(input)).toEqual({
      x: { value: '{colors.brand.main}' },
    });
  });

  test('handles nested objects with mixed values', () => {
    const input = {
      level1: {
        ref: '{core.radii.md}',
        raw: '10px',
      },
    };
    expect(wrapAndTransformRefs(input)).toEqual({
      level1: {
        ref: { value: '{radii.md}' },
        raw: { value: '10px' },
      },
    });
  });
});
