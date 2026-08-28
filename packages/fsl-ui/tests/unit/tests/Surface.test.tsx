/**
 * Surface — Structure-entity depth container.
 *
 * Verifies it exposes its identity and reflects the elevation `level`, the
 * `padding` step, and the authorial `evaluation` through data attributes and
 * the resolved inline styles (background = `informational.{evaluation}.
 * background.default` at every level, box-shadow = paired surface recipe).
 * The exact token *values* are the theme's concern (fsl-theme owns and tests
 * those); here we assert Surface wires the right token per prop.
 *
 * F-048 (fsl-ui ADR-037): the fill used to branch on `level` alone
 * (`elevation.tonal[level]`, ignoring `evaluation`, for every level but
 * `flat`). The suite below guards both directions — the fill reads
 * `evaluation` at every level, and `elevation.tonal` is never read at all.
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
    'level=%s pairs the surface shadow recipe with the evaluation fill, at every level (F-048)',
    (level) => {
      render(<Surface level={level}>x</Surface>);
      const el = root();
      expect(el).toHaveAttribute('data-level', level);
      expect(el?.style.boxShadow).toBe(vars.elevation.surface[level]);
      // Every level — not just `flat` — reads the muted (default) evaluation's
      // informational background; the stratum no longer owns the fill.
      const expectedBg = vars.colors.informational.muted.background?.default;
      expect(el?.style.backgroundColor).toBe(expectedBg);
      // `muted` is a voice, not a stratum (surfaceScope.ts `voicedSurface`),
      // so the default evaluation does not publish `--fsl-surface` — the
      // same rule a `muted` `Menu`/`Popover`/`Dialog`/`Drawer` already
      // follow for this exact fill.
      expect(el?.style.getPropertyValue('--fsl-surface')).toBe('');
      // Guard from the other side (F-048): the fill never reads `tonal`, even
      // where `tonal` and the informational background happen to differ.
      if (level !== 'flat') {
        expect(el?.style.backgroundColor).not.toBe(
          vars.elevation.tonal?.[level]
        );
      }
    }
  );

  test.each<[SurfaceLevel]>([['raised'], ['overlay'], ['blocking']])(
    'level=%s: the fill follows `evaluation`, not the stratum, and `primary` publishes it (F-048)',
    (level) => {
      render(
        <Surface level={level} evaluation="primary">
          x
        </Surface>
      );
      const el = root();
      const expectedBg = vars.colors.informational.primary.background?.default;
      expect(el?.style.backgroundColor).toBe(expectedBg);
      // The muted and primary fills differ (informational.md), so this also
      // proves the fill is not the level-keyed constant it used to be.
      expect(el?.style.backgroundColor).not.toBe(
        vars.colors.informational.muted.background?.default
      );
      // The page-like `primary` voice is a stratum and does publish
      // (CONTRACT §3.4 / surfaceScope.ts `voicedSurface`).
      expect(el?.style.getPropertyValue('--fsl-surface')).toBe(expectedBg);
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
