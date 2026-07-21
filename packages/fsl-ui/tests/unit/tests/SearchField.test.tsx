/**
 * SearchField — search Input composite (consumes the internal Icon layer).
 *
 * Verifies it renders a labelled searchbox with the search + clear glyphs, the
 * clear button uses the caller-supplied (i18n) label and clears the value, and
 * sub-parts are scope-guarded.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchField, SearchFieldControl, SearchFieldLabel } from 'src/index';

const renderSearch = () => {
  return render(
    <SearchField clearLabel="Clear search">
      <SearchFieldLabel>Search</SearchFieldLabel>
      <SearchFieldControl />
    </SearchField>
  );
};

describe('SearchField', () => {
  test('renders a labelled searchbox', () => {
    renderSearch();
    const control = screen.getByRole('searchbox', { name: 'Search' });
    expect(control.tagName.toLowerCase()).toBe('input');
  });

  test('renders the leading search glyph and the clear button (Icon layer)', () => {
    renderSearch();
    // Two iconify-icons: search (leading) + close (clear button).
    const glyphs = document.querySelectorAll('[data-scope="icon"]');
    expect(glyphs.length).toBe(2);
    expect(
      screen.getByRole('button', { name: 'Clear search' })
    ).toBeInTheDocument();
  });

  test('the clear button empties the value', async () => {
    const user = userEvent.setup();
    renderSearch();
    const control = screen.getByRole('searchbox', { name: 'Search' });
    await user.type(control, 'hello');
    expect(control).toHaveValue('hello');
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(control).toHaveValue('');
  });

  test('sub-parts throw when rendered outside a SearchField', () => {
    expect(() => {
      return render(<SearchFieldLabel>x</SearchFieldLabel>);
    }).toThrow(/must be rendered inside <SearchField>/);
  });
});
