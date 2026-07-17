/**
 * Switch — RTL correctness of the thumb positioning (audit A8).
 *
 * The thumb must be positioned with the logical `insetInlineStart`
 * property so that under `dir="rtl"` it slides toward the visual left
 * when selected — a physical `left:` would move it the wrong way.
 */
import { fireEvent, render } from '@testing-library/react';
import { Switch } from 'src/index';

const getThumb = (container: HTMLElement): HTMLElement => {
  const thumb = container.querySelector<HTMLElement>(
    '[data-scope="switch"][data-part="indicator"]'
  );
  if (!thumb) throw new Error('thumb not rendered');
  return thumb;
};

describe('Switch — logical thumb positioning', () => {
  test('thumb is placed with insetInlineStart, never with left', () => {
    const { container } = render(<Switch>Notifications</Switch>);
    const thumb = getThumb(container);
    expect(thumb.style.insetInlineStart).not.toBe('');
    expect(thumb.style.left).toBe('');
    expect(thumb.style.insetBlockStart).not.toBe('');
    expect(thumb.style.top).toBe('');
  });

  test('selection moves the thumb along the inline axis', () => {
    const { container } = render(<Switch>Notifications</Switch>);
    const off = getThumb(container).style.insetInlineStart;
    fireEvent.click(
      container.querySelector('input[role="switch"]') as HTMLElement
    );
    const on = getThumb(container).style.insetInlineStart;
    expect(on).not.toBe(off);
    expect(on).toContain('calc(');
  });

  test('transition animates the logical property (inset-inline-start)', () => {
    const { container } = render(<Switch>Notifications</Switch>);
    const thumb = getThumb(container);
    expect(thumb.style.transitionProperty).toContain('inset-inline-start');
    expect(thumb.style.transitionProperty).not.toContain('left');
  });
});
