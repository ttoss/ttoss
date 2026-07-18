import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: spacing `gap`. Grid is the 2D
// layout primitive: a CSS grid container whose track count is a structural
// integer (like flex ordering) and whose gutter is drawn from the theme gap
// scale, so grid rhythm can never be an ad-hoc `gap: 12px`. Column/row counts
// resolve to `repeat(N, minmax(0, 1fr))` — the `minmax(0, 1fr)` guard keeps
// tracks from blowing out on overflowing content. It consumes no colour token.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Grid root (Structure entity, 2D layout). */
export const gridMeta = {
  displayName: 'Grid',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** A step of the gap scale. */
export type GridGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Track (item) alignment along an axis. */
export type GridAlign = 'start' | 'center' | 'end' | 'stretch';

/**
 * Minimum column width for a responsive auto-fit grid. A small named
 * threshold scale (like a breakpoint), not a per-use length — the grid fits as
 * many equal columns as the container allows, each at least this wide, and
 * reflows the count automatically.
 */
export type GridMinColumnWidth = 'xs' | 'sm' | 'md' | 'lg';

const GAP: Record<GridGap, string> = {
  xs: vars.spacing.gap.stack.xs,
  sm: vars.spacing.gap.stack.sm,
  md: vars.spacing.gap.stack.md,
  lg: vars.spacing.gap.stack.lg,
  xl: vars.spacing.gap.stack.xl,
};

// Card-width thresholds for auto-fit. Fixed rem thresholds (a named layout
// scale, like breakpoints) — not arbitrary per-use lengths.
const MIN_COLUMN_WIDTH: Record<GridMinColumnWidth, string> = {
  xs: '12rem',
  sm: '16rem',
  md: '20rem',
  lg: '24rem',
};

const ALIGN: Record<GridAlign, string> = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
};

/** Equal-fraction track template with an overflow-safe minimum. */
const tracks = (count: number): string => {
  return `repeat(${count}, minmax(0, 1fr))`;
};

/** Responsive auto-fit template — as many ≥`min`-wide columns as fit. */
const autoTracks = (min: GridMinColumnWidth): string => {
  return `repeat(auto-fit, minmax(min(100%, ${MIN_COLUMN_WIDTH[min]}), 1fr))`;
};

/** Props for the Grid component. */
export interface GridProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
> {
  /**
   * Number of equal-fraction columns (`repeat(N, minmax(0, 1fr))`). A
   * structural integer, not a length — there is no raw track template.
   * Ignored when `minColumnWidth` is set (responsive auto-fit takes over).
   * @default 1
   */
  columns?: number;
  /**
   * Make the grid **responsive**: fit as many equal columns as the container
   * allows, each at least this wide, reflowing the count automatically
   * (`repeat(auto-fit, minmax(…, 1fr))`). Takes a named threshold, not a
   * length. When set, it overrides `columns`.
   */
  minColumnWidth?: GridMinColumnWidth;
  /**
   * Number of equal-fraction rows. Omit to let rows size to content (the
   * common case); set it only for explicit row grids.
   */
  rows?: number;
  /**
   * Space between tracks (row and column), from the gap scale. There is no
   * raw-length vocabulary — rhythm always comes from the scale.
   * @default 'md'
   */
  gap?: GridGap;
  /** Block-axis alignment of items within their tracks (`align-items`). @default 'stretch' */
  align?: GridAlign;
  /** Inline-axis alignment of items within their tracks (`justify-items`). @default 'stretch' */
  justify?: GridAlign;
  /** The grid items. */
  children?: React.ReactNode;
}

/**
 * The 2D layout primitive — a CSS grid spaced from the FSL gap scale.
 *
 * Entity = Structure. Use it for card grids, form field matrices, and any
 * two-dimensional arrangement. `columns`/`rows` are structural integers that
 * resolve to equal, overflow-safe fraction tracks; `gap` draws only from the
 * named scale, so grid rhythm stays consistent across a product. For a single
 * axis of flow, reach for `Stack` instead.
 *
 * @example
 * ```tsx
 * // Fixed columns
 * <Grid columns={3} gap="lg">…</Grid>
 * // Responsive: as many ≥16rem columns as fit, reflowing automatically
 * <Grid minColumnWidth="sm" gap="lg">…</Grid>
 * ```
 */
export const Grid = ({
  columns = 1,
  minColumnWidth,
  rows,
  gap = 'md',
  align = 'stretch',
  justify = 'stretch',
  children,
  ...props
}: GridProps) => {
  const templateColumns =
    minColumnWidth === undefined ? tracks(columns) : autoTracks(minColumnWidth);

  return (
    <div
      {...props}
      data-scope="grid"
      data-part="root"
      data-columns={minColumnWidth === undefined ? columns : 'auto'}
      data-gap={gap}
      style={
        {
          display: 'grid',
          gridTemplateColumns: templateColumns,
          gridTemplateRows: rows === undefined ? undefined : tracks(rows),
          gap: GAP[gap],
          alignItems: ALIGN[align],
          justifyItems: ALIGN[justify],
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};
Grid.displayName = gridMeta.displayName;
