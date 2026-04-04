/**
 * Borders family validation tests.
 *
 * @see /docs/website/docs/design/01-design-system/02-design-tokens/02-families/borders.md#validation
 */

import { themeAltFlatToTest, themeFlatToTest } from '../../../helpers/theme';

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

describe('Semantic borders — errors', () => {
  describe('default', () => {
    const base = themeFlatToTest;
    const alt = themeAltFlatToTest;

    // Error #1: border.selected must not be weaker than border.outline.*
    test('base: selected.width >= outline.surface.width', () => {
      const [selected, outline] = parseWidthPair(
        base,
        'semantic.border.selected.width',
        'semantic.border.outline.surface.width'
      );

      expect(selected).toBeGreaterThanOrEqual(outline);
    });

    // Error #1
    test('base: selected.width >= outline.control.width', () => {
      const [selected, outline] = parseWidthPair(
        base,
        'semantic.border.selected.width',
        'semantic.border.outline.control.width'
      );

      expect(selected).toBeGreaterThanOrEqual(outline);
    });

    // Error #2: focus.ring must not be weaker than border.outline.*
    test('base: focus.ring.width >= outline.surface.width', () => {
      const [focus, outline] = parseWidthPair(
        base,
        'semantic.focus.ring.width',
        'semantic.border.outline.surface.width'
      );

      expect(focus).toBeGreaterThanOrEqual(outline);
    });

    // Error #2
    test('base: focus.ring.width >= outline.control.width', () => {
      const [focus, outline] = parseWidthPair(
        base,
        'semantic.focus.ring.width',
        'semantic.border.outline.control.width'
      );

      expect(focus).toBeGreaterThanOrEqual(outline);
    });

    // Error #3: border.selected must resolve to a visible (non-zero) line
    test('base: selected.width is not none/0', () => {
      const selected = parseCssLength(base['semantic.border.selected.width']!);

      expect(selected).toBeGreaterThan(0);
    });

    // Error #4: focus.ring must resolve to a visible (non-zero) line
    test('base: focus.ring.width is not none/0', () => {
      const focus = parseCssLength(base['semantic.focus.ring.width']!);

      expect(focus).toBeGreaterThan(0);
    });

    // Error #5: focus.ring must not collapse into the same effective line contract as border.outline.*
    test('base: focus.ring.width > outline.surface.width (not collapsed)', () => {
      const [focus, outline] = parseWidthPair(
        base,
        'semantic.focus.ring.width',
        'semantic.border.outline.surface.width'
      );

      expect(focus).toBeGreaterThan(outline);
    });

    // Error #5
    test('base: focus.ring.width > outline.control.width (not collapsed)', () => {
      const [focus, outline] = parseWidthPair(
        base,
        'semantic.focus.ring.width',
        'semantic.border.outline.control.width'
      );

      expect(focus).toBeGreaterThan(outline);
    });

    // Error #1
    test('alternate: selected.width >= outline.surface.width', () => {
      if (!alt) return;

      const [selected, outline] = parseWidthPair(
        alt,
        'semantic.border.selected.width',
        'semantic.border.outline.surface.width'
      );

      expect(selected).toBeGreaterThanOrEqual(outline);
    });

    // Error #1
    test('alternate: selected.width >= outline.control.width', () => {
      if (!alt) return;

      const [selected, outline] = parseWidthPair(
        alt,
        'semantic.border.selected.width',
        'semantic.border.outline.control.width'
      );

      expect(selected).toBeGreaterThanOrEqual(outline);
    });

    // Error #2
    test('alternate: focus.ring.width >= outline.surface.width', () => {
      if (!alt) return;

      const [focus, outline] = parseWidthPair(
        alt,
        'semantic.focus.ring.width',
        'semantic.border.outline.surface.width'
      );

      expect(focus).toBeGreaterThanOrEqual(outline);
    });

    // Error #2
    test('alternate: focus.ring.width >= outline.control.width', () => {
      if (!alt) return;

      const [focus, outline] = parseWidthPair(
        alt,
        'semantic.focus.ring.width',
        'semantic.border.outline.control.width'
      );

      expect(focus).toBeGreaterThanOrEqual(outline);
    });

    // Error #3
    test('alternate: selected.width is not none/0', () => {
      if (!alt) return;

      const selected = parseCssLength(alt['semantic.border.selected.width']!);

      expect(selected).toBeGreaterThan(0);
    });

    // Error #4
    test('alternate: focus.ring.width is not none/0', () => {
      if (!alt) return;

      const focus = parseCssLength(alt['semantic.focus.ring.width']!);

      expect(focus).toBeGreaterThan(0);
    });

    // Error #5
    test('alternate: focus.ring.width > outline.surface.width (not collapsed)', () => {
      if (!alt) return;

      const [focus, outline] = parseWidthPair(
        alt,
        'semantic.focus.ring.width',
        'semantic.border.outline.surface.width'
      );

      expect(focus).toBeGreaterThan(outline);
    });

    // Error #5
    test('alternate: focus.ring.width > outline.control.width (not collapsed)', () => {
      if (!alt) return;

      const [focus, outline] = parseWidthPair(
        alt,
        'semantic.focus.ring.width',
        'semantic.border.outline.control.width'
      );

      expect(focus).toBeGreaterThan(outline);
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic borders — WARNINGS
// ---------------------------------------------------------------------------
// Warning #1: border.selected resolves to the same effective contract as the resting outline
// Warning #2: focus.ring resolves to the same effective contract as the resting outline
//
// Strict inequality (>) ensures selected and focus.ring are visually distinguishable
// from their resting outlines. If a theme intentionally sets equal widths, these tests
// will fail — the designer must consciously accept and document the trade-off.
// ---------------------------------------------------------------------------

describe('Semantic borders — warnings', () => {
  describe('default', () => {
    const base = themeFlatToTest;
    const alt = themeAltFlatToTest;

    // Warning #1: border.selected must be visually distinguishable from the resting outline
    test('base: selected.width > outline.surface.width (distinguishable)', () => {
      const [selected, outline] = parseWidthPair(
        base,
        'semantic.border.selected.width',
        'semantic.border.outline.surface.width'
      );

      expect(selected).toBeGreaterThan(outline);
    });

    // Warning #1
    test('base: selected.width > outline.control.width (distinguishable)', () => {
      const [selected, outline] = parseWidthPair(
        base,
        'semantic.border.selected.width',
        'semantic.border.outline.control.width'
      );

      expect(selected).toBeGreaterThan(outline);
    });

    // Warning #2: focus.ring must be visually distinguishable from the resting outline
    test('base: focus.ring.width > outline.surface.width (distinguishable)', () => {
      const [focus, outline] = parseWidthPair(
        base,
        'semantic.focus.ring.width',
        'semantic.border.outline.surface.width'
      );

      expect(focus).toBeGreaterThan(outline);
    });

    // Warning #2
    test('base: focus.ring.width > outline.control.width (distinguishable)', () => {
      const [focus, outline] = parseWidthPair(
        base,
        'semantic.focus.ring.width',
        'semantic.border.outline.control.width'
      );

      expect(focus).toBeGreaterThan(outline);
    });

    // Warning #1
    test('alternate: selected.width > outline.surface.width (distinguishable)', () => {
      if (!alt) return;

      const [selected, outline] = parseWidthPair(
        alt,
        'semantic.border.selected.width',
        'semantic.border.outline.surface.width'
      );

      expect(selected).toBeGreaterThan(outline);
    });

    // Warning #1
    test('alternate: selected.width > outline.control.width (distinguishable)', () => {
      if (!alt) return;

      const [selected, outline] = parseWidthPair(
        alt,
        'semantic.border.selected.width',
        'semantic.border.outline.control.width'
      );

      expect(selected).toBeGreaterThan(outline);
    });

    // Warning #2
    test('alternate: focus.ring.width > outline.surface.width (distinguishable)', () => {
      if (!alt) return;

      const [focus, outline] = parseWidthPair(
        alt,
        'semantic.focus.ring.width',
        'semantic.border.outline.surface.width'
      );

      expect(focus).toBeGreaterThan(outline);
    });

    // Warning #2
    test('alternate: focus.ring.width > outline.control.width (distinguishable)', () => {
      if (!alt) return;

      const [focus, outline] = parseWidthPair(
        alt,
        'semantic.focus.ring.width',
        'semantic.border.outline.control.width'
      );

      expect(focus).toBeGreaterThan(outline);
    });
  });
});
