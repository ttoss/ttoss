/**
 * Slider — Input-entity value selector over RAC `Slider`.
 *
 * Verifies identity, that the label + output render, keyboard adjustment, and
 * a two-thumb range renders two slider inputs.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from 'src/index';

describe('Slider', () => {
  test('renders the root identity, label, and value output', () => {
    render(<Slider label="Volume" defaultValue={50} />);
    expect(
      document.querySelector('[data-scope="slider"][data-part="root"]')
    ).not.toBeNull();
    expect(
      document.querySelector('[data-scope="slider"][data-part="label"]')
    ).toHaveTextContent('Volume');
    // RAC renders a native <input type="range"> (role="slider") — the value
    // lives in `value`, not `aria-valuenow`.
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('50');
    expect(
      document.querySelector('[data-scope="slider"][data-part="status"]')
    ).toHaveTextContent('50');
  });

  test('arrow keys adjust the value', async () => {
    const user = userEvent.setup();
    render(<Slider label="Volume" defaultValue={50} />);
    await user.tab();
    const slider = screen.getByRole('slider', { name: 'Volume' });
    expect(slider).toHaveFocus();
    await user.keyboard('[ArrowRight]');
    expect(slider).toHaveValue('51');
  });

  test('a range value renders two thumbs', () => {
    render(<Slider label="Price" defaultValue={[20, 80]} />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
    expect(
      document.querySelectorAll('[data-scope="slider"][data-part="control"]')
    ).toHaveLength(2);
  });

  test('can hide the value output', () => {
    render(<Slider label="Volume" defaultValue={50} showOutput={false} />);
    expect(
      document.querySelector('[data-scope="slider"][data-part="status"]')
    ).toBeNull();
  });
});
