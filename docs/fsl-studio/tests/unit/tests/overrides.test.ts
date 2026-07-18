import {
  buildBundle,
  generateThemeCode,
  hasOverrides,
  listColorLeaves,
  presetBundle,
  removeColorLeaf,
  setColorLeaf,
} from 'src/studio/theme/overrides';

describe('color leaf mutation', () => {
  test('setColorLeaf adds a leaf immutably', () => {
    const a = {};
    const b = setColorLeaf(a, 'brand', '500', '#ff0000');
    expect(a).toEqual({});
    expect(b).toEqual({ brand: { 500: '#ff0000' } });
  });

  test('setColorLeaf merges into an existing hue', () => {
    const a = { brand: { 500: '#ff0000' } };
    const b = setColorLeaf(a, 'brand', '600', '#cc0000');
    expect(b).toEqual({ brand: { 500: '#ff0000', 600: '#cc0000' } });
  });

  test('removeColorLeaf prunes an emptied hue', () => {
    const a = { brand: { 500: '#ff0000' } };
    expect(removeColorLeaf(a, 'brand', '500')).toEqual({});
  });

  test('removeColorLeaf keeps sibling steps', () => {
    const a = { brand: { 500: '#ff0000', 600: '#cc0000' } };
    expect(removeColorLeaf(a, 'brand', '500')).toEqual({
      brand: { 600: '#cc0000' },
    });
  });

  test('removeColorLeaf is a no-op for an absent leaf', () => {
    const a = { brand: { 500: '#ff0000' } };
    expect(removeColorLeaf(a, 'neutral', '0')).toBe(a);
    expect(removeColorLeaf(a, 'brand', '900')).toBe(a);
  });

  test('listColorLeaves returns a sorted flat list', () => {
    const a = { neutral: { 900: '#000', 0: '#fff' }, brand: { 500: '#f00' } };
    expect(listColorLeaves(a)).toEqual([
      { hue: 'brand', step: '500' },
      { hue: 'neutral', step: '0' },
      { hue: 'neutral', step: '900' },
    ]);
  });

  test('hasOverrides reflects presence', () => {
    expect(hasOverrides({})).toBe(false);
    expect(hasOverrides({ brand: { 500: '#f00' } })).toBe(true);
  });
});

describe('buildBundle', () => {
  test('base preset applies overrides to core colors', () => {
    const bundle = buildBundle('base', { brand: { 500: '#ff0000' } });
    expect(bundle.base.core.colors.brand[500]).toBe('#ff0000');
    // A dark alternate is present for the base preset.
    expect(bundle.alternate).toBeDefined();
  });

  test('bruttal preset extends the built-in bundle', () => {
    const bundle = buildBundle('bruttal', {});
    expect(bundle.base.core.colors.brand).toBeDefined();
  });
});

describe('presetBundle', () => {
  test('returns distinct bundles per preset', () => {
    expect(presetBundle('base').base.core.colors.brand[500]).toBeDefined();
    expect(presetBundle('bruttal').base.core.colors.brand[500]).toBeDefined();
  });
});

describe('generateThemeCode', () => {
  test('base preset snippet has no extends and embeds the diff', () => {
    const code = generateThemeCode('base', { brand: { 500: '#ff0000' } });
    expect(code).toContain("import { createTheme } from '@ttoss/fsl-theme'");
    expect(code).not.toContain('extends');
    expect(code).toContain('"brand"');
    expect(code).toContain('"#ff0000"');
    expect(code).toContain('createTheme({');
  });

  test('bruttal preset snippet imports and extends bruttal', () => {
    const code = generateThemeCode('bruttal', { brand: { 500: '#ff0000' } });
    expect(code).toContain(
      "import { bruttal, createTheme } from '@ttoss/fsl-theme'"
    );
    expect(code).toContain('extends: bruttal');
  });
});
