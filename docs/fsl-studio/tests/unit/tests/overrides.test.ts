import {
  buildBundle,
  generateThemeCode,
  hasOverrides,
  listTokenPaths,
  mergeDeep,
  nestOverrides,
  removeToken,
  setToken,
} from 'src/studio/theme/overrides';

describe('token leaf mutation', () => {
  test('setToken adds a leaf immutably', () => {
    const a = {};
    const b = setToken(a, 'core.colors.brand.500', '#ff0000');
    expect(a).toEqual({});
    expect(b).toEqual({ 'core.colors.brand.500': '#ff0000' });
  });

  test('removeToken removes a leaf and is a no-op for an absent one', () => {
    const a = { 'core.colors.brand.500': '#ff0000' };
    expect(removeToken(a, 'core.colors.brand.500')).toEqual({});
    expect(removeToken(a, 'core.colors.brand.900')).toBe(a);
  });

  test('listTokenPaths returns a sorted list', () => {
    const a = {
      'semantic.radii.control': '{core.radii.none}',
      'core.colors.brand.500': '#f00',
    };
    expect(listTokenPaths(a)).toEqual([
      'core.colors.brand.500',
      'semantic.radii.control',
    ]);
  });

  test('hasOverrides reflects presence', () => {
    expect(hasOverrides({})).toBe(false);
    expect(hasOverrides({ 'core.colors.brand.500': '#f00' })).toBe(true);
  });
});

describe('nestOverrides', () => {
  test('unflattens dotted paths into nested objects', () => {
    expect(
      nestOverrides({
        'core.colors.brand.500': '#ff0000',
        'core.colors.brand.600': '#cc0000',
        'semantic.radii.control': '{core.radii.none}',
      })
    ).toEqual({
      core: { colors: { brand: { 500: '#ff0000', 600: '#cc0000' } } },
      semantic: { radii: { control: '{core.radii.none}' } },
    });
  });

  test('keeps deeper structure on a prefix collision (foreign payloads)', () => {
    // 'core.colors' (a non-leaf path) collides with a deeper leaf; the deeper
    // structure wins regardless of insertion order.
    expect(
      nestOverrides({
        'core.colors': 'garbage',
        'core.colors.brand.500': '#ff0000',
      })
    ).toEqual({ core: { colors: { brand: { 500: '#ff0000' } } } });
  });
});

describe('mergeDeep', () => {
  test('merges nested objects with b winning on leaves', () => {
    expect(
      mergeDeep({ a: { x: 1, y: 2 }, keep: 'me' }, { a: { y: 3 }, extra: true })
    ).toEqual({ a: { x: 1, y: 3 }, keep: 'me', extra: true });
  });

  test('replaces a non-object with an object and vice versa', () => {
    expect(mergeDeep({ a: 1 }, { a: { b: 2 } })).toEqual({ a: { b: 2 } });
    expect(mergeDeep({ a: { b: 2 } }, { a: 1 })).toEqual({ a: 1 });
  });
});

describe('buildBundle', () => {
  test('base preset applies overrides to core colors', () => {
    const bundle = buildBundle('base', { 'core.colors.brand.500': '#ff0000' });
    expect(bundle.base.core.colors.brand[500]).toBe('#ff0000');
    // A dark alternate is present for the base preset.
    expect(bundle.alternate).toBeDefined();
  });

  test('bruttal preset extends the built-in bundle', () => {
    const bundle = buildBundle('bruttal', {});
    expect(bundle.base.core.colors.brand[500]).toBe('#6D5D4F');
  });

  test('semantic remap overrides land in the built theme', () => {
    const bundle = buildBundle('base', {
      'semantic.radii.control': '{core.radii.none}',
    });
    expect(bundle.base.semantic.radii.control).toBe('{core.radii.none}');
  });
});

describe('generateThemeCode', () => {
  test('base preset snippet has no extends and embeds the diff', () => {
    const code = generateThemeCode('base', {
      'core.colors.brand.500': '#ff0000',
    });
    expect(code).toContain("import { createTheme } from '@ttoss/fsl-theme'");
    expect(code).not.toContain('extends');
    expect(code).toContain('"brand"');
    expect(code).toContain('"#ff0000"');
    expect(code).toContain('createTheme({');
  });

  test('bruttal preset snippet imports and extends bruttal', () => {
    const code = generateThemeCode('bruttal', {
      'core.colors.brand.500': '#ff0000',
    });
    expect(code).toContain(
      "import { bruttal, createTheme } from '@ttoss/fsl-theme'"
    );
    expect(code).toContain('extends: bruttal');
  });

  test('authored preset snippet inlines its overrides, diff winning', () => {
    const code = generateThemeCode('neobrutalism', {
      'core.colors.brand.500': '#ff0000',
    });
    // Runnable anywhere: no Studio-only imports, preset payload inlined.
    expect(code).toContain("import { createTheme } from '@ttoss/fsl-theme'");
    expect(code).not.toContain('extends');
    // Preset signature carried over…
    expect(code).toContain('{core.radii.none}');
    // …and the user's diff wins on the collided leaf.
    expect(code).toContain('"#ff0000"');
    expect(code).not.toContain('#6d28d9');
  });
});
