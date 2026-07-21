import { createTheme } from '@ttoss/fsl-theme';
import { toFlatTokens } from '@ttoss/fsl-theme/css';
import {
  coreFamilies,
  findBrokenRefs,
  flattenLeaves,
  SEMANTIC_FAMILIES,
  semanticFamilies,
} from 'src/studio/theme/tokenTree';

const bundle = createTheme();

describe('flattenLeaves', () => {
  test('flattens nested objects into sorted raw leaves', () => {
    expect(
      flattenLeaves({ b: { y: '2px', x: 1 }, a: '{core.radii.sm}' }, 'root')
    ).toEqual([
      { path: 'root.a', raw: '{core.radii.sm}' },
      { path: 'root.b.x', raw: '1' },
      { path: 'root.b.y', raw: '2px' },
    ]);
  });

  test('skips undefined values', () => {
    expect(flattenLeaves({ a: undefined, b: 'x' }, 'root')).toEqual([
      { path: 'root.b', raw: 'x' },
    ]);
  });
});

describe('semanticFamilies', () => {
  const families = semanticFamilies(bundle);

  test('returns families in the canonical PRD F2.1 order', () => {
    const names = families.map((family) => {
      return family.family;
    });
    // Every returned family is in the canonical list, in order.
    const canonical = SEMANTIC_FAMILIES.filter((name) => {
      return names.includes(name);
    });
    expect(names).toEqual(canonical);
    expect(names).toContain('colors');
    expect(names).toContain('radii');
    expect(names).not.toContain('dataviz');
  });

  test('groups semantic colors by ux context', () => {
    const colors = families.find((family) => {
      return family.family === 'colors';
    });
    const labels = colors?.groups.map((group) => {
      return group.label;
    });
    expect(labels).toEqual(
      expect.arrayContaining(['action', 'input', 'navigation', 'feedback'])
    );
    // Grouped leaf counts add up to the family count.
    const total = colors?.groups.reduce((sum, group) => {
      return sum + group.leaves.length;
    }, 0);
    expect(total).toBe(colors?.leafCount);
  });

  test('non-color families are one flat group with raw refs', () => {
    const radii = families.find((family) => {
      return family.family === 'radii';
    });
    expect(radii?.groups).toHaveLength(1);
    expect(radii?.groups[0].label).toBe('');
    const control = radii?.groups[0].leaves.find((leaf) => {
      return leaf.path === 'semantic.radii.control';
    });
    expect(control?.raw).toMatch(/^\{core\.radii\./);
  });
});

describe('coreFamilies', () => {
  const families = coreFamilies(bundle);

  test('excludes colors (picker-editor surface) and dataviz', () => {
    const names = families.map((family) => {
      return family.family;
    });
    expect(names).not.toContain('colors');
    expect(names).not.toContain('dataviz');
    expect(names).toEqual(expect.arrayContaining(['radii', 'spacing']));
  });

  test('exposes raw core values', () => {
    const radii = families.find((family) => {
      return family.family === 'radii';
    });
    const md = radii?.groups[0].leaves.find((leaf) => {
      return leaf.path === 'core.radii.md';
    });
    expect(md?.raw).toBe('8px');
  });
});

describe('findBrokenRefs', () => {
  test('the base theme resolves without broken refs', () => {
    expect(findBrokenRefs(toFlatTokens(bundle.base))).toEqual([]);
  });

  test('detects unresolved refs left in the flat map', () => {
    expect(
      findBrokenRefs({
        good: '#fff',
        numeric: 1,
        broken: '{core.colors.nope.500}',
        compound: 'clamp({core.spacing.missing}, 1px, 2px)',
      })
    ).toEqual(['broken', 'compound']);
  });
});
