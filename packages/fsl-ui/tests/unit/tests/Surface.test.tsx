/**
 * Surface — Structure-entity depth container.
 *
 * Verifies it exposes its identity and reflects the elevation `level`, the
 * `padding` step, and the authorial `evaluation` through data attributes and
 * the resolved inline styles (background = tonal surface colour, box-shadow =
 * paired surface recipe). The exact token *values* are the theme's concern
 * (fsl-theme owns and tests those); here we assert Surface wires the right
 * token per prop.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Surface, type SurfaceLevel, type SurfacePadding } from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="surface"][data-part="root"]'
  );
};

describe('Surface', () => {
  test('renders the surface identity with raised defaults', () => {
    render(<Surface>content</Surface>);
    const el = root();
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute('data-level', 'raised');
    expect(el).toHaveAttribute('data-evaluation', 'muted');
    expect(el).toHaveTextContent('content');
  });

  test.each<[SurfaceLevel]>([['flat'], ['raised'], ['overlay'], ['blocking']])(
    'level=%s pairs the surface shadow recipe and the depth background',
    (level) => {
      render(<Surface level={level}>x</Surface>);
      const el = root();
      expect(el).toHaveAttribute('data-level', level);
      expect(el?.style.boxShadow).toBe(vars.elevation.surface[level]);
      // flat is canvas (no tonal); raised strata read the tonal surface colour.
      const expectedBg =
        level === 'flat'
          ? vars.colors.informational.primary.background?.default
          : vars.elevation.tonal?.[level];
      expect(el?.style.background).toBe(expectedBg);
    }
  );

  test.each<[SurfacePadding, string]>([
    ['none', '0px'],
    ['sm', vars.spacing.inset.surface.sm],
    ['md', vars.spacing.inset.surface.md],
    ['lg', vars.spacing.inset.surface.lg],
  ])('padding=%s draws from the surface inset scale', (padding, expected) => {
    render(<Surface padding={padding}>x</Surface>);
    expect(root()?.style.padding).toBe(expected);
  });

  test('reflects the evaluation and colours the boundary from it', () => {
    render(<Surface evaluation="primary">x</Surface>);
    const el = root();
    expect(el).toHaveAttribute('data-evaluation', 'primary');
    expect(el?.style.borderColor).toBe(
      vars.colors.informational.primary.border?.default
    );
  });

  test('forwards pass-through props (id, aria-label) to the root', () => {
    render(
      <Surface id="panel" aria-label="Details">
        x
      </Surface>
    );
    const el = root();
    expect(el).toHaveAttribute('id', 'panel');
    expect(el).toHaveAttribute('aria-label', 'Details');
  });
});
