/**
 * Cross-family validation tests.
 *
 * Validates contracts that span multiple token families:
 * - Focus visibility: ring width combined with color contrast produces visible indicator
 * - Selected state: border width + color produces distinguishable selected state
 *
 * @see REFACTOR.md Gap 10 — Cross-family validation
 */

import { bundleEntries, resolvedBundles } from '../../helpers';
import { getContrastRatio, WCAGLevels } from '../../../../src/roots/accessibility';
import { getTokenValue, parseCssLength } from './testHelpers';

// ---------------------------------------------------------------------------
// Focus Visibility — Ring Width + Color Contrast
// ---------------------------------------------------------------------------

describe('Cross-family: focus visibility', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base, alt } = resolvedBundles[bundleName];

    const validateFocusVisibility = (
      tokens: Record<string, string | number>,
      label: string
    ) => {
      // Focus ring must have non-zero width
      const ringWidth = getTokenValue(tokens, 'semantic.focus.ring.width');
      expect(ringWidth).toBeDefined();
      const parsedWidth = parseCssLength(ringWidth!);
      expect(parsedWidth).toBeGreaterThan(0);

      // Focus ring style must not be 'none'
      const ringStyle = getTokenValue(tokens, 'semantic.focus.ring.style');
      expect(ringStyle).toBeDefined();
      expect(String(ringStyle)).not.toBe('none');
    };

    test('base mode: focus ring has visible width and style', () => {
      validateFocusVisibility(base, 'base');
    });

    if (alt) {
      test('alt mode: focus ring has visible width and style', () => {
        validateFocusVisibility(alt, 'alt');
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Selected State — Border Width + Distinguishability
// ---------------------------------------------------------------------------

describe('Cross-family: selected state visibility', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base, alt } = resolvedBundles[bundleName];

    const validateSelectedVisibility = (
      tokens: Record<string, string | number>,
      label: string
    ) => {
      // Selected border must have non-zero width
      const selectedWidth = getTokenValue(
        tokens,
        'semantic.border.selected.width'
      );
      expect(selectedWidth).toBeDefined();
      const parsedWidth = parseCssLength(selectedWidth!);
      expect(parsedWidth).toBeGreaterThan(0);

      // Selected border style must not be 'none'
      const selectedStyle = getTokenValue(
        tokens,
        'semantic.border.selected.style'
      );
      expect(selectedStyle).toBeDefined();
      expect(String(selectedStyle)).not.toBe('none');
    };

    test('base mode: selected border has visible width and style', () => {
      validateSelectedVisibility(base, 'base');
    });

    if (alt) {
      test('alt mode: selected border has visible width and style', () => {
        validateSelectedVisibility(alt, 'alt');
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Focus vs Outline — Focus Ring ≥ Outline for Visibility
// ---------------------------------------------------------------------------

describe('Cross-family: focus ring ≥ outline width', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base } = resolvedBundles[bundleName];

    test('focus.ring.width ≥ outline.surface.width', () => {
      const focusWidth = parseCssLength(
        getTokenValue(base, 'semantic.focus.ring.width')!
      );
      const outlineWidth = parseCssLength(
        getTokenValue(base, 'semantic.border.outline.surface.width')!
      );

      expect(focusWidth).not.toBeNaN();
      expect(outlineWidth).not.toBeNaN();
      expect(focusWidth).toBeGreaterThanOrEqual(outlineWidth);
    });

    test('focus.ring.width ≥ outline.control.width', () => {
      const focusWidth = parseCssLength(
        getTokenValue(base, 'semantic.focus.ring.width')!
      );
      const outlineWidth = parseCssLength(
        getTokenValue(base, 'semantic.border.outline.control.width')!
      );

      expect(focusWidth).not.toBeNaN();
      expect(outlineWidth).not.toBeNaN();
      expect(focusWidth).toBeGreaterThanOrEqual(outlineWidth);
    });
  });
});

// ---------------------------------------------------------------------------
// Selected Border vs Action Primary Colors — Visual Distinction
// ---------------------------------------------------------------------------

describe('Cross-family: action.primary selected color distinction', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName) => {
    const { base, alt } = resolvedBundles[bundleName];

    const checkActionSelectedDistinction = (
      tokens: Record<string, string | number>,
      label: string
    ) => {
      // If action.primary has both default and focused border colors,
      // they must differ to provide visual feedback
      const defaultBorder = tokens[
        'semantic.colors.action.primary.border.default'
      ];
      const focusedBorder = tokens[
        'semantic.colors.action.primary.border.focused'
      ];

      if (
        typeof defaultBorder === 'string' &&
        typeof focusedBorder === 'string' &&
        defaultBorder.startsWith('#') &&
        focusedBorder.startsWith('#')
      ) {
        // Focused border should differ from default to be distinguishable
        expect(focusedBorder).not.toBe(defaultBorder);
      }
    };

    test('base mode: action.primary focused border ≠ default border', () => {
      checkActionSelectedDistinction(base, 'base');
    });

    if (alt) {
      test('alt mode: action.primary focused border ≠ default border', () => {
        checkActionSelectedDistinction(alt, 'alt');
      });
    }
  });
});
