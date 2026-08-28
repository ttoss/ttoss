/**
 * Stylesheet injection — the shared inject-once mechanism (E2 C-13).
 *
 * The owners (`keyframes.ts`, `nativeFieldDecorations.ts`) keep their own
 * elements, ids and content invariants; what is shared is only the plumbing
 * pinned here: exactly one `<style>` per id and adoption of an element
 * another copy of the package already injected. The server-side no-op is
 * pinned by `stylesheetInjection.ssr.test.ts`, which runs without a DOM —
 * jsdom pins `document` as a non-configurable global, so SSR cannot be
 * simulated in this environment.
 */
import { injectStylesheetOnce } from 'src/tokens/stylesheetInjection';

describe('injectStylesheetOnce', () => {
  test('injects the stylesheet once per id and is idempotent', () => {
    injectStylesheetOnce({ id: 'test-once', css: '.a { color: red; }' });
    injectStylesheetOnce({ id: 'test-once', css: '.a { color: red; }' });
    const styles = document.querySelectorAll('#test-once');
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toBe('.a { color: red; }');
    expect(styles[0]?.parentElement).toBe(document.head);
  });

  test('distinct ids stay distinct elements (owners never share one)', () => {
    injectStylesheetOnce({ id: 'test-owner-a', css: '.a {}' });
    injectStylesheetOnce({ id: 'test-owner-b', css: '.b {}' });
    expect(document.getElementById('test-owner-a')?.textContent).toBe('.a {}');
    expect(document.getElementById('test-owner-b')?.textContent).toBe('.b {}');
  });

  test('adopts an element another module copy already injected', () => {
    // Simulate a second copy of the package: the document already carries
    // the element, so the call marks it injected without duplicating or
    // rewriting it.
    const existing = document.createElement('style');
    existing.id = 'test-preexisting';
    existing.textContent = '.first-copy {}';
    document.head.appendChild(existing);

    injectStylesheetOnce({ id: 'test-preexisting', css: '.second-copy {}' });

    const styles = document.querySelectorAll('#test-preexisting');
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toBe('.first-copy {}');
  });
});
