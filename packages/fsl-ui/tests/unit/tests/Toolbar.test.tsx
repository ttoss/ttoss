/**
 * Toolbar — Structure-entity actions bar over RAC `Toolbar` (role="toolbar").
 *
 * Verifies it exposes its identity + role, reflects the evaluation, and
 * provides arrow-key roving navigation between its controls (React Aria).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Toolbar } from 'src/index';

const renderToolbar = () => {
  return render(
    <Toolbar aria-label="Formatting">
      <Button aria-label="Bold">B</Button>
      <Button aria-label="Italic">I</Button>
    </Toolbar>
  );
};

describe('Toolbar', () => {
  test('renders the toolbar identity and role', () => {
    renderToolbar();
    const root = document.querySelector(
      '[data-scope="toolbar"][data-part="root"]'
    );
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('role', 'toolbar');
  });

  test('reflects the evaluation on data-evaluation', () => {
    render(
      <Toolbar aria-label="t" evaluation="muted">
        <Button>x</Button>
      </Toolbar>
    );
    const root = document.querySelector(
      '[data-scope="toolbar"][data-part="root"]'
    );
    expect(root).toHaveAttribute('data-evaluation', 'muted');
  });

  test('arrow keys move focus between controls (roving tabindex)', async () => {
    const user = userEvent.setup();
    renderToolbar();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
    await user.keyboard('[ArrowRight]');
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveFocus();
    await user.keyboard('[ArrowLeft]');
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus();
  });
});
