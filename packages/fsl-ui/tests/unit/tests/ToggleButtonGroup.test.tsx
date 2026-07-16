/**
 * ToggleButtonGroup — Selection-entity container over ToggleButton items.
 *
 * Verifies the group manages set membership (single-select deselects the
 * previous choice), exposes its identity, and supports roving-focus arrow
 * navigation between items (React Aria).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleButton, ToggleButtonGroup } from 'src/index';

const renderGroup = () => {
  return render(
    <ToggleButtonGroup selectionMode="single" aria-label="view">
      <ToggleButton id="grid">Grid</ToggleButton>
      <ToggleButton id="list">List</ToggleButton>
    </ToggleButtonGroup>
  );
};

describe('ToggleButtonGroup', () => {
  test('renders the group identity', () => {
    renderGroup();
    const root = document.querySelector(
      '[data-scope="toggle-button-group"][data-part="root"]'
    );
    expect(root).not.toBeNull();
  });

  test('single-select: choosing one deselects the other', async () => {
    const user = userEvent.setup();
    renderGroup();
    const grid = screen.getByRole('radio', { name: 'Grid' });
    const list = screen.getByRole('radio', { name: 'List' });

    await user.click(grid);
    expect(grid).toHaveAttribute('aria-checked', 'true');
    expect(list).toHaveAttribute('aria-checked', 'false');

    await user.click(list);
    expect(grid).toHaveAttribute('aria-checked', 'false');
    expect(list).toHaveAttribute('aria-checked', 'true');
  });

  test('arrow keys move focus between items (roving tabindex)', async () => {
    const user = userEvent.setup();
    renderGroup();
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Grid' })).toHaveFocus();
    await user.keyboard('[ArrowRight]');
    expect(screen.getByRole('radio', { name: 'List' })).toHaveFocus();
  });
});
