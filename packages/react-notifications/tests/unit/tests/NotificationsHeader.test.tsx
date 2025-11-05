import { cleanup, render, screen, userEvent } from '@ttoss/test-utils/react';
import Modal from 'react-modal';
import { NotificationsHeader } from 'src/NotificationsHeader';
import {
  Notification,
  NotificationsProvider,
  useNotifications,
} from 'src/Provider';

Modal.setAppElement(document.createElement('div'));

const HEADER_NOTIFICATION_MESSAGE = 'header notification test';

describe('Notifications Header Test', () => {
  const user = userEvent.setup({ delay: null });

  afterEach(() => {
    cleanup();
  });

  const Component = ({ notification }: { notification: Notification }) => {
    const { addNotification } = useNotifications();

    return (
      <div>
        <NotificationsHeader />
        <button
          onClick={() => {
            addNotification(notification);
          }}
          type="button"
        >
          click
        </button>
      </div>
    );
  };

  test('should render header notification', async () => {
    render(
      <Component
        notification={{
          message: HEADER_NOTIFICATION_MESSAGE,
          type: 'info',
          viewType: 'header',
        }}
      />,
      { wrapper: NotificationsProvider }
    );

    expect(screen.getByRole('button')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));

    const notifications = screen.getAllByText(HEADER_NOTIFICATION_MESSAGE);
    expect(notifications.length).toBeGreaterThanOrEqual(1);
  });

  test('should not render notification if viewType is not header', async () => {
    render(
      <Component
        notification={{
          message: 'not header',
          type: 'info',
          viewType: 'modal',
        }}
      />,
      { wrapper: NotificationsProvider }
    );

    expect(screen.getByRole('button')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));

    const header = screen.queryByLabelText('Notifications Alt+T');

    expect(header).not.toHaveTextContent('not header');
  });
});
