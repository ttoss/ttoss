import { fireEvent, render, screen } from '@ttoss/test-utils/react';

import { OpenApiRequestError } from '../../../src';
import { extractServerFieldErrors } from '../../../src/form/serverErrors';
import { Dialog } from '../../../src/ui/Dialog';

const requestError = (body: unknown) => {
  return new OpenApiRequestError({ status: 422, body, message: 'Invalid' });
};

test('reads field errors in the shapes APIs use', () => {
  expect(
    extractServerFieldErrors(
      requestError({
        errors: [
          { path: ['address', 'city'], message: 'Unknown city.' },
          { name: 'email', message: 'Taken.' },
          { message: 'No field.' },
          null,
        ],
      })
    )
  ).toEqual({ 'address.city': 'Unknown city.', email: 'Taken.' });
  expect(
    extractServerFieldErrors(
      requestError({ field_errors: { name: 'Too short.', age: 3 } })
    )
  ).toEqual({ name: 'Too short.' });
  expect(extractServerFieldErrors(requestError({ errors: 'oops' }))).toEqual(
    {}
  );
  expect(extractServerFieldErrors(requestError(null))).toEqual({});
  expect(extractServerFieldErrors(new Error('x'))).toEqual({});
});

test('closes the dialog on Escape', () => {
  const onClose = jest.fn();
  const { rerender } = render(<Dialog open onClose={onClose} title="Title" />);
  const dialog = screen.getByRole('dialog');
  fireEvent(dialog, new Event('cancel', { cancelable: true }));
  expect(onClose).toHaveBeenCalledTimes(1);
  rerender(<Dialog open={false} onClose={onClose} title="Title" />);
  expect(dialog).not.toHaveAttribute('open');
});
