import { baseBundle } from '../../../../../src/baseBundle';
import { baseTheme as defaultTheme } from '../../../../../src/baseTheme';
import type { DTCGToken, DTCGTokenTree } from '../../../../../src/roots/toDTCG';
import { toDTCG } from '../../../../../src/roots/toDTCG';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect every leaf node ($value + $type) from a DTCG tree. */
const collectLeaves = (
  tree: DTCGTokenTree,
  path = ''
): { path: string; token: DTCGToken }[] => {
  if ('$value' in tree && '$type' in tree) {
    return [{ path, token: tree as DTCGToken }];
  }

  const entries = Object.entries(tree as Record<string, DTCGTokenTree>);
  return entries.flatMap(([key, child]) => {
    return collectLeaves(child, path ? `${path}.${key}` : key);
  });
};

// ---------------------------------------------------------------------------
// Root 3 — W3C Design Tokens (DTCG)
// ---------------------------------------------------------------------------

describe('toDTCG', () => {
  const tree = toDTCG(defaultTheme);
  const leaves = collectLeaves(tree);

  test('every leaf has $value and $type', () => {
    for (const { path, token } of leaves) {
      expect(token).toHaveProperty('$value');
      expect(token).toHaveProperty('$type');
      expect(typeof token.$type).toBe('string');
      // $value must be string or number
      expect(['string', 'number']).toContain(typeof token.$value);
      // Ensure path is not empty (sanity)
      expect(path.length).toBeGreaterThan(0);
    }
  });

  test('infers correct $type for core color tokens', () => {
    const token = collectLeaves(toDTCG(defaultTheme)).find((l) => {
      return l.path === 'core.colors.brand.500';
    })?.token;
    expect(token?.$type).toBe('color');
  });

  test('infers correct $type for dimension tokens', () => {
    const token = collectLeaves(toDTCG(defaultTheme)).find((l) => {
      return l.path === 'core.spacing.2';
    })?.token;
    expect(token?.$type).toBe('dimension');
  });

  test('infers correct $type for shadow tokens', () => {
    const token = collectLeaves(toDTCG(defaultTheme)).find((l) => {
      return l.path === 'core.elevation.level.0';
    })?.token;
    expect(token?.$type).toBe('shadow');
  });

  test('infers correct $type for number tokens', () => {
    const token = collectLeaves(toDTCG(defaultTheme)).find((l) => {
      return l.path === 'core.opacity.100';
    })?.token;
    expect(token?.$type).toBe('number');
    expect(typeof token?.$value).toBe('number');
  });

  test('infers correct $type for motion easing (string, not cubicBezier)', () => {
    const token = collectLeaves(toDTCG(defaultTheme)).find((l) => {
      return l.path === 'core.motion.easing.standard';
    })?.token;
    expect(token?.$type).toBe('string');
  });

  test('infers correct $type for core motion duration (duration, not string)', () => {
    const token = collectLeaves(toDTCG(defaultTheme)).find((l) => {
      return l.path === 'core.motion.duration.md';
    })?.token;
    expect(token?.$type).toBe('duration');
  });

  test('infers correct $type for semantic motion duration (duration, not string)', () => {
    const SEMANTIC_DURATION_PATHS = [
      'semantic.motion.feedback.duration',
      'semantic.motion.transition.enter.duration',
      'semantic.motion.transition.exit.duration',
      'semantic.motion.emphasis.duration',
      'semantic.motion.decorative.duration',
    ];
    const allLeaves = collectLeaves(toDTCG(defaultTheme));
    for (const expectedPath of SEMANTIC_DURATION_PATHS) {
      const token = allLeaves.find((l) => {
        return l.path === expectedPath;
      })?.token;
      expect(token?.$type).toBe('duration');
    }
  });

  test('semantic motion easing retains $type string', () => {
    const token = collectLeaves(toDTCG(defaultTheme)).find((l) => {
      return l.path === 'semantic.motion.feedback.easing';
    })?.token;
    expect(token?.$type).toBe('string');
  });

  test('values are fully resolved — no {ref} strings in $value', () => {
    for (const { token } of leaves) {
      if (typeof token.$value === 'string') {
        expect(token.$value).not.toMatch(/^\{.+\}$/);
      }
    }
  });

  test('tree structure matches token path segments', () => {
    // core.colors.brand.500 → tree has a leaf at that path with $value and $type
    const node = collectLeaves(tree).find((l) => {
      return l.path === 'core.colors.brand.500';
    });
    expect(node).toBeDefined();
    expect(node?.token.$value).toBeDefined();
    expect(node?.token.$type).toBe('color');
  });

  test('infers correct $type for semantic text fontFamily (fontFamily, not string)', () => {
    const allLeaves = collectLeaves(toDTCG(defaultTheme));
    const token = allLeaves.find((l) => {
      return l.path === 'semantic.text.body.md.fontFamily';
    })?.token;
    expect(token?.$type).toBe('fontFamily');
  });

  test('infers correct $type for semantic text fontSize (dimension, not string)', () => {
    const allLeaves = collectLeaves(toDTCG(defaultTheme));
    for (const family of [
      'display',
      'headline',
      'title',
      'body',
      'label',
      'code',
    ]) {
      const step = family === 'code' ? 'md' : 'lg';
      const token = allLeaves.find((l) => {
        return l.path === `semantic.text.${family}.${step}.fontSize`;
      })?.token;
      expect(token?.$type).toBe('dimension');
    }
  });

  test('infers correct $type for semantic text fontWeight (fontWeight, not string)', () => {
    const allLeaves = collectLeaves(toDTCG(defaultTheme));
    const token = allLeaves.find((l) => {
      return l.path === 'semantic.text.body.md.fontWeight';
    })?.token;
    expect(token?.$type).toBe('fontWeight');
  });

  test('infers correct $type for semantic text lineHeight (number, not string)', () => {
    const allLeaves = collectLeaves(toDTCG(defaultTheme));
    const token = allLeaves.find((l) => {
      return l.path === 'semantic.text.body.md.lineHeight';
    })?.token;
    expect(token?.$type).toBe('number');
  });

  test('infers correct $type for semantic text letterSpacing (dimension, not string)', () => {
    const allLeaves = collectLeaves(toDTCG(defaultTheme));
    const token = allLeaves.find((l) => {
      return l.path === 'semantic.text.label.sm.letterSpacing';
    })?.token;
    expect(token?.$type).toBe('dimension');
  });

  test('suffix overrides do not affect core font primitive tokens', () => {
    // Core font weight primitives must retain 'fontWeight' (from registry prefix, not suffix)
    const allLeaves = collectLeaves(toDTCG(defaultTheme));
    const weightToken = allLeaves.find((l) => {
      return l.path === 'core.font.weight.bold';
    })?.token;
    expect(weightToken?.$type).toBe('fontWeight');

    // Core font leading primitives must retain 'number'
    const leadingToken = allLeaves.find((l) => {
      return l.path === 'core.font.leading.normal';
    })?.token;
    expect(leadingToken?.$type).toBe('number');

    // Core font tracking primitives must retain 'dimension'
    const trackingToken = allLeaves.find((l) => {
      return l.path === 'core.font.tracking.tight';
    })?.token;
    expect(trackingToken?.$type).toBe('dimension');
  });

  test('all built-in themes produce valid DTCG trees', () => {
    {
      const dtcgTree = toDTCG(baseBundle.base);
      const dtcgLeaves = collectLeaves(dtcgTree);

      expect(dtcgLeaves.length).toBeGreaterThan(50);

      for (const { token } of dtcgLeaves) {
        expect(token).toHaveProperty('$value');
        expect(token).toHaveProperty('$type');
      }
    }
  });
});
