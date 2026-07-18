/**
 * Grid — Structure-entity 2D layout primitive.
 *
 * Verifies columns/rows resolve to overflow-safe fraction tracks, gap draws
 * from the stack gap scale, and align/justify map to grid keywords.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import {
  Grid,
  type GridAlign,
  type GridGap,
  type GridMinColumnWidth,
} from 'src/index';

const root = () => {
  return document.querySelector<HTMLElement>(
    '[data-scope="grid"][data-part="root"]'
  );
};

describe('Grid', () => {
  test('defaults to a single column, md gap, stretched', () => {
    render(
      <Grid>
        <i>a</i>
      </Grid>
    );
    const el = root();
    expect(el).toHaveAttribute('data-columns', '1');
    expect(el?.style.display).toBe('grid');
    expect(el?.style.gridTemplateColumns).toBe('repeat(1, minmax(0, 1fr))');
    expect(el?.style.gridTemplateRows).toBe('');
    expect(el?.style.gap).toBe(vars.spacing.gap.stack.md);
    expect(el?.style.alignItems).toBe('stretch');
    expect(el?.style.justifyItems).toBe('stretch');
  });

  test.each([[1], [2], [3], [4], [12]])(
    'columns=%s builds equal fraction tracks',
    (columns) => {
      render(<Grid columns={columns} />);
      expect(root()?.style.gridTemplateColumns).toBe(
        `repeat(${columns}, minmax(0, 1fr))`
      );
    }
  );

  test('rows builds explicit row tracks', () => {
    render(<Grid rows={2} />);
    expect(root()?.style.gridTemplateRows).toBe('repeat(2, minmax(0, 1fr))');
  });

  test.each<[GridMinColumnWidth, string]>([
    ['xs', '12rem'],
    ['sm', '16rem'],
    ['md', '20rem'],
    ['lg', '24rem'],
  ])('minColumnWidth=%s builds a responsive auto-fit track', (min, width) => {
    render(<Grid minColumnWidth={min} />);
    const el = root();
    expect(el?.style.gridTemplateColumns).toBe(
      `repeat(auto-fit, minmax(min(100%, ${width}), 1fr))`
    );
    // Auto-fit reports 'auto' rather than a fixed count.
    expect(el).toHaveAttribute('data-columns', 'auto');
  });

  test('minColumnWidth overrides a fixed columns count', () => {
    render(<Grid columns={4} minColumnWidth="sm" />);
    expect(root()?.style.gridTemplateColumns).toBe(
      'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))'
    );
  });

  test.each<[GridGap]>([['xs'], ['sm'], ['md'], ['lg'], ['xl']])(
    'gap=%s reads the stack gap scale',
    (gap) => {
      render(<Grid gap={gap} />);
      expect(root()?.style.gap).toBe(vars.spacing.gap.stack[gap]);
    }
  );

  test.each<[GridAlign, string]>([
    ['start', 'start'],
    ['center', 'center'],
    ['end', 'end'],
    ['stretch', 'stretch'],
  ])('align=%s / justify=%s map to grid keywords', (value, css) => {
    render(<Grid align={value} justify={value} />);
    const el = root();
    expect(el?.style.alignItems).toBe(css);
    expect(el?.style.justifyItems).toBe(css);
  });

  test('forwards pass-through props to the root', () => {
    render(<Grid id="cards" aria-label="Cards" />);
    const el = root();
    expect(el).toHaveAttribute('id', 'cards');
    expect(el).toHaveAttribute('aria-label', 'Cards');
  });
});
