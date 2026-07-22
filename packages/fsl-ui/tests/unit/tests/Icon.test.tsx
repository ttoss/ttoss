/**
 * Icon — the internal semantic glyph layer (ROADMAP B1 / ADR-005).
 *
 * Icon is not exported from `src/index.ts`, so the auto-discovered contract
 * and axe suites do not reach it. This suite covers it directly: the
 * intent → glyph mapping, the Structure identity, sizing via
 * `vars.sizing.icon.*`, and the decorative-vs-labelled accessibility split.
 * It also asserts the icon-system.md opposition rules (expand ≠ collapse,
 * checked ≠ indeterminate) — the empirical FSL validation for this layer.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { ensureIconGlyphs, iconifyName } from 'src/components/Icon/glyphs';
import { Icon, iconMeta } from 'src/components/Icon/Icon';
import { ICON_INTENTS } from 'src/components/Icon/intents';

const getGlyph = (container: HTMLElement): HTMLElement => {
  const el = container.querySelector<HTMLElement>('[data-scope="icon"]');
  if (!el) throw new Error('icon glyph not rendered');
  return el;
};

describe('Icon — semantic identity', () => {
  test('meta is a Structure entity with the icon structural role', () => {
    expect(iconMeta.entity).toBe('Structure');
    expect(iconMeta.structure).toBe('icon');
    expect(iconMeta.displayName).toBe('Icon');
  });

  test('renders an iconify-icon carrying [data-scope=icon][data-part=icon]', () => {
    const { container } = render(<Icon intent="disclosure.expand" />);
    const glyph = getGlyph(container);
    expect(glyph.tagName.toLowerCase()).toBe('iconify-icon');
    expect(glyph).toHaveAttribute('data-scope', 'icon');
    expect(glyph).toHaveAttribute('data-part', 'icon');
  });

  test('renders the intent as its namespaced Iconify name', () => {
    const { container } = render(<Icon intent="action.close" />);
    expect(getGlyph(container)).toHaveAttribute('icon', 'fsl-ui:action-close');
  });
});

describe('Icon — sizing (vars.sizing.icon.*)', () => {
  test.each([
    ['sm', vars.sizing.icon.sm],
    ['md', vars.sizing.icon.md],
    ['lg', vars.sizing.icon.lg],
  ] as const)('size="%s" reads vars.sizing.icon.%s', (size, token) => {
    const { container } = render(
      <Icon intent="disclosure.expand" size={size} />
    );
    expect(getGlyph(container).style.fontSize).toBe(token);
  });

  test('defaults to the md size token', () => {
    const { container } = render(<Icon intent="disclosure.expand" />);
    expect(getGlyph(container).style.fontSize).toBe(vars.sizing.icon.md);
  });
});

describe('Icon — accessibility', () => {
  test('is decorative (aria-hidden, no role) when no label is given', () => {
    const { container } = render(<Icon intent="action.close" />);
    const glyph = getGlyph(container);
    expect(glyph).toHaveAttribute('aria-hidden', 'true');
    expect(glyph).not.toHaveAttribute('role');
    expect(glyph).not.toHaveAttribute('aria-label');
  });

  test('is a labelled image (role=img, no aria-hidden) when a label is given', () => {
    const { container } = render(
      <Icon intent="action.search" label="Search" />
    );
    const glyph = getGlyph(container);
    expect(glyph).toHaveAttribute('role', 'img');
    expect(glyph).toHaveAttribute('aria-label', 'Search');
    expect(glyph).not.toHaveAttribute('aria-hidden');
  });
});

describe('Icon — glyph registry (icon-system.md)', () => {
  test('iconifyName namespaces under fsl-ui: and slugs the intent', () => {
    expect(iconifyName('disclosure.expand')).toBe('fsl-ui:disclosure-expand');
    expect(iconifyName('selection.indeterminate')).toBe(
      'fsl-ui:selection-indeterminate'
    );
    // camelCase intents kebab-case their humps.
    expect(iconifyName('action.sortAscending')).toBe(
      'fsl-ui:action-sort-ascending'
    );
  });

  test('every registry name is Iconify-valid (lowercase [a-z0-9-] only)', () => {
    // Iconify's addIcon rejects invalid names *silently* — the element
    // renders 0×0 with no SVG. Caught live in the Studio (camelCase
    // intent); this invariant keeps it from regressing.
    for (const intent of ICON_INTENTS) {
      expect(iconifyName(intent)).toMatch(/^[a-z0-9-]+:[a-z0-9-]+$/);
    }
  });

  test('every intent maps to a unique registry name (no glyph collisions)', () => {
    const names = ICON_INTENTS.map(iconifyName);
    expect(new Set(names).size).toBe(ICON_INTENTS.length);
  });

  test('opposition intents never collapse to the same name', () => {
    // icon-system.md § Validation: these pairs must stay distinct.
    expect(iconifyName('disclosure.expand')).not.toBe(
      iconifyName('disclosure.collapse')
    );
    expect(iconifyName('selection.checked')).not.toBe(
      iconifyName('selection.indeterminate')
    );
  });

  test('ensureIconGlyphs is idempotent (safe to call repeatedly)', () => {
    expect(() => {
      ensureIconGlyphs();
      ensureIconGlyphs();
    }).not.toThrow();
  });
});
