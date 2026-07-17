/**
 * Meter — Feedback-entity static quantity over RAC `Meter` (role="meter").
 *
 * Verifies it exposes its identity + role, renders the value, and rotates
 * chrome by evaluation. (Distinct from ProgressBar: no indeterminate mode.)
 */
import { render, screen } from '@testing-library/react';
import { Meter } from 'src/index';

describe('Meter', () => {
  test('renders the meter identity and role with the value', () => {
    render(<Meter aria-label="Storage" label="Storage used" value={82} />);
    const root = document.querySelector(
      '[data-scope="meter"][data-part="root"]'
    );
    expect(root).not.toBeNull();
    const meter = screen.getByRole('meter', { name: 'Storage' });
    expect(meter).toHaveAttribute('aria-valuenow', '82');
  });

  test('renders the visible label and formatted value', () => {
    render(<Meter aria-label="Storage" label="Storage used" value={40} />);
    expect(
      document.querySelector('[data-scope="meter"][data-part="title"]')
    ).toHaveTextContent('Storage used');
    expect(
      document.querySelector('[data-scope="meter"][data-part="status"]')
    ).toHaveTextContent('40%');
  });

  test('reflects the evaluation on data-evaluation', () => {
    render(<Meter aria-label="Battery" value={12} evaluation="negative" />);
    const root = document.querySelector(
      '[data-scope="meter"][data-part="root"]'
    );
    expect(root).toHaveAttribute('data-evaluation', 'negative');
  });

  test('hides the value label when showValueLabel is false', () => {
    render(
      <Meter
        aria-label="Storage"
        label="Storage used"
        value={40}
        showValueLabel={false}
      />
    );
    expect(
      document.querySelector('[data-scope="meter"][data-part="status"]')
    ).toBeNull();
  });
});
