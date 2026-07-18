import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: colors `informational`, radii
// `surface`, border `outline.surface`, spacing `inset.surface`. Box is the
// sanctioned, token-constrained escape hatch (D1 / ADR-021): a generic block
// container whose every visual prop accepts *only* a token key — never a raw
// `style`/`className`. It is expressive enough to compose one-off layout
// containers (a padded region, a width-constrained column, a subtly grouped
// block) without leaving the semantic contract, and constrained enough that no
// arbitrary hex/px value can enter a consumer. Flex/grid layout lives in
// `Stack`/`Grid`; depth-bearing cards live in `Surface`; Box is everything
// else. It consumes no interactive State.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Box root (Structure entity, generic container). */
export const boxMeta = {
  displayName: 'Box',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Padding step drawn from the surface inset scale (`none` collapses to zero). */
export type BoxPadding = 'none' | 'sm' | 'md' | 'lg';

/** Background from the informational surface palette (`none` is transparent). */
export type BoxBackground = 'none' | 'primary' | 'muted';

/** Corner radius from the semantic radii scale. */
export type BoxRadius = 'none' | 'control' | 'surface' | 'round';

/** Hairline boundary emphasis (`none` draws no edge). */
export type BoxBorder = 'none' | 'muted' | 'strong';

/** Inline size (`width`) from the sizing behavior keywords. */
export type BoxWidth = 'auto' | 'full' | 'fit';

/** Maximum inline size — a structural surface cap or the readability measure. */
export type BoxMaxWidth = 'none' | 'surface' | 'reading';

const PADDING: Record<BoxPadding, string> = {
  none: '0',
  sm: vars.spacing.inset.surface.sm,
  md: vars.spacing.inset.surface.md,
  lg: vars.spacing.inset.surface.lg,
};

const BACKGROUND: Record<BoxBackground, string | undefined> = {
  none: 'transparent',
  primary: vars.colors.informational.primary.background?.default,
  muted: vars.colors.informational.muted.background?.default,
};

const RADIUS: Record<BoxRadius, string> = {
  none: '0',
  control: vars.radii.control,
  surface: vars.radii.surface,
  round: vars.radii.round,
};

const BORDER_COLOR: Record<Exclude<BoxBorder, 'none'>, string | undefined> = {
  muted: vars.colors.informational.muted.border?.default,
  strong: vars.colors.informational.primary.border?.default,
};

// Width is a layout *behaviour* keyword (like Stack's flex keywords), not a
// design token — `auto` / `100%` / `fit-content` are CSS intrinsic sizing, not
// arbitrary lengths, so they live as literals here (mirrors `core.sizing.behavior`).
const WIDTH: Record<BoxWidth, string> = {
  auto: 'auto',
  full: '100%',
  fit: 'fit-content',
};

const MAX_WIDTH: Record<BoxMaxWidth, string | undefined> = {
  none: undefined,
  surface: vars.sizing.surface.maxWidth,
  reading: vars.sizing.measure.reading,
};

/** Border longhands for the chosen emphasis; all-`undefined` when `none`. */
const borderStyleFor = (
  border: BoxBorder
): Pick<React.CSSProperties, 'borderWidth' | 'borderStyle' | 'borderColor'> => {
  if (border === 'none') return {};
  return {
    borderWidth: vars.border.outline.surface.width,
    borderStyle: vars.border.outline.surface.style,
    borderColor: BORDER_COLOR[border],
  };
};

/** Props for the Box component. */
export interface BoxProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
> {
  /**
   * Padding on both axes, from the surface inset scale. Overridden per-axis by
   * `paddingBlock` / `paddingInline` when those are set.
   * @default 'none'
   */
  padding?: BoxPadding;
  /** Block-axis (top/bottom) padding from the surface inset scale. */
  paddingBlock?: BoxPadding;
  /** Inline-axis (start/end) padding from the surface inset scale. */
  paddingInline?: BoxPadding;
  /**
   * Background from the informational surface palette. `none` is transparent —
   * Box adds no surface colour unless asked (that is `Surface`'s job).
   * @default 'none'
   */
  background?: BoxBackground;
  /**
   * Corner radius from the semantic radii scale.
   * @default 'none'
   */
  radius?: BoxRadius;
  /**
   * Hairline boundary emphasis, drawn with the surface outline width/style.
   * `muted` is the quiet informational edge; `strong` a firmer one; `none`
   * draws no border.
   * @default 'none'
   */
  border?: BoxBorder;
  /**
   * Inline size (`width`) from the sizing behavior keywords.
   * @default 'auto'
   */
  width?: BoxWidth;
  /**
   * Maximum inline size. `surface` caps at the structural surface width;
   * `reading` caps at the readability measure (long-form text). Pair with
   * `marginInline` centering via a parent `Stack`/`Grid` — Box does not center
   * itself.
   * @default 'none'
   */
  maxWidth?: BoxMaxWidth;
  /** The Box's content. */
  children?: React.ReactNode;
}

/**
 * The token-constrained escape hatch — a generic block container (D1 / ADR-021).
 *
 * Entity = Structure. Reach for Box when you need a one-off padded, sized, or
 * lightly-grouped region that is not a flex/grid layout (`Stack`/`Grid`) and
 * not a depth-bearing card (`Surface`). Every prop accepts only a **token key**
 * — `padding="md"`, `background="muted"`, `radius="surface"`, `maxWidth="reading"`
 * — so a layout can be composed expressively while no arbitrary hex/px value can
 * enter the consumer. There is no `style` or `className`.
 *
 * @example
 * ```tsx
 * // A centered, width-constrained reading column
 * <Stack align="center">
 *   <Box maxWidth="reading" padding="lg">
 *     <Text>Long-form content…</Text>
 *   </Box>
 * </Stack>
 * ```
 */
export const Box = ({
  padding = 'none',
  paddingBlock,
  paddingInline,
  background = 'none',
  radius = 'none',
  border = 'none',
  width = 'auto',
  maxWidth = 'none',
  children,
  ...props
}: BoxProps) => {
  return (
    <div
      {...props}
      data-scope="box"
      data-part="root"
      style={
        {
          boxSizing: 'border-box',
          paddingBlock: PADDING[paddingBlock ?? padding],
          paddingInline: PADDING[paddingInline ?? padding],
          background: BACKGROUND[background],
          borderRadius: RADIUS[radius],
          ...borderStyleFor(border),
          width: WIDTH[width],
          maxWidth: MAX_WIDTH[maxWidth],
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};
Box.displayName = boxMeta.displayName;
