/**
 * Group — Structure-entity grouping frame over RAC `Group` (role="group").
 *
 * Verifies it exposes its identity, associates an optional visible label with
 * the region for an accessible name, and reflects the authorial evaluation.
 */
import { render, screen } from '@testing-library/react';
import { Group } from 'src/index';

describe('Group', () => {
  test('renders the group identity and role', () => {
    render(
      <Group label="Filters">
        <button type="button">x</button>
      </Group>
    );
    const root = document.querySelector(
      '[data-scope="group"][data-part="root"]'
    );
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('role', 'group');
  });

  test('a visible label names the region via aria-labelledby', () => {
    render(
      <Group label="Shipping address">
        <button type="button">x</button>
      </Group>
    );
    // The region is reachable by its accessible name derived from the label.
    expect(
      screen.getByRole('group', { name: 'Shipping address' })
    ).toBeInTheDocument();
    const label = document.querySelector(
      '[data-scope="group"][data-part="label"]'
    );
    expect(label).toHaveTextContent('Shipping address');
  });

  test('renders no label element when label is omitted', () => {
    render(
      <Group aria-label="unlabelled">
        <button type="button">x</button>
      </Group>
    );
    expect(
      document.querySelector('[data-scope="group"][data-part="label"]')
    ).toBeNull();
  });

  test('reflects the evaluation on data-evaluation', () => {
    render(
      <Group label="g" evaluation="muted">
        <button type="button">x</button>
      </Group>
    );
    const root = document.querySelector(
      '[data-scope="group"][data-part="root"]'
    );
    expect(root).toHaveAttribute('data-evaluation', 'muted');
  });
});
