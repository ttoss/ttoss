/**
 * Separator — the first pure-Structure atomic.
 *
 * Verifies the divider paints a single *logical* edge (RTL-safe) chosen by
 * orientation, exposes the correct ARIA role, and reads its color from the
 * evaluation's `informational` border token.
 */
import { render } from '@testing-library/react';
import { vars } from '@ttoss/fsl-theme/vars';
import { Separator } from 'src/index';

const getRoot = (): HTMLElement => {
  const el = document.querySelector<HTMLElement>(
    '[data-scope="separator"][data-part="root"]'
  );
  if (!el) throw new Error('separator not rendered');
  return el;
};

describe('Separator', () => {
  test('horizontal (default) paints the block-start edge, never a physical one', () => {
    render(<Separator />);
    const root = getRoot();
    expect(root.style.borderBlockStartStyle).toBe(vars.border.divider.style);
    expect(root.style.borderBlockStartWidth).toBe(vars.border.divider.width);
    // No physical edge leaked in.
    expect(root.style.borderTopStyle).toBe('');
    expect(root.style.borderLeftStyle).toBe('');
  });

  test('vertical paints the inline-start edge', () => {
    render(<Separator orientation="vertical" />);
    const root = getRoot();
    expect(root.style.borderInlineStartStyle).toBe(vars.border.divider.style);
    expect(root.getAttribute('aria-orientation')).toBe('vertical');
  });

  test('defaults to the muted evaluation and reflects it via data-evaluation', () => {
    render(<Separator />);
    expect(getRoot()).toHaveAttribute('data-evaluation', 'muted');
  });

  test('accepts the primary evaluation', () => {
    render(<Separator evaluation="primary" />);
    const root = getRoot();
    expect(root).toHaveAttribute('data-evaluation', 'primary');
    expect(root.style.borderBlockStartColor).toBe(
      vars.colors.informational.primary?.border?.default
    );
  });
});
