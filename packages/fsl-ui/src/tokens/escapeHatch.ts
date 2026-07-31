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

// ---------------------------------------------------------------------------
// Upstream custom properties — a named allowlist (ADR-023)
//
// The contract forbids reading `var(--x)` outside `--tt-` (theme tokens) and
// `--fsl-` (host knobs), because a third namespace would be an unreviewable
// styling side channel. That rule stands. What it did not distinguish is a
// property **published as documented API by a dependency we already depend on**,
// which is not a side channel but the sanctioned way to read a value only the
// dependency can compute.
//
// So the exception is an allowlist, not a hole: a fixed union of names, each
// with the documentation that publishes it, read through this helper so every
// use is grep-able and the contract test can assert nothing else appears.
//
// **Never write one of these.** They are read-only by construction: React Aria
// resolves `--trigger-width` as `props.style['--trigger-width'] || measured`,
// and passing our own value also switches off the `ResizeObserver` that keeps it
// in sync — so writing it would silently freeze the popover at the trigger's
// width on first paint. A contract test asserts no component assigns one.
// ---------------------------------------------------------------------------

/**
 * CSS custom properties published by a direct dependency that components may
 * read. One entry per name, each justified where it is used.
 *
 * - `--trigger-width` — the width of the element a popover is anchored to,
 *   measured and kept current by React Aria's `Popover`. Documented in its
 *   "CSS Variables" table as "The width of the popover trigger element", and
 *   read by React Aria's own `Select` and `ComboBox` examples. There is no way
 *   to obtain it in CSS otherwise: it is a layout measurement of a different
 *   subtree.
 */
export type UpstreamCssVar = '--trigger-width';

/**
 * Composes a `var()` read of an allowlisted upstream property with its required
 * fallback.
 *
 * The fallback is mandatory for the same reason it is on `fslVar`, but it means
 * something different: not "the host did not customise this" but "the dependency
 * did not publish it". For `--trigger-width` that fallback is the behaviour the
 * package had before it read the property at all, so degradation is a step back
 * rather than a break.
 */
export const upstreamVar = (name: UpstreamCssVar, fallback: string): string => {
  return `var(${name}, ${fallback})`;
};
