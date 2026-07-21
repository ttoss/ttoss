import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: colors `informational`, radii
// `surface`, border `outline.surface`, spacing `inset.surface`, elevation
// `surface`/`tonal`. Surface is the depth-bearing container primitive: a
// non-interactive region that expresses a surface stratum (flat → raised →
// overlay → blocking) by pairing the elevation shadow recipe with the tonal
// surface colour at that depth. It reads no interactive State.
//
// Structure carries Evaluation `{primary|muted}`: the hairline boundary
// consumes `vars.colors.informational[evaluation]`, so the prop earns its
// place per the §2.3 evidence rule (a runtime reads the evaluated token).
// ---------------------------------------------------------------------------

/** Formal semantic identity — Surface root (Structure entity, depth container). */
export const surfaceMeta = {
  displayName: 'Surface',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** The elevation strata a Surface can express (elevation.md surface contract). */
export type SurfaceLevel = 'flat' | 'raised' | 'overlay' | 'blocking';

/** Inner padding drawn from the surface inset scale. */
export type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';

/** Props for the Surface component. */
export interface SurfaceProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
> {
  /**
   * Elevation stratum. `flat` sits flush with the page (no shadow); `raised`
   * is the default card/panel depth; `overlay` floats above raised content;
   * `blocking` is the strongest in-flow depth (dialog bodies). Depth is
   * carried by the paired shadow recipe *and* the tonal surface colour, so it
   * reads correctly in both light and dark (dark depth is the tonal step —
   * shadows go invisible on a near-black canvas).
   * @default 'raised'
   */
  level?: SurfaceLevel;
  /**
   * Inner padding from the surface inset scale. `none` removes padding for
   * surfaces that host their own edge-to-edge content (lists, media).
   * @default 'md'
   */
  padding?: SurfacePadding;
  /**
   * Emphasis of the hairline boundary. `muted` is the quiet default that lets
   * elevation carry the separation; `primary` draws a firmer edge.
   * @default 'muted'
   */
  evaluation?: EvaluationsFor<(typeof surfaceMeta)['entity']>;
  /** The surface's content. */
  children?: React.ReactNode;
}

/** Inset padding per scale step; `none` collapses to zero. */
const PADDING_BY_KEY: Record<SurfacePadding, string> = {
  none: '0',
  sm: vars.spacing.inset.surface.sm,
  md: vars.spacing.inset.surface.md,
  lg: vars.spacing.inset.surface.lg,
};

/** Text colour for content sitting on the surface. */
const SURFACE_TEXT = vars.colors.informational.primary.text?.default;

/**
 * The surface's background colour. Raised strata read the tonal surface colour
 * (the "colour at depth"); `flat` — or a theme that ships no tonal group — is
 * canvas, so it falls back to the primary informational background.
 */
const backgroundFor = (level: SurfaceLevel): string | undefined => {
  const tonal = vars.elevation.tonal;
  if (level === 'flat' || tonal === undefined) {
    return vars.colors.informational.primary.background?.default;
  }
  return tonal[level];
};

/** The hairline boundary colour for the given evaluation. */
const borderColorFor = (
  evaluation: EvaluationsFor<'Structure'>
): string | undefined => {
  return (
    vars.colors.informational[evaluation]?.border?.default ?? 'transparent'
  );
};

/**
 * A depth-bearing container — the surface primitive of the FSL grammar.
 *
 * Entity = Structure. Use it wherever a region needs to read as a distinct
 * surface: cards, panels, sheets, the body of a dialog. Pick the `level` by
 * how the surface should sit relative to the page, not by how it should look —
 * the theme decides the shadow and tonal treatment per mode. Non-interactive:
 * it owns no hover/focus chrome; interactivity belongs to the controls placed
 * inside it.
 *
 * @example
 * ```tsx
 * <Surface level="raised" padding="lg">
 *   <Heading level={3}>Storage</Heading>
 *   <Meter aria-label="Used" label="Used" value={72} />
 * </Surface>
 * ```
 */
export const Surface = ({
  level = 'raised',
  padding = 'md',
  evaluation = 'muted',
  children,
  ...props
}: SurfaceProps) => {
  return (
    <div
      {...props}
      data-scope="surface"
      data-part="root"
      data-level={level}
      data-evaluation={evaluation}
      style={
        {
          boxSizing: 'border-box',
          padding: PADDING_BY_KEY[padding],
          color: SURFACE_TEXT,
          background: backgroundFor(level),
          boxShadow: vars.elevation.surface[level],
          borderRadius: vars.radii.surface,
          borderWidth: vars.border.outline.surface.width,
          borderStyle: vars.border.outline.surface.style,
          borderColor: borderColorFor(evaluation),
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};
Surface.displayName = surfaceMeta.displayName;
