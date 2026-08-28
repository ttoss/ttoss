import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

/**
 * Enter/exit machinery for the modal Overlay composites — the phase the
 * surface animates through, and the scrim that blocks the page behind it.
 *
 * ## The constraint
 *
 * A modal's motion phase resolves **once**: `isEntering` reads the enter
 * spec, `isExiting` the exit spec, rest is `null` — and every animated style
 * derives from that one resolution. The scrim is likewise decided once:
 * fixed, full-inset, blocking-layer, `overlay.scrim` fill, fading on the
 * phase's own timing. Before this module each modal composite carried its
 * own copy of both, kept in step only by a "mirrors" comment — the
 * tracking-literals shape `rail.ts` documents, one drift away from two
 * modals that dim or time differently for no stated reason.
 *
 * The one axis a modal composite legitimately owns here is *where the scrim
 * places its surface* — a centred card and an edge-anchored panel are
 * different placements of the same scrim — so that arrives as the caller's
 * flex axes and nothing else does.
 */

/** Enter/exit flags as React Aria's overlay render props expose them. */
export interface TransitionPhaseFlags {
  isEntering?: boolean;
  isExiting?: boolean;
}

/** The active phase's motion spec, or `null` at rest. */
export type TransitionPhase = { duration: string; easing: string } | null;

/**
 * The active enter/exit motion spec, or `null` when the surface is at rest.
 * Collapses the repeated `transition[isEntering ? 'enter' : 'exit']` lookups
 * into a single resolution the style builders read from.
 */
export const resolveTransitionPhase = ({
  isEntering,
  isExiting,
}: TransitionPhaseFlags): TransitionPhase => {
  if (isEntering) return vars.motion.transition.enter;
  if (isExiting) return vars.motion.transition.exit;
  return null;
};

/**
 * The moving surface's `transition` value — transform and opacity travel
 * together, on the phase's timing. `undefined` at rest: a surface at rest
 * has nothing left to animate.
 */
export const surfacePhaseTransition = (
  phase: TransitionPhase
): string | undefined => {
  return phase
    ? `transform ${phase.duration} ${phase.easing}, opacity ${phase.duration} ${phase.easing}`
    : undefined;
};

/**
 * The scrim — blocks the page at the blocking layer, dims it with
 * `overlay.scrim`, and fades on the phase timing. `surfacePlacement` is the
 * caller's flex axes, the one decision a modal composite owns here.
 */
export const buildScrimStyle = ({
  surfacePlacement,
  isEntering,
  isExiting,
}: TransitionPhaseFlags & {
  surfacePlacement: React.CSSProperties;
}): React.CSSProperties => {
  const phase = resolveTransitionPhase({ isEntering, isExiting });
  return {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    ...surfacePlacement,
    zIndex: vars.zIndex.layer.blocking,
    backgroundColor: vars.overlay.scrim,
    transition: phase ? `opacity ${phase.duration} ${phase.easing}` : undefined,
    opacity: isExiting ? 0 : 1,
  };
};
