/**
 * Box — Structure-entity token-constrained escape hatch (D1 / ADR-021).
 *
 * Verifies every visual prop maps to a token value (never a raw literal),
 * per-axis padding overrides the shorthand, and the border/background/radius/
 * sizing knobs resolve from the semantic scales.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import {
  Box,
  type BoxBackground,
  type BoxBorder,
  type BoxMaxWidth,
  type BoxPadding,
  type BoxRadius,
  type BoxWidth,
} from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="box"][data-part="root"]'
  );
};

describe('Box', () => {
  test('defaults to a transparent, border-less, auto-width block', () => {
    render(
      <Box>
        <i>a</i>
      </Box>
    );
    const el = root();
    expect(el).toHaveAttribute('data-part', 'root');
    expect(el?.style.background).toBe('transparent');
    expect(el?.style.paddingBlock).toBe('0');
    expect(el?.style.paddingInline).toBe('0');
    expect(el?.style.borderRadius).toBe('0');
    expect(el?.style.borderStyle).toBe('');
    expect(el?.style.width).toBe('auto');
    expect(el?.style.maxWidth).toBe('');
  });

  test.each<[BoxPadding, string]>([
    ['none', '0'],
    ['sm', vars.spacing.inset.surface.sm],
    ['md', vars.spacing.inset.surface.md],
    ['lg', vars.spacing.inset.surface.lg],
  ])('padding=%s applies to both axes', (padding, css) => {
    render(<Box padding={padding} />);
    const el = root();
    expect(el?.style.paddingBlock).toBe(css);
    expect(el?.style.paddingInline).toBe(css);
  });

  test('per-axis padding overrides the shorthand', () => {
    render(<Box padding="md" paddingBlock="sm" paddingInline="lg" />);
    const el = root();
    expect(el?.style.paddingBlock).toBe(vars.spacing.inset.surface.sm);
    expect(el?.style.paddingInline).toBe(vars.spacing.inset.surface.lg);
  });

  test.each<[BoxBackground, string]>([
    ['none', 'transparent'],
    ['primary', vars.colors.informational.primary.background!.default],
    ['muted', vars.colors.informational.muted.background!.default],
  ])('background=%s reads the informational palette', (background, css) => {
    render(<Box background={background} />);
    expect(root()?.style.background).toBe(css);
  });

  test.each<[BoxRadius, string]>([
    ['none', '0'],
    ['control', vars.radii.control],
    ['surface', vars.radii.surface],
    ['round', vars.radii.round],
  ])('radius=%s reads the radii scale', (radius, css) => {
    render(<Box radius={radius} />);
    expect(root()?.style.borderRadius).toBe(css);
  });

  test.each<[Exclude<BoxBorder, 'none'>, string | undefined]>([
    ['muted', vars.colors.informational.muted.border?.default],
    ['strong', vars.colors.informational.primary.border?.default],
  ])('border=%s draws a hairline from the surface outline', (border, color) => {
    render(<Box border={border} />);
    const el = root();
    expect(el?.style.borderWidth).toBe(vars.border.outline.surface.width);
    expect(el?.style.borderStyle).toBe(vars.border.outline.surface.style);
    expect(el?.style.borderColor).toBe(color);
  });

  test('border=none removes the edge entirely', () => {
    render(<Box border="none" />);
    const el = root();
    expect(el?.style.borderWidth).toBe('');
    expect(el?.style.borderStyle).toBe('');
    expect(el?.style.borderColor).toBe('');
  });

  test.each<[BoxWidth, string]>([
    ['auto', 'auto'],
    ['full', '100%'],
    ['fit', 'fit-content'],
  ])('width=%s uses the intrinsic sizing keyword', (width, css) => {
    render(<Box width={width} />);
    expect(root()?.style.width).toBe(css);
  });

  test.each<[BoxMaxWidth, string]>([
    ['surface', vars.sizing.surface.maxWidth],
    ['reading', vars.sizing.measure.reading],
  ])('maxWidth=%s caps inline size from the sizing scale', (mw, css) => {
    render(<Box maxWidth={mw} />);
    expect(root()?.style.maxWidth).toBe(css);
  });

  test('maxWidth=none leaves inline size uncapped', () => {
    render(<Box maxWidth="none" />);
    expect(root()?.style.maxWidth).toBe('');
  });

  test('grow fills the flex main axis and allows shrinking', () => {
    render(<Box grow />);
    const el = root();
    expect(el?.style.flexGrow).toBe('1');
    expect(el?.style.minWidth).toBe('0');
  });

  test('grow defaults off (no flex-grow)', () => {
    render(<Box />);
    expect(root()?.style.flexGrow).toBe('');
  });

  test('forwards pass-through props to the root', () => {
    render(<Box id="panel" aria-label="Panel" role="group" />);
    const el = root();
    expect(el).toHaveAttribute('id', 'panel');
    expect(el).toHaveAttribute('aria-label', 'Panel');
    expect(el).toHaveAttribute('role', 'group');
  });
});
