import { defaultTheme, themes, toDTCG } from '../../../../src';
import type { DTCGToken, DTCGTokenTree } from '../../../../src/roots/toDTCG';

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
    const dtcg = toDTCG(defaultTheme);
    const brandMain = (dtcg as Record<string, unknown>)['core'] as Record<
      string,
      unknown
    >;
    const colors = brandMain['colors'] as Record<string, unknown>;
    const brand = colors['brand'] as Record<string, unknown>;
    const step500 = brand['500'] as DTCGToken;

    expect(step500.$type).toBe('color');
  });

  test('infers correct $type for dimension tokens', () => {
    const dtcg = toDTCG(defaultTheme);
    // core.space.2 → dimension
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const space2 = (dtcg as any).core.space['2'] as DTCGToken;
    expect(space2.$type).toBe('dimension');
  });

  test('infers correct $type for shadow tokens', () => {
    const dtcg = toDTCG(defaultTheme);
    // core.elevation.level.0 → shadow
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shadow = (dtcg as any).core.elevation.level['0'] as DTCGToken;
    expect(shadow.$type).toBe('shadow');
  });

  test('infers correct $type for number tokens', () => {
    const dtcg = toDTCG(defaultTheme);
    // core.opacity.100 → number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opacity = (dtcg as any).core.opacity['100'] as DTCGToken;
    expect(opacity.$type).toBe('number');
    expect(typeof opacity.$value).toBe('number');
  });

  test('infers correct $type for motion easing (string, not cubicBezier)', () => {
    const dtcg = toDTCG(defaultTheme);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const easing = (dtcg as any).core.motion.easing.standard as DTCGToken;
    expect(easing.$type).toBe('string');
  });

  test('values are fully resolved — no {ref} strings in $value', () => {
    for (const { token } of leaves) {
      if (typeof token.$value === 'string') {
        expect(token.$value).not.toMatch(/^\{.+\}$/);
      }
    }
  });

  test('tree structure matches token path segments', () => {
    // core.colors.brand.500 → tree.core.colors.brand.500
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node = (tree as any).core?.colors?.brand?.['500'];
    expect(node).toBeDefined();
    expect(node.$value).toBeDefined();
    expect(node.$type).toBe('color');
  });

  test('all built-in themes produce valid DTCG trees', () => {
    for (const name of Object.keys(themes) as Array<keyof typeof themes>) {
      const dtcgTree = toDTCG(themes[name]);
      const dtcgLeaves = collectLeaves(dtcgTree);

      expect(dtcgLeaves.length).toBeGreaterThan(50);

      for (const { token } of dtcgLeaves) {
        expect(token).toHaveProperty('$value');
        expect(token).toHaveProperty('$type');
      }
    }
  });

  test('all built-in themes have a substantial number of leaves', () => {
    for (const name of Object.keys(themes) as Array<keyof typeof themes>) {
      const count = collectLeaves(toDTCG(themes[name])).length;
      expect(count).toBeGreaterThan(50);
    }
  });
});
