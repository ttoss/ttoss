/**
 * Escape-hatch policy (CONTRACT.md §8) — composite-scoped CSS custom
 * properties.
 *
 * Composites own their layout and expose no `style`/`className`. The one
 * sanctioned customization channel is a `--fsl-<scope>-<knob>` CSS custom
 * property, consumed through this helper so that:
 *
 * 1. Every knob ships a fallback — the component works with zero host CSS.
 * 2. The `--fsl-` prefix keeps host knobs disjoint from `--tt-` theme
 *    tokens (whose fallbacks remain forbidden by the contract tests).
 * 3. The knob name is grep-able: `fslVar('--fsl-dialog-max-width', …)`.
 *
 * Hosts customize via ordinary CSS, targeting the composite scope:
 *
 * ```css
 * [data-scope='dialog'] { --fsl-dialog-max-width: 720px; }
 * ```
 */

/** Host-facing knob names must carry the `--fsl-` namespace. */
export type FslKnob = `--fsl-${string}`;

/**
 * Composes a `var()` read of a host knob with its required fallback.
 * The fallback is the component's default — a knob without a fallback is a
 * contract violation (enforced by the contract test suite).
 */
export const fslVar = (knob: FslKnob, fallback: string): string => {
  return `var(${knob}, ${fallback})`;
};
