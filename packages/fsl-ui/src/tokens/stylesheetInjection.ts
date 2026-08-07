/**
 * Inject-once `<style>` element mechanism (E2 C-13).
 *
 * Components style themselves exclusively through inline styles, but some CSS
 * cannot be expressed there — `@keyframes` need a real stylesheet, and shadow
 * pseudo-elements cannot be addressed from a `style` object. The modules that
 * own such CSS (`keyframes.ts`, `nativeFieldDecorations.ts`) each keep their
 * own element, id and contents — deliberately, because their contents are
 * governed by unrelated invariants — but the *plumbing* is one mechanism:
 * inject a `<style>` into `document.head` exactly once per document, SSR-safe
 * and idempotent. That plumbing lives here once; the owners pass their id and
 * CSS.
 */

export interface InjectStylesheetOnceParams {
  /** The `<style>` element's document-unique id — the owner's registry key. */
  id: string;
  /** The full stylesheet text the element carries. */
  css: string;
}

/**
 * Ids this module copy has already injected (or found already present).
 * Module-level so repeat calls short-circuit without touching the DOM.
 */
const injectedIds = new Set<string>();

/**
 * Injects a stylesheet into `document.head` exactly once per id.
 *
 * No-op on the server (SSR-safe) and when an element with the id already
 * exists — two copies of the package on one page share the first copy's
 * stylesheet. The SSR return does **not** mark the id as injected, so a
 * later client-side call still injects.
 */
export const injectStylesheetOnce = ({
  id,
  css,
}: InjectStylesheetOnceParams): void => {
  if (injectedIds.has(id)) return;
  const doc: Document | undefined = globalThis.document;
  if (doc === undefined) return;
  if (doc.getElementById(id) !== null) {
    injectedIds.add(id);
    return;
  }
  const style = doc.createElement('style');
  style.id = id;
  style.textContent = css;
  doc.head.appendChild(style);
  injectedIds.add(id);
};
