import type * as React from 'react';

import type { Evaluation } from '../semantics';
import { fslVar } from './escapeHatch';
import {
  type InteractiveFlags,
  type InteractiveStates,
  resolveInteractiveStyle,
  resolveStateKey,
} from './resolveInteractiveStyle';

/**
 * The surface contract — how a quiet control matches the surface it sits on
 * (CONTRACT §3.4, F-024).
 *
 * ## The problem this closes
 *
 * `colors.md` § Stacking informational surfaces: the page and every contained
 * surface resolve from the *same* background token, and depth is paid in
 * `elevation.tonal.*` or in another family's fill (a table row paints
 * `input.primary`). The effective colour under a control is therefore a
 * **composite no colour token names or can name** — it is produced by the
 * cascade, and only the element that painted it knows it. The quiet rung
 * (`action.muted`) paints "the surface's own colour" as an opaque token, which
 * is byte-identical to the page and to every overlay we ship — and wrong on
 * every other surface: measured in the Studio, dark, a quiet `Remove` painted
 * `#161616` on a `#3d3d3d` table row, a black pill in every row (F-024).
 *
 * ## The mechanism
 *
 * The owner ruling stands: **a component always paints** — no `transparent`,
 * no omitted background, every declared token stays an auditable hex, and the
 * theme's own `muted.text ↔ background` pairs stay in the suite untouched.
 * What changes is *where the surface is known*: the element that paints a
 * hosting surface **publishes** it on the `--fsl-surface` custom property
 * (the same host-facing namespace as every §7 knob, so host applications can
 * publish their own surfaces and get the same behaviour), and the quiet
 * rung's **resting** fill reads `var(--fsl-surface, <its own token>)`. The
 * fallback is the exact value the rung painted before, so outside any
 * publisher nothing changes, and inside one the control borrows the real
 * composite the cascade produced — always one of the opaque values the theme
 * already audits.
 *
 * ## Bounds
 *
 * - **Resting state only.** The engaged fills (`hover`/`active`/`pressed`/
 *   `expanded`) are real surfaces of the rung's own and stay absolute — they
 *   are how a quiet control materialises. On a mid-tone host surface an
 *   engaged fill can coincide with the host (dark: the rung's hover and a
 *   table row both resolve `neutral.700`); that limit predates this module
 *   and the press step stays distinct.
 * - **The quiet rung only.** Every other rung paints a fill that *is* its
 *   voice; following the surface would erase the emphasis ladder.
 * - **Publishers are hosting surfaces, at rest, in the page voice.** Parts
 *   whose content is arbitrary (page-like strata, panels, rows, the field
 *   frame) publish their **resting** fill only: a host's transient states do
 *   not republish (the dark row hover fill measures 2.65:1 against the
 *   destructive ink), a selection fill is a voice (the dark selected row
 *   inverts to near-white, 1.5:1 against the muted ink), and voiced fills —
 *   Feedback chips and non-primary informational surfaces — keep their voice
 *   for the same measured reason. Every exclusion is held by fsl-theme's
 *   inventory, not by taste.
 *
 * The legibility guarantee moves with the mechanism: fsl-theme's cross-role
 * inventory pairs the quiet ink — and the destructive ink — against every
 * publishable surface (page, tonal strata, the row family's resting fill),
 * each at its own floor.
 */
export const SURFACE_VAR = '--fsl-surface' as const;

/**
 * Style fragment for a part that paints a **hosting surface**: the fill plus
 * its publication. Spread it where a plain `backgroundColor` used to be.
 *
 * Pass the host's **resting** fill. A host whose paint is state-dependent
 * (a row) spreads this first and lets its dynamic `backgroundColor` win the
 * spread order — the publication stays at rest, which is the only fill the
 * inventory guarantees every quiet ink against.
 */
export const publishSurface = (
  color: string | undefined
): React.CSSProperties => {
  if (color === undefined) return {};
  return {
    backgroundColor: color,
    [SURFACE_VAR]: color,
  } as React.CSSProperties;
};

/**
 * Paint for a surface that carries a caller-chosen voice (an Overlay's
 * `evaluation`): only the page-like `primary` voice publishes; every other
 * voice paints without publishing, because a voiced fill is not a stratum —
 * measured, the dark muted fill fails the destructive ink's floor. One
 * helper so the rule cannot drift per call site.
 */
export const voicedSurface = ({
  evaluation,
  color,
}: {
  evaluation: string;
  color: string | undefined;
}): React.CSSProperties => {
  if (evaluation === 'primary') return publishSurface(color);
  return { backgroundColor: color };
};

/**
 * The quiet rung's resting value: the published surface, with the rung's own
 * token as the fallback. Non-muted evaluations and non-resting states pass
 * through untouched.
 */
export const quietRestingFill = ({
  evaluation,
  value,
}: {
  evaluation: Evaluation;
  value: string | undefined;
}): string | undefined => {
  if (evaluation !== 'muted' || value === undefined) return value;
  return fslVar(SURFACE_VAR, value);
};

/**
 * `resolveInteractiveStyle` with the surface contract applied at rest.
 *
 * Drop-in for a quiet-capable Action call site's `background`/`border`
 * dimensions: resolves the cascade as usual, and when the winning state is
 * `default` on the muted rung, reads the published surface first. The border
 * follows because the quiet rung's edge mirrors its fill by construction —
 * an absolute edge on a borrowed fill would re-draw the seam this exists to
 * remove.
 */
export const resolveSurfaceBoundStyle = ({
  evaluation,
  states,
  flags,
}: {
  evaluation: Evaluation;
  states: InteractiveStates | undefined;
  flags: InteractiveFlags;
}): string | undefined => {
  const value = resolveInteractiveStyle(states, flags);
  if (resolveStateKey(flags) !== 'default') return value;
  return quietRestingFill({ evaluation, value });
};
