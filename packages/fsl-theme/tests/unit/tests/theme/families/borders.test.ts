/**
 * Borders family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/borders.md#validation
 */

import { baseTheme } from '../../../../../src/baseTheme';
import { themeFlatToTest } from '../../../fixtures/theme';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const parseCssLength = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const str = String(value).trim();
  if (str === '0' || str === 'none') return 0;
  if (str.endsWith('px')) return parseFloat(str);
  if (str.endsWith('rem')) return parseFloat(str) * 16;
  return NaN;
};

const parseWidthPair = (
  tokens: Record<string, string | number>,
  path1: string,
  path2: string
): [number, number] => {
  const val1 = parseCssLength(tokens[path1]!);
  const val2 = parseCssLength(tokens[path2]!);

  expect(val1).not.toBeNaN();
  expect(val2).not.toBeNaN();

  return [val1, val2];
};

// ---------------------------------------------------------------------------
// Semantic borders — ERRORS
// ---------------------------------------------------------------------------

// Note: semantic.border and semantic.focus are not overridden by darkAlternate
// (which only modifies semantic.colors). Tests run against base tokens only.
describe('Semantic borders — errors', () => {
  const base = themeFlatToTest;

  // Error #1: border.outline.selected must not be weaker than border.outline.*
  test('selected.width >= outline.surface.width', () => {
    const [selected, outline] = parseWidthPair(
      base,
      'semantic.border.outline.selected.width',
      'semantic.border.outline.surface.width'
    );

    expect(selected).toBeGreaterThanOrEqual(outline);
  });

  // Error #1
  test('selected.width >= outline.control.width', () => {
    const [selected, outline] = parseWidthPair(
      base,
      'semantic.border.outline.selected.width',
      'semantic.border.outline.control.width'
    );

    expect(selected).toBeGreaterThanOrEqual(outline);
  });

  // Error #2: focus.ring must not be weaker than border.outline.*
  test('focus.ring.width >= outline.surface.width', () => {
    const [focus, outline] = parseWidthPair(
      base,
      'semantic.focus.ring.width',
      'semantic.border.outline.surface.width'
    );

    expect(focus).toBeGreaterThanOrEqual(outline);
  });

  // Error #2
  test('focus.ring.width >= outline.control.width', () => {
    const [focus, outline] = parseWidthPair(
      base,
      'semantic.focus.ring.width',
      'semantic.border.outline.control.width'
    );

    expect(focus).toBeGreaterThanOrEqual(outline);
  });

  // Error #3: border.outline.selected must resolve to a visible (non-zero) line
  test('selected.width is not none/0', () => {
    const selected = parseCssLength(
      base['semantic.border.outline.selected.width']!
    );

    expect(selected).toBeGreaterThan(0);
  });

  // Error #4: focus.ring must resolve to a visible (non-zero) line
  test('focus.ring.width is not none/0', () => {
    const focus = parseCssLength(base['semantic.focus.ring.width']!);

    expect(focus).toBeGreaterThan(0);
  });

  // Error #5: focus.ring must not collapse into the same effective line contract as border.outline.*
  test('focus.ring.width > outline.surface.width (not collapsed)', () => {
    const [focus, outline] = parseWidthPair(
      base,
      'semantic.focus.ring.width',
      'semantic.border.outline.surface.width'
    );

    expect(focus).toBeGreaterThan(outline);
  });

  // Error #5
  test('focus.ring.width > outline.control.width (not collapsed)', () => {
    const [focus, outline] = parseWidthPair(
      base,
      'semantic.focus.ring.width',
      'semantic.border.outline.control.width'
    );

    expect(focus).toBeGreaterThan(outline);
  });
});

// ---------------------------------------------------------------------------
// Focus ring color contract
//
// focus.ring.color is a required semantic token providing a cross-cutting
// accessible focus color. Every theme must define it. Its resolved value
// must be a non-empty string (a hex color from the core palette).
// ---------------------------------------------------------------------------

describe('Semantic focus — color contract', () => {
  test('focus.ring.color is defined and resolves to a non-empty value', () => {
    const color = themeFlatToTest['semantic.focus.ring.color'];
    expect(color).toBeDefined();
    expect(typeof color).toBe('string');
    expect(String(color).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Semantic borders — WARNINGS
// ---------------------------------------------------------------------------
// Warning #1: border.outline.selected resolves to the same effective contract as the resting outline
// Warning #2: focus.ring resolves to the same effective contract as the resting outline
//
// Strict inequality (>) ensures selected and focus.ring are visually distinguishable
// from their resting outlines. If a theme intentionally sets equal widths, these tests
// will fail — the designer must consciously accept and document the trade-off.
// ---------------------------------------------------------------------------

describe('Semantic borders — warnings', () => {
  const base = themeFlatToTest;

  // Warning #1: border.outline.selected must be visually distinguishable from the resting outline
  test('selected.width > outline.surface.width (distinguishable)', () => {
    const [selected, outline] = parseWidthPair(
      base,
      'semantic.border.outline.selected.width',
      'semantic.border.outline.surface.width'
    );

    expect(selected).toBeGreaterThan(outline);
  });

  // Warning #1
  test('selected.width > outline.control.width (distinguishable)', () => {
    const [selected, outline] = parseWidthPair(
      base,
      'semantic.border.outline.selected.width',
      'semantic.border.outline.control.width'
    );

    expect(selected).toBeGreaterThan(outline);
  });

  // Warning #2: focus.ring must be visually distinguishable from the resting outline
  test('focus.ring.width > outline.surface.width (distinguishable)', () => {
    const [focus, outline] = parseWidthPair(
      base,
      'semantic.focus.ring.width',
      'semantic.border.outline.surface.width'
    );

    expect(focus).toBeGreaterThan(outline);
  });

  // Warning #2
  test('focus.ring.width > outline.control.width (distinguishable)', () => {
    const [focus, outline] = parseWidthPair(
      base,
      'semantic.focus.ring.width',
      'semantic.border.outline.control.width'
    );

    expect(focus).toBeGreaterThan(outline);
  });
});

// ---------------------------------------------------------------------------
// focus.ring.color — must reference a semantic token (not a core token)
// ---------------------------------------------------------------------------

describe('Focus ring color — semantic anchor', () => {
  test('focus.ring.color references a semantic token', () => {
    expect(baseTheme.semantic.focus.ring.color).toMatch(/^\{semantic\./);
  });
});
