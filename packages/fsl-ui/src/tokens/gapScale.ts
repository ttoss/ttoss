import { vars } from '@ttoss/fsl-theme/vars';

/**
 * The Structure primitives' shared layout vocabulary — the named gap-scale
 * steps and the alignment keyword maps (E2 C-12).
 *
 * `Grid`, `List` and `Stack` all speak the same five-step gap language and
 * the same alignment keywords; before this module each spelled out its own
 * copy of the step→token record. Three literals that agree today are
 * indistinguishable from three that track, until one moves (the
 * two-constants lesson, forms R2) — so the records live here once and the
 * primitives import them.
 *
 * Two gap records, not one: the theme keeps stacked and inline rhythm as
 * distinct families (`gap.stack` for block-axis flow, `gap.inline` for
 * inline-axis grouping — see the spacing family docs), and the consumer's
 * axis picks the family. Two alignment maps, not one: flexbox spells the
 * edge keywords `flex-start`/`flex-end` while grid item alignment uses the
 * plain `start`/`end`, so the same authored keyword resolves through the
 * map that matches the consumer's display type.
 */

/** A step of the gap scale. */
export type GapScaleStep = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Alignment of items against their container or track. */
export type BoxAlignment = 'start' | 'center' | 'end' | 'stretch';

/** Main-axis distribution of items within their container. */
export type BoxDistribution = 'start' | 'center' | 'end' | 'between';

/** Block-axis rhythm — column layouts, lists, 2D grids. */
export const STACK_GAP: Record<GapScaleStep, string> = {
  xs: vars.spacing.gap.stack.xs,
  sm: vars.spacing.gap.stack.sm,
  md: vars.spacing.gap.stack.md,
  lg: vars.spacing.gap.stack.lg,
  xl: vars.spacing.gap.stack.xl,
};

/** Inline-axis grouping — rows of controls, horizontal stacks. */
export const INLINE_GAP: Record<GapScaleStep, string> = {
  xs: vars.spacing.gap.inline.xs,
  sm: vars.spacing.gap.inline.sm,
  md: vars.spacing.gap.inline.md,
  lg: vars.spacing.gap.inline.lg,
  xl: vars.spacing.gap.inline.xl,
};

/** Cross-axis alignment keywords for flex containers (`align-items`). */
export const FLEX_ALIGN: Record<BoxAlignment, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

/** Main-axis distribution keywords for flex containers (`justify-content`). */
export const FLEX_JUSTIFY: Record<BoxDistribution, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
};

/** Track alignment keywords for grid containers (`align-items`/`justify-items`). */
export const GRID_ALIGN: Record<BoxAlignment, string> = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
};
