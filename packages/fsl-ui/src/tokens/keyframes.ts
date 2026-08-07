/**
 * Runtime `@keyframes` registry for `@ttoss/fsl-ui`.
 *
 * Components style themselves exclusively through inline styles (no CSS
 * files ship with the package), but CSS animations can only reference
 * `@keyframes` declared in a real stylesheet. This module owns that
 * stylesheet: a single `<style id="fsl-ui-keyframes">` element injected
 * once per document, SSR-safe and idempotent.
 *
 * Rules (enforced by `tests/unit/tests/keyframes.test.ts` and the contract
 * suite):
 *
 * 1. Every animation name used by a component MUST be registered in
 *    `ANIMATION_NAMES` — components reference `ANIMATION_NAMES.*`, never a
 *    bare string.
 * 2. Every registered name MUST have a matching `@keyframes` block in
 *    `KEYFRAMES_CSS`.
 * 3. The stylesheet disables all registered animations under
 *    `prefers-reduced-motion: reduce`.
 */

import { injectStylesheetOnce } from './stylesheetInjection';

const STYLE_ELEMENT_ID = 'fsl-ui-keyframes';

/**
 * Canonical animation names shipped by the package. Components must
 * reference these constants (never string literals) so the contract test
 * can prove every `animation:` in `src/` resolves to a real `@keyframes`.
 */
export const ANIMATION_NAMES = {
  /** Indeterminate ProgressBar fill sweep. */
  progressBarIndeterminate: 'tt-progressbar-indeterminate',
} as const;

/**
 * The full stylesheet injected by {@link ensureKeyframes}. Uses logical
 * properties only (`margin-inline-start`) so the sweep direction follows
 * the writing direction under `dir="rtl"`.
 */
export const KEYFRAMES_CSS = `
@keyframes ${ANIMATION_NAMES.progressBarIndeterminate} {
  0% { margin-inline-start: -40%; }
  100% { margin-inline-start: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  [data-scope] [data-part] { animation: none !important; }
}
`.trim();

/**
 * Injects the package stylesheet into `document.head` exactly once.
 * No-op on the server (SSR-safe) and when the element already exists
 * (e.g. two copies of the package on one page) — the shared
 * {@link injectStylesheetOnce} mechanism carries those guarantees.
 *
 * Call it from a `React.useInsertionEffect` in any component that uses a
 * name from {@link ANIMATION_NAMES} — insertion effects never run during
 * server rendering, so the injector's SSR guard is defense in depth for
 * direct callers, not the primary mechanism.
 */
export const ensureKeyframes = (): void => {
  injectStylesheetOnce({ id: STYLE_ELEMENT_ID, css: KEYFRAMES_CSS });
};
