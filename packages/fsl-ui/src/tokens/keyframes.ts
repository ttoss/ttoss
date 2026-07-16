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

let injected = false;

/**
 * Injects the package stylesheet into `document.head` exactly once.
 * No-op on the server (SSR-safe) and when the element already exists
 * (e.g. two copies of the package on one page).
 *
 * Call it from a `React.useInsertionEffect` in any component that uses a
 * name from {@link ANIMATION_NAMES} — insertion effects never run during
 * server rendering, so the SSR guard below is defense in depth for direct
 * callers, not the primary mechanism.
 */
export const ensureKeyframes = (): void => {
  if (injected) return;
  const doc: Document | undefined = globalThis.document;
  /* istanbul ignore next -- SSR guard: jsdom always provides a document */
  if (doc === undefined) return;
  if (doc.getElementById(STYLE_ELEMENT_ID) !== null) {
    injected = true;
    return;
  }
  const style = doc.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = KEYFRAMES_CSS;
  doc.head.appendChild(style);
  injected = true;
};
