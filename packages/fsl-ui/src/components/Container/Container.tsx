import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: sizing `surface.maxWidth` /
// `measure.reading`, spacing `gutter`. Container is the page-shell primitive:
// a centered block that caps its inline size at a structural bound and pads
// its edges with the theme gutter, so the "readable column in the middle of
// the page" pattern never becomes an ad-hoc `max-width: 1120px; margin: auto`.
// It consumes no colour token.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Container root (Structure entity, page shell). */
export const containerMeta = {
  displayName: 'Container',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** The inline-size cap: a structural surface width or the readability measure. */
export type ContainerSize = 'surface' | 'reading';

/** Edge padding drawn from the gutter scale (`none` removes it). */
export type ContainerGutter = 'none' | 'section' | 'page';

const MAX_WIDTH: Record<ContainerSize, string> = {
  surface: vars.sizing.surface.maxWidth,
  reading: vars.sizing.measure.reading,
};

const GUTTER: Record<ContainerGutter, string> = {
  none: '0',
  section: vars.spacing.gutter.section,
  page: vars.spacing.gutter.page,
};

/** Props for the Container component. */
export interface ContainerProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
> {
  /**
   * Inline-size cap. `surface` is the structural page/content width; `reading`
   * is the narrower long-form readability measure. There is no raw max-width.
   * @default 'surface'
   */
  size?: ContainerSize;
  /**
   * Edge padding from the gutter scale. `page` is the full page gutter;
   * `section` a tighter one; `none` removes it for full-bleed children.
   * @default 'page'
   */
  gutter?: ContainerGutter;
  /** The shell's content. */
  children?: React.ReactNode;
}

/**
 * The page-shell primitive — a centered, width-capped, gutter-padded column.
 *
 * Entity = Structure. Wrap a page (or a major region) in a Container to give
 * it the product's standard content width and edge padding without hand-rolling
 * `max-width` + `margin: auto`. Pick `size="reading"` for long-form article
 * columns and `size="surface"` for app/page shells. Place `Stack`, `Grid`, and
 * `Surface` inside it.
 *
 * @example
 * ```tsx
 * <Container size="surface">
 *   <Stack gap="xl">
 *     <Heading level={1}>Dashboard</Heading>
 *     <Grid columns={3} gap="lg">…</Grid>
 *   </Stack>
 * </Container>
 * ```
 */
export const Container = ({
  size = 'surface',
  gutter = 'page',
  children,
  ...props
}: ContainerProps) => {
  return (
    <div
      {...props}
      data-scope="container"
      data-part="root"
      data-size={size}
      style={
        {
          boxSizing: 'border-box',
          marginInline: 'auto',
          width: '100%',
          maxWidth: MAX_WIDTH[size],
          paddingInline: GUTTER[gutter],
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};
Container.displayName = containerMeta.displayName;
