// Distinct subpath exports; import-x sees one module because they share a
// single `data.d.ts` for types.
// eslint-disable-next-line import-x/no-duplicates
import alertIcon from '@iconify-icons/mdi-light/alert';
// eslint-disable-next-line import-x/no-duplicates
import arrowLeftIcon from '@iconify-icons/mdi-light/arrow-left';
import { render, screen } from '@ttoss/test-utils/react';

import { Button } from '../../../src';

test('should render right icon', () => {
  render(<Button rightIcon={alertIcon}>Click me</Button>);
  expect(screen.getByTestId('iconify-icon')).toBeInTheDocument();
});

test('should render left icon', () => {
  render(<Button leftIcon={arrowLeftIcon}>Click me</Button>);
  expect(screen.getByTestId('iconify-icon')).toBeInTheDocument();
});

test('should render left and right icon', () => {
  render(
    <Button leftIcon={alertIcon} rightIcon={arrowLeftIcon}>
      Click me
    </Button>
  );
  expect(screen.getAllByTestId('iconify-icon')).toHaveLength(2);
});

test('button should have type="button" by default', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
});

test('button should have type="submit"', () => {
  render(<Button type="submit">Click me</Button>);
  expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
});
