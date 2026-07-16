/**
 * TagGroup — Selection-entity list of removable/selectable tags.
 *
 * Verifies identity, that a chosen tag reflects the `selected` State (set
 * membership — not `pressed`), and that removable tags fire `onRemove`.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag, TagGroup } from 'src/index';

describe('TagGroup', () => {
  test('renders the group identity, label, and tags', () => {
    render(
      <TagGroup label="Filters">
        <Tag id="react">React</Tag>
        <Tag id="vue">Vue</Tag>
      </TagGroup>
    );
    expect(
      document.querySelector('[data-scope="tag-group"][data-part="root"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-scope="tag-group"][data-part="label"]')
    ).toHaveTextContent('Filters');
    expect(
      document.querySelectorAll('[data-scope="tag-group"][data-part="item"]')
    ).toHaveLength(2);
  });

  test('a chosen tag reflects the selected state (set membership)', async () => {
    const user = userEvent.setup();
    render(
      <TagGroup label="Filters" selectionMode="multiple">
        <Tag id="react">React</Tag>
        <Tag id="vue">Vue</Tag>
      </TagGroup>
    );
    const react = screen.getByText('React').closest('[data-part="item"]');
    await user.click(react as Element);
    expect(react).toHaveAttribute('data-selected', 'true');
  });

  test('removable tags fire onRemove with the tag key', async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    render(
      <TagGroup label="Filters" onRemove={onRemove} removeLabel="Remove">
        <Tag id="react">React</Tag>
      </TagGroup>
    );
    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith(new Set(['react']));
  });
});
