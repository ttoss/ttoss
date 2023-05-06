import { Modal } from '../../src';
import { render, screen } from '@ttoss/test-utils';

const modalMessage = 'This is a modal.';

test('modal should open', () => {
  render(
    <Modal isOpen={true} ariaHideApp={false}>
      <p>{modalMessage}</p>
    </Modal>
  );

  expect(screen.getByText(modalMessage)).toBeInTheDocument();
});

test('modal should not open', () => {
  render(
    <Modal isOpen={false} ariaHideApp={false}>
      <p>{modalMessage}</p>
    </Modal>
  );

  expect(screen.queryByText(modalMessage)).not.toBeInTheDocument();
});
