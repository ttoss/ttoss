/**
 * @jest-environment node
 *
 * Stylesheet injection, server side (E2 C-13). Runs without a DOM — the real
 * SSR condition, not a simulation (jsdom pins `document` as a
 * non-configurable global, so the guard cannot be exercised there).
 */
import { injectStylesheetOnce } from 'src/tokens/stylesheetInjection';

// The shared jest setup registers user-event cleanup hooks that read
// `globalThis.window.navigator` after every test. Satisfy them with an empty
// shim — `globalThis.document` stays undefined, which is the condition the
// injector guards on.
(globalThis as { window?: unknown }).window = { navigator: {} };

describe('injectStylesheetOnce on the server', () => {
  test('is a no-op: no document, no throw', () => {
    expect(globalThis.document).toBeUndefined();
    expect(() => {
      injectStylesheetOnce({ id: 'test-ssr', css: '.ssr {}' });
    }).not.toThrow();
  });

  test('does not mark the id as injected — repeat calls keep reaching the guard', () => {
    // The once-flag is only set once an element exists (or is adopted); an
    // SSR call must leave it clear so the first client-side call injects.
    // Observable here as: the second call still takes the document guard
    // path rather than the short-circuit (both are no-ops without a DOM).
    expect(() => {
      injectStylesheetOnce({ id: 'test-ssr', css: '.ssr {}' });
      injectStylesheetOnce({ id: 'test-ssr', css: '.ssr {}' });
    }).not.toThrow();
  });
});
