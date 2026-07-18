import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: spacing `gap`. Stack is the layout
// rhythm primitive: a flex container whose child spacing is drawn from the
// theme's gap scale, so rhythm can never be an ad-hoc `gap: 12px`. The
// direction picks the matching gap family — `vertical` reads `gap.stack.*`,
// `horizontal` reads `gap.inline.*` — so the semantic distinction between
// stacked and inline spacing is preserved. It consumes no colour token.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Stack root (Structure entity, layout rhythm). */
export const stackMeta = {
  displayName: 'Stack',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Flow direction — vertical stacks, horizontal inlines. */
export type StackDirection = 'vertical' | 'horizontal';

/** A step of the gap scale. */
export type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** Cross-axis alignment. */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

/** Main-axis distribution. */
export type StackJustify = 'start' | 'center' | 'end' | 'between';

const GAP_STACK: Record<StackGap, string> = {
  xs: vars.spacing.gap.stack.xs,
  sm: vars.spacing.gap.stack.sm,
  md: vars.spacing.gap.stack.md,
  lg: vars.spacing.gap.stack.lg,
  xl: vars.spacing.gap.stack.xl,
};

const GAP_INLINE: Record<StackGap, string> = {
  xs: vars.spacing.gap.inline.xs,
  sm: vars.spacing.gap.inline.sm,
  md: vars.spacing.gap.inline.md,
  lg: vars.spacing.gap.inline.lg,
  xl: vars.spacing.gap.inline.xl,
};

const ALIGN: Record<StackAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};

const JUSTIFY: Record<StackJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
};

/** Props for the Stack component. */
export interface StackProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
> {
  /**
   * Flow direction. `vertical` stacks children in a column (reads the
   * `gap.stack` scale); `horizontal` lays them in a row (reads `gap.inline`).
   * @default 'vertical'
   */
  direction?: StackDirection;
  /**
   * Space between children, from the gap scale. There is no raw-length
   * vocabulary — rhythm always comes from the scale.
   * @default 'md'
   */
  gap?: StackGap;
  /** Cross-axis alignment (`align-items`). @default 'stretch' */
  align?: StackAlign;
  /** Main-axis distribution (`justify-content`). @default 'start' */
  justify?: StackJustify;
  /** Allow children to wrap onto multiple lines. @default false */
  wrap?: boolean;
  /** The items to lay out. */
  children?: React.ReactNode;
}

/**
 * The layout rhythm primitive — a flex container spaced from the FSL gap scale.
 *
 * Entity = Structure. Use it to stack sections (`direction="vertical"`) or lay
 * out a row of controls (`direction="horizontal"`) with consistent, themeable
 * spacing. `gap`, `align`, and `justify` draw only from named scales/keywords —
 * there is no raw `gap: 12px`, which is how spacing rhythm stays consistent
 * across a product.
 *
 * @example
 * ```tsx
 * <Stack gap="lg">
 *   <Heading level={2}>Payment</Heading>
 *   <Stack direction="horizontal" gap="sm" justify="end">
 *     <Button evaluation="muted">Cancel</Button>
 *     <Button evaluation="primary">Save</Button>
 *   </Stack>
 * </Stack>
 * ```
 */
export const Stack = ({
  direction = 'vertical',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  children,
  ...props
}: StackProps) => {
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      {...props}
      data-scope="stack"
      data-part="root"
      data-direction={direction}
      data-gap={gap}
      style={
        {
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          gap: isHorizontal ? GAP_INLINE[gap] : GAP_STACK[gap],
          alignItems: ALIGN[align],
          justifyContent: JUSTIFY[justify],
          flexWrap: wrap ? 'wrap' : 'nowrap',
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};
Stack.displayName = stackMeta.displayName;
