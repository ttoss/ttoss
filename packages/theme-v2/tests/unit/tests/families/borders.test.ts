/**
 * Borders family validation tests.
 *
 * Validates border tokens against the documented rules:
 * - selected.width >= outline.*.width (emphasis hierarchy)
 * - focus.ring.width >= outline.*.width (visibility hierarchy)
 * - selected and focus.ring never resolve to none/0 (must be visible)
 * - Style contracts: solid, dashed, dotted, none
 *
 * @see REFACTOR.md Phase 6.7 — Test requirements
 */

import { bundleEntries, resolvedBundles } from '../../helpers';
import { getTokenValue, parseCssLength } from './testHelpers';

// ---------------------------------------------------------------------------
// Core Border — Width Order
// ---------------------------------------------------------------------------

describe('Core border widths', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, bundle) => {
    test('base mode: focused >= selected > default >= none', () => {
      const { core } = bundle.base;
      const widths = core.border.width;

      const noneVal = parseCssLength(widths.none);
      const defaultVal = parseCssLength(widths.default);
      const selectedVal = parseCssLength(widths.selected);
      const focusedVal = parseCssLength(widths.focused);

      // All should be parseable
      expect(noneVal).not.toBeNaN();
      expect(defaultVal).not.toBeNaN();
      expect(selectedVal).not.toBeNaN();
      expect(focusedVal).not.toBeNaN();

      // Hierarchy: none <= default < selected <= focused
      expect(noneVal).toBeLessThanOrEqual(defaultVal);
      expect(defaultVal).toBeLessThan(selectedVal); // default MUST be less than selected
      expect(selectedVal).toBeLessThanOrEqual(focusedVal);
    });

    test('base mode: selected and focused are not none/0', () => {
      const { core } = bundle.base;
      const widths = core.border.width;

      const selectedVal = parseCssLength(widths.selected);
      const focusedVal = parseCssLength(widths.focused);

      // Selected and focused borders must be visible
      expect(selectedVal).toBeGreaterThan(0);
      expect(focusedVal).toBeGreaterThan(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Semantic Border — Emphasis Hierarchy
// ---------------------------------------------------------------------------

describe('Semantic borders', () => {
  describe.each(bundleEntries)('%s bundle', (bundleName, _bundle) => {
    const { base, alt } = resolvedBundles[bundleName];

    /**
     * Helper to parse and validate two border width values.
     * Reduces duplication across tests.
     */
    const parseAndValidatePair = (
      tokens: Record<string, string | number>,
      path1: string,
      path2: string
    ): [number, number] => {
      const val1 = parseCssLength(getTokenValue(tokens, path1)!);
      const val2 = parseCssLength(getTokenValue(tokens, path2)!);

      expect(val1).not.toBeNaN();
      expect(val2).not.toBeNaN();

      return [val1, val2];
    };

    test('base mode: selected.width >= outline.surface.width', () => {
      const [selectedWidth, outlineWidth] = parseAndValidatePair(
        base,
        'semantic.border.selected.width',
        'semantic.border.outline.surface.width'
      );

      // Selected must be more prominent than resting outline
      expect(selectedWidth).toBeGreaterThanOrEqual(outlineWidth);
    });

    test('base mode: selected.width >= outline.control.width', () => {
      const [selectedWidth, outlineWidth] = parseAndValidatePair(
        base,
        'semantic.border.selected.width',
        'semantic.border.outline.control.width'
      );

      // Selected must be more prominent than resting outline
      expect(selectedWidth).toBeGreaterThanOrEqual(outlineWidth);
    });

    test('base mode: focus.ring.width >= outline.control.width', () => {
      const [focusWidth, outlineWidth] = parseAndValidatePair(
        base,
        'semantic.focus.ring.width',
        'semantic.border.outline.control.width'
      );

      // Focus ring must be more prominent than resting outline
      expect(focusWidth).toBeGreaterThanOrEqual(outlineWidth);
    });

    test('base mode: selected and focus.ring are not none/0', () => {
      const selectedWidth = parseCssLength(
        getTokenValue(base, 'semantic.border.selected.width')!
      );
      const focusWidth = parseCssLength(
        getTokenValue(base, 'semantic.focus.ring.width')!
      );

      // Both must be visible
      expect(selectedWidth).toBeGreaterThan(0);
      expect(focusWidth).toBeGreaterThan(0);
    });

    test('alternate mode: selected.width >= outline.surface.width (if alternate exists)', () => {
      if (!alt) {
        return; // Single-mode theme
      }

      const [selectedWidth, outlineWidth] = parseAndValidatePair(
        alt,
        'semantic.border.selected.width',
        'semantic.border.outline.surface.width'
      );

      expect(selectedWidth).toBeGreaterThanOrEqual(outlineWidth);
    });

    test('alternate mode: focus.ring.width >= outline.control.width (if alternate exists)', () => {
      if (!alt) {
        return; // Single-mode theme
      }

      const [focusWidth, outlineWidth] = parseAndValidatePair(
        alt,
        'semantic.focus.ring.width',
        'semantic.border.outline.control.width'
      );

      expect(focusWidth).toBeGreaterThanOrEqual(outlineWidth);
    });
  });
});
