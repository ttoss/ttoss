import { toFlatTokens } from '@ttoss/fsl-theme/css';
import { findPreset, presetBundle, PRESETS } from 'src/studio/theme/presets';

describe('preset catalog', () => {
  test('ships only the built-in themes @ttoss/fsl-theme actually exports', () => {
    const ids = PRESETS.map((preset) => {
      return preset.id;
    });
    // base (createTheme()) + bruttal — no style-reference presets: a style
    // reference is not a built-in theme (see presets.ts history note).
    expect(ids).toEqual(['base', 'bruttal']);
  });

  test('findPreset resolves built-in ids and rejects everything else', () => {
    expect(findPreset('base')?.label).toBe('Base');
    expect(findPreset('bruttal')?.label).toBe('Bruttal');
    // Removed style-reference ids must not resolve as themes.
    expect(findPreset('glass')).toBeUndefined();
    expect(findPreset('vaporwave')).toBeUndefined();
  });
});

describe('preset bundles', () => {
  test.each(
    PRESETS.map((preset) => {
      return [preset.id] as const;
    })
  )('%s builds, resolves cleanly, and keeps a dark alternate', (id) => {
    const bundle = presetBundle(id);
    // strict: throws on any unresolved ref.
    expect(() => {
      return toFlatTokens(bundle.base, { strict: true });
    }).not.toThrow();
    expect(bundle.alternate).toBeDefined();
  });

  test('bundles are cached per preset', () => {
    expect(presetBundle('bruttal')).toBe(presetBundle('bruttal'));
  });

  test('bruttal carries its brutalist token-layer signature', () => {
    const bundle = presetBundle('bruttal');
    expect(bundle.base.semantic.radii.control).toBe('{core.radii.none}');
  });
});
