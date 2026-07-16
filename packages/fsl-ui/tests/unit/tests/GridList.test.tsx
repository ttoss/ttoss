/**
 * GridList — Collection container (informational) hosting Selection-pattern
 * rows (input) with a per-row selectionControl. See ADR-007.
 *
 * Verifies identity, row rendering, the selection checkboxes, and that
 * toggling one marks its row selected.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GridList, GridListItem } from 'src/index';

const renderGridList = () => {
  return render(
    <GridList aria-label="Files" selectionMode="multiple">
      <GridListItem id="a" textValue="Report">
        Report.pdf
      </GridListItem>
      <GridListItem id="b" textValue="Notes">
        Notes.txt
      </GridListItem>
    </GridList>
  );
};

describe('GridList', () => {
  test('renders the container identity and its rows', () => {
    renderGridList();
    expect(
      document.querySelector('[data-scope="grid-list"][data-part="root"]')
    ).not.toBeNull();
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  test('renders a selectionControl per row', () => {
    renderGridList();
    expect(
      document.querySelectorAll(
        '[data-scope="grid-list"][data-part="selectionControl"]'
      )
    ).toHaveLength(2);
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  test('toggling a row checkbox marks that row selected', async () => {
    const user = userEvent.setup();
    renderGridList();
    const [firstCheckbox] = screen.getAllByRole('checkbox');
    await user.click(firstCheckbox);
    const firstRow = screen.getAllByRole('row')[0];
    expect(firstRow).toHaveAttribute('aria-selected', 'true');
  });
});
