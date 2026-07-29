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

  test('shows only the search glyph while there is nothing to clear', () => {
    renderSearch();

    // This test used to assert the opposite — two glyphs and a clear button on an
    // empty field — and it was pinning a defect. React Aria publishes emptiness
    // as `data-empty` for CSS, this package ships no CSS, so the button rendered
    // unconditionally while a comment claimed React Aria hid it (forms item D).
    expect(document.querySelectorAll('[data-scope="icon"]').length).toBe(1);
    expect(
      screen.queryByRole('button', { name: 'Clear search' })
    ).not.toBeInTheDocument();
  });

  test('the clear button appears once there is a value', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'a');

    expect(
      screen.getByRole('button', { name: 'Clear search' })
    ).toBeInTheDocument();
    expect(document.querySelectorAll('[data-scope="icon"]').length).toBe(2);
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

  test('the one-line form renders the whole envelope from props', () => {
    render(
      <SearchField
        clearLabel="Clear search"
        label="Search"
        description="Name or email."
        errorMessage="Too short."
        placeholder="Type a name"
        isInvalid
      />
    );

    // New in item D. Before it, props rendered nothing but the root — so this
    // component was the family's one member with no one-line form, and the
    // envelope reached only its slot label.
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveAttribute(
      'placeholder',
      'Type a name'
    );
    expect(screen.getByText('Name or email.')).toBeVisible();
    expect(screen.getByText('Too short.')).toBeVisible();
  });

  test('sub-parts throw when rendered outside a SearchField', () => {
    expect(() => {
      return render(<SearchFieldLabel>x</SearchFieldLabel>);
    }).toThrow(/must be rendered inside <SearchField>/);
  });
});
