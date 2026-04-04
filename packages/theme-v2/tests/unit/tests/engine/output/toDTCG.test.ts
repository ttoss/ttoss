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
      return l.path === 'core.space.2';
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
