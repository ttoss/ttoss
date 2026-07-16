/**
 * ListBox — Collection container (informational) hosting Selection-pattern
 * items (input). See ADR-007 for the per-part entity split.
 *
 * Verifies identity, that items render as options, and that selection marks
 * the chosen item selected.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListBox, ListBoxItem } from 'src/index';

const renderListBox = () => {
  return render(
    <ListBox aria-label="Frameworks" selectionMode="single">
      <ListBoxItem id="react">React</ListBoxItem>
      <ListBoxItem id="vue">Vue</ListBoxItem>
    </ListBox>
  );
};

describe('ListBox', () => {
  test('renders the container identity and its options', () => {
    renderListBox();
    expect(
      document.querySelector('[data-scope="list-box"][data-part="root"]')
    ).not.toBeNull();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  test('selecting an option marks it selected', async () => {
    const user = userEvent.setup();
    renderListBox();
    const react = screen.getByRole('option', { name: 'React' });
    await user.click(react);
    expect(react).toHaveAttribute('aria-selected', 'true');
  });

  test('arrow keys move focus between options', async () => {
    const user = userEvent.setup();
    renderListBox();
    await user.tab();
    // The listbox takes focus and points at the first option.
    await user.keyboard('[ArrowDown]');
    expect(screen.getByRole('option', { name: 'Vue' })).toHaveFocus();
  });
});
