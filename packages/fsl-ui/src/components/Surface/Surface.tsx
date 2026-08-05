import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { voicedSurface } from '../../tokens/surfaceScope';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: colors `informational`, radii
// `surface`, border `outline.surface`, spacing `inset.surface`, elevation
// `surface`. Surface is the depth-bearing container primitive: a
// non-interactive region that expresses a surface stratum (flat → raised →
// overlay → blocking) by the paired elevation shadow recipe alone — the same
// fill-by-evaluation rule every occluding overlay in the package already
// uses (F-048, fsl-ui ADR-037). `elevation.tonal` stays defined in the theme
// but unread here; it is opt-in for a future colourless elevation cue. It
// reads no interactive State.
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
   * carried by the paired shadow recipe alone, at every level, the same rule
   * every occluding surface in the package already uses (`Menu`/`Popover`/
   * `Tooltip`/`Dialog`/`Drawer`/`Toast` read only `elevation.surface[level]`
   * for shadow and `informational.{evaluation}.background.default` for
   * fill — F-048). Accepted cost: a shadow that is suppressed
   * (`forced-colors`, print) leaves no other depth cue on `Surface`; the
   * hairline boundary (`informational.{evaluation}.border.default`) is
   * unchanged by this and does not stand in for it — ADR-031 already
   * classifies `Surface` as an *embedded* surface that owes no occluding
   * ≥3:1 edge duty in that scenario, so this is a pre-existing, already-
   * characterized gap, not a new one.
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
 * The surface's background colour. Every level reads the same
 * `informational.{evaluation}.background.default` fill the six occluding
 * overlay components (`Menu`/`Popover`/`Tooltip`/`Dialog`/`Drawer`/`Toast`)
 * already use — F-048: `evaluation` used to drive only the edge at
 * `raised`/`overlay`/`blocking`, while `elevation.tonal[level]` silently
 * owned the fill regardless of `evaluation`, so a `Surface` and a real
 * overlay declaring the same stratum painted different colours in dark
 * (`#3d3d3d` vs `#161616`, measured). `elevation.tonal` stays in the theme,
 * opt-in for a future consumer that wants a colourless elevation cue — this
 * component no longer reads it, and depth is carried by the paired shadow
 * recipe alone (`elevation.surface[level]`, unchanged).
 */
const backgroundFor = (
  evaluation: EvaluationsFor<'Structure'>
): string | undefined => {
  return vars.colors.informational[evaluation]?.background?.default;
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
 * the theme decides the shadow recipe per mode; the fill is `evaluation`'s
 * concern at every level. Non-interactive: it owns no hover/focus chrome;
 * interactivity belongs to the controls placed inside it.
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
          // A hosting surface publishes itself, but only the page-like
          // `primary` voice is a stratum (CONTRACT §3.4) — the same rule
          // `Menu`/`Popover`/`Dialog`/`Drawer` apply to this exact fill, now
          // that Surface reads it too. A `muted`/other-voiced Surface keeps
          // its voice and does not publish, so a quiet control nested in the
          // (default) `evaluation="muted"` Surface still falls back to its
          // own already-audited token instead of an unaudited pairing.
          ...voicedSurface({ evaluation, color: backgroundFor(evaluation) }),
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
